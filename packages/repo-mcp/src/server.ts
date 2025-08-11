import { ZReadSpanArgs, ZSearchArgs, ZSelectArgs, ZSkeletonArgs, ZCompressArgs, ZSessionStartArgs, ZRecallArgs, ZExpandArgs } from "./schemas.js"
import { buildIndex, ensureWatcher, getIndex } from "@opencode/repo-index/dist/src/index.js"
import { selectWorkingSet } from "@opencode/repo-index/dist/src/working-set.js"
import { skeletonizeFile } from "@opencode/repo-index/dist/src/skeleton.js"
import { grepKeywords, keywordsFromTask, grepRegex } from "@opencode/repo-index/dist/src/search.js"
import { normalizeAndCheck, readSpan } from "./paths.js"
import { resolve } from "path"
import crypto from "crypto"
import { logSpan, logWorkingSet } from "./logging.js"
import { readExposures, mergeExposures } from "@opencode/metrics/dist/exposure.js"
import { diffHunks } from "@opencode/metrics/dist/git.js"
import { computeRecall } from "@opencode/metrics/dist/recall.js"
import { readFileSync } from "fs"

const tools = [
  { name: "repo.graphBuild", description: "Build or refresh the repository index and start a file watcher.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "repo.info.stats", description: "Return index summary counts for debugging.", inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "repo.session.start", description: "Start a metrics session; resets exposure log grouping.", inputSchema: (ZSessionStartArgs as any).toJSON ? (ZSessionStartArgs as any).toJSON() : { type: "object", properties: { label: { type: "string" } }, additionalProperties: false } },
  {
    name: "repo.workingSet.select",
    description: "Select a token-budgeted Context Pack for a task.",
    inputSchema: {
      type: "object",
      properties: { task: { type: "string" }, budgetTokens: { type: "number" }, radius: { enum: [1, 2] }, preferSpanContext: { type: "boolean" }, windowLines: { type: "number" } },
      required: ["task"],
      additionalProperties: false,
    },
  },
  {
    name: "repo.code.readSpan",
    description: "Read a file slice by line numbers (inclusive).",
    inputSchema: { type: "object", properties: { path: { type: "string" }, start: { type: "number" }, end: { type: "number" } }, required: ["path", "start", "end"], additionalProperties: false },
  },
  { name: "repo.code.skeleton", description: "Return a skeleton view and elision metadata for a file.", inputSchema: { type: "object", properties: { path: { type: "string" } }, required: ["path"], additionalProperties: false } },
  {
    name: "repo.code.search",
    description: "Find lines matching keywords/patterns (simple grep).",
    inputSchema: { type: "object", properties: { pattern: { type: "string" }, globs: { type: "array", items: { type: "string" } }, maxHits: { type: "number" } }, required: ["pattern"], additionalProperties: false },
  },
  {
    name: "repo.nl.compress",
    description: "Extractively compress NL text to a token budget (faithful).",
    inputSchema: { type: "object", properties: { text: { type: "string" }, budgetTokens: { type: "number" }, keywords: { type: "array", items: { type: "string" } } }, required: ["text", "budgetTokens"], additionalProperties: false },
  },
  { name: "repo.metrics.checkRecall", description: "Compute line-recall against git diff for this session.", inputSchema: (ZRecallArgs as any).toJSON ? (ZRecallArgs as any).toJSON() : { type: "object", properties: { sessionId: { type: "string" }, baseRef: { type: "string" }, headRef: { type: "string" } }, required: ["sessionId"], additionalProperties: false } },
  { name: "repo.frontier.expand", description: "Re-select working set with increased radius; for recall misses.", inputSchema: (ZExpandArgs as any).toJSON ? (ZExpandArgs as any).toJSON() : { type: "object", properties: { task: { type: "string" }, sessionId: { type: "string" }, radiusDelta: { type: "number" }, budgetTokens: { type: "number" } }, required: ["task", "sessionId"], additionalProperties: false } },
]

export async function startServer() {
  const root = process.env.REPO_ROOT ? resolve(process.env.REPO_ROOT) : process.cwd()
  console.error("MCP:READY")
  let buf = ""
  process.stdin.setEncoding("utf8")
  process.stdin.on("data", async (chunk: string) => {
    buf += chunk
    const parts = buf.split(/\r?\n/)
    buf = parts.pop() ?? ""
    for (const s of parts) {
      if (!s) continue
      let req: any = undefined
      try { req = JSON.parse(s) } catch {}
      const id = req?.id ?? null
      if (req?.method === "tools/list") {
        const result = { tools }
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n")
        continue
      }
      if (req?.method === "tools/call") {
        const name: string | undefined = req?.params?.name
        const args: unknown = req?.params?.arguments ?? {}
        try {
        console.error("MCP:CALL", name)
        if (name === "repo.session.start") {
          const _ = ZSessionStartArgs.parse(args ?? {})
          const sessionId = crypto.randomUUID()
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { sessionId } }) + "\n")
          continue
        }
        if (name === "repo.graphBuild") {
          console.error("MCP:DOGB:start")
          await buildIndex(root)
          ensureWatcher(root)
          const idx = getIndex()
          const result = { ok: true, root, updatedAt: idx.updatedAt, files: idx.files.length, symbols: idx.symbols.length, edges: idx.edges.length }
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n")
          console.error("MCP:DOGB:done")
          continue
        }
        if (name === "repo.info.stats") {
          const idx = getIndex()
          const result = { ok: true, root, files: idx.files.length, symbols: idx.symbols.length, edges: idx.edges.length, updatedAt: idx.updatedAt }
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n")
          continue
        }
        if (name === "repo.workingSet.select") {
          const p = ZSelectArgs.parse(args ?? {})
          console.error("MCP:DOWS:start")
          const { pack, debug } = await selectWorkingSet(root, p)
          const fileLens = new Map<string, number>()
          for (const f of pack.full) {
            const rel = f.path
            const abs = resolve(root, rel)
            const nLines = readFileSync(abs, "utf8").split(/\r?\n/).length
            fileLens.set(rel, nLines)
          }
          const sessionId = (args as any)?.sessionId || (process.env.SESSION_ID ?? "")
          if (sessionId) logWorkingSet(sessionId as string, root, pack, fileLens)
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { pack, debug } }) + "\n")
          console.error("MCP:DOWS:done")
          continue
        }
        if (name === "repo.code.readSpan") {
          const p = ZReadSpanArgs.parse(args ?? {})
          const { abs, rel } = normalizeAndCheck(root, p.path)
          const result = readSpan(abs, p.start, p.end)
          const sha1 = crypto.createHash("sha1").update(result.text).digest("hex")
          const sessionId = (args as any)?.sessionId || (process.env.SESSION_ID ?? "")
          if (sessionId) logSpan(sessionId as string, root, rel, p.start, p.end)
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { path: rel, start: p.start, end: p.end, lines: result.total, sha1, text: result.text } }) + "\n")
          continue
        }
        if (name === "repo.code.skeleton") {
          const p = ZSkeletonArgs.parse(args ?? {})
          const { abs, rel } = normalizeAndCheck(root, p.path)
          const sk = skeletonizeFile(root, abs)
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { path: rel, text: sk.text, elisions: sk.elisions } }) + "\n")
          continue
        }
        if (name === "repo.code.search") {
          const p = ZSearchArgs.parse(args ?? {})
          const idx = getIndex()
          const files = (p.globs && p.globs.length)
            ? idx.files.filter((f) => {
                const rel = f.replace(root + "/", "")
                return p.globs!.some((g) => require("minimatch").minimatch(rel, g))
              })
            : idx.files
          // Regex support: '/expr/flags' pattern
          const m = /^\/(.*)\/([a-z]*)$/.exec(p.pattern)
          const hits = (() => {
            if (m) {
              const baseFlags = m[2] ?? ""
              const wantI = p.caseSensitive ? baseFlags.replace(/i/g, "") : baseFlags.includes("i") ? baseFlags : baseFlags + "i"
              const re = new RegExp(m[1], wantI)
              return grepRegex(root, files, re, 10)
            }
            const ks = keywordsFromTask(p.pattern)
            return grepKeywords(root, files, ks, 10, !!p.caseSensitive)
          })().slice(0, p.maxHits ?? 100)
          const result = { hits: hits.map((h) => ({ path: h.path.replace(root + "/", ""), line: h.line, text: h.text })) }
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n")
          continue
        }
        if (name === "repo.nl.compress") {
          const p = ZCompressArgs.parse(args ?? {})
          const { compress } = await import("@opencode/nl-compress/dist/index.js")
          const text = await compress(p.text, { budgetTokens: p.budgetTokens, keywords: p.keywords })
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { text } }) + "\n")
          continue
        }
        if (name === "repo.metrics.checkRecall") {
          const p = ZRecallArgs.parse(args ?? {})
          const logs = readExposures(p.sessionId)
          const exposure = mergeExposures(logs)
          const edits = diffHunks(p.baseRef, p.headRef, root)
          const recall = computeRecall(edits, exposure)
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { recall } }) + "\n")
          continue
        }
        if (name === "repo.frontier.expand") {
          const p = ZExpandArgs.parse(args ?? {})
          console.error("MCP:DOEX:start")
          const { pack, debug } = await selectWorkingSet(root, {
            task: p.task,
            radius: 2,
            budgetTokens: p.budgetTokens ?? 64000,
            preferSpanContext: true,
          })
          const fileLens = new Map<string, number>()
          for (const f of pack.full) {
            const n = readFileSync(resolve(root, f.path), "utf8").split(/\r?\n/).length
            fileLens.set(f.path, n)
          }
          logWorkingSet(p.sessionId, root, pack, fileLens)
          process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result: { pack, debug } }) + "\n")
          console.error("MCP:DOEX:done")
          continue
        }
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${name}` } }) + "\n")
      } catch (e: any) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message: String(e?.message ?? e) } }) + "\n")
      }
      continue
    }
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Unknown method" } }) + "\n")
    }
  })
  process.stdin.resume()
}
