// Demo: Node-only end-to-end MCP tool usage via stdio
// Run: node script/mcp-demo-node.mjs

import { spawn } from "node:child_process"
import { readFile, access } from "node:fs/promises"

async function main() {
  const env = { ...process.env }
  const root = env.REPO_ROOT ?? process.cwd()
  const rootArg = process.argv.find((a) => a === "--root") ? process.argv[process.argv.indexOf("--root") + 1] : undefined
  const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"], env: { ...env, ...(rootArg ? { REPO_ROOT: rootArg } : {}) } })

  let buf = ""
  proc.stdout.setEncoding("utf8")
  proc.stderr.setEncoding("utf8")
  let readySeen = false
  proc.stdout.on("data", (chunk) => { buf += String(chunk) })
  proc.stderr.on("data", (chunk) => { const s = String(chunk).trim(); if (s) { console.log("stderr:", s); if (s.includes("MCP:READY")) readySeen = true } })

  const line = async (timeoutMs = 5000) => {
    const t0 = Date.now()
    while (true) {
      const i = buf.indexOf("\n")
      if (i >= 0) {
        const s = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (!s) continue
        if (!s.startsWith("{")) { console.log("server:", s); continue }
        return s
      }
      if (Date.now() - t0 > timeoutMs) return ""
      await new Promise((r) => setTimeout(r, 10))
    }
  }
  const send = (obj) => { const ok = proc.stdin.write(JSON.stringify(obj) + "\n"); if (!ok) proc.stdin.once("drain", () => {}) }
  const rpc = async (id, method, params, timeoutMs = 5000) => { send({ jsonrpc: "2.0", id, method, params }); const s = await line(timeoutMs); return s ? JSON.parse(s) : null }

  // Wait briefly for readiness line
  const ready = await (async () => {
    const t0 = Date.now()
    while (Date.now() - t0 < 1500) {
      const i = buf.indexOf("\n")
      if (i >= 0) {
        const s = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
        if (s && !s.startsWith("{")) { console.log("server:", s); if (s.includes("MCP:READY")) return true }
      } else {
        await new Promise((r) => setTimeout(r, 25))
      }
    }
    return false
  })()
  if (!ready && readySeen) console.log("(ready on stderr)")
  if (!ready && !readySeen) console.log("(no ready line; proceeding anyway)")
  console.log("→ tools/list")
  const list = await rpc(1, "tools/list", undefined, 3000)
  if (!list) { console.log("No response to tools/list (timeout)"); proc.kill(); return }
  console.log("tools:", list?.result?.tools?.map((t) => t.name)?.join(", "))

  console.log("→ repo.graphBuild")
  const gb = await rpc(2, "tools/call", { name: "repo.graphBuild", arguments: {} }, 8000)
  if (!gb) { console.log("No response to graphBuild (timeout)"); proc.kill(); return }
  console.log("graph:", gb?.result?.files, "files,", gb?.result?.symbols, "symbols")

  const tspath = `${root}/fixtures/ts-mini/ISSUE.md`
  const pyspath = `${root}/fixtures/py-mini/ISSUE.md`
  const has = async (p) => access(p).then(() => true, () => false)
  const pick = (await has(tspath)) ? tspath : (await has(pyspath)) ? pyspath : ""
  const task = pick ? await readFile(pick, "utf8") : "Fix failing tests in repo"

  console.log("→ workingSet.select")
  const sel = await rpc(3, "tools/call", { name: "repo.workingSet.select", arguments: { task, budgetTokens: 3000, radius: 1 } }, 8000)
  if (!sel) { console.log("No response to workingSet.select (timeout)"); proc.kill(); return }
  const pack = sel?.result?.pack
  console.log("pack:", pack?.full?.length ?? 0, "full,", pack?.skeletons?.length ?? 0, "skeletons")

  const first = pack?.full?.[0]
  if (first) {
    const rng = Array.isArray(first.ranges) && first.ranges.length ? first.ranges[0] : [1, 80]
    console.log("→ code.readSpan", first.path, `[${rng[0]}-${rng[1]}]`)
    const rs = await rpc(4, "tools/call", { name: "repo.code.readSpan", arguments: { path: first.path, start: rng[0], end: rng[1] } }, 5000)
    console.log("span:", rs?.result?.path, `[${rs?.result?.start}-${rs?.result?.end}]`, rs?.result?.sha1)
  }

  const sk = pack?.skeletons?.[0]
  if (sk) {
    console.log("→ code.skeleton", sk.path)
    const out = await rpc(5, "tools/call", { name: "repo.code.skeleton", arguments: { path: sk.path } }, 5000)
    const txt = String(out?.result?.text ?? "")
    console.log("skeleton:", sk.path, txt.split(/\n/).slice(0, 2).join(" "))
  }

  console.log("→ code.search add")
  const sr = await rpc(6, "tools/call", { name: "repo.code.search", arguments: { pattern: "add", globs: ["**/*.{ts,py}"] } }, 5000)
  console.log("search:", sr?.result?.hits?.length ?? 0, "hits")

  proc.kill()
}

await main()
