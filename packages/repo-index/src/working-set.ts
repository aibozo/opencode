import { readFileSync } from "fs"
import { relative, resolve } from "path"
import type { ContextPack } from "@opencode/shared/src/types"
import type { RepoIndex } from "./types.js"
import { getIndex, buildIndex } from "./index.js"
import { extractStackHits } from "./stacktrace.js"
import { keywordsFromTask, grepKeywords } from "./search.js"
import { skeletonizeFile } from "./skeleton.js"
import { createTokenizer } from "./tokenize.js"
import { compress as nlCompress } from "@opencode/nl-compress"

const TEST_PAT = /(test[s]?\/|^tests\/|_test\.|^test_)/i

export interface SelectOptions {
  task: string
  budgetTokens?: number
  radius?: 1 | 2
  preferSpanContext?: boolean
  windowLines?: number
}

export interface SelectionDebug {
  scoreTable: Array<{ path: string; score: number; reasons: string[] }>
  tokens: { target: number; used: number; headroom: number }
}

export interface WorkingSetResult {
  pack: ContextPack
  debug: SelectionDebug
}

export async function selectWorkingSet(root: string, opts: SelectOptions): Promise<WorkingSetResult> {
  let idx: RepoIndex = getIndex()
  const wantRoot = resolve(root)
  if (!idx.root || idx.files.length === 0 || idx.root !== wantRoot) {
    idx = await buildIndex(root)
  }
  const budget = opts.budgetTokens ?? 64000
  const radius = opts.radius ?? 1
  const preferSpan = opts.preferSpanContext ?? true
  const windowLines = opts.windowLines ?? 60
  const tok = await createTokenizer()

  const stacks = extractStackHits(opts.task)
  const allFiles = idx.files
  const keywords = keywordsFromTask(opts.task)
  const grep = grepKeywords(root, allFiles, keywords)

  const table = new Map<string, { score: number; reasons: string[] }>()
  function bump(p: string, s: number, r: string) {
    const abs = resolve(p)
    const rel = relative(root, abs).replace(/\\/g, "/")
    const v = table.get(rel) ?? { score: 0, reasons: [] }
    v.score += s
    v.reasons.push(r)
    table.set(rel, v)
  }

  for (const h of stacks) bump(resolve(root, h.path), 8, `stack:${h.kind}`)
  for (const g of grep) bump(g.path, 2, "grep")
  for (const f of allFiles) if (TEST_PAT.test(f)) bump(f, 3, "test")

  const symByFile = new Map<string, string[]>()
  for (const s of idx.symbols) {
    const rel = relative(root, s.file).replace(/\\/g, "/")
    if (!symByFile.has(rel)) symByFile.set(rel, [])
    symByFile.get(rel)!.push(s.name)
  }
  const fileBySym = new Map<string, string>()
  for (const [f, syms] of symByFile) for (const s of syms) fileBySym.set(s, f)

  function neighbors(files: Set<string>, hops: number): Set<string> {
    let frontier = new Set(files)
    const seen = new Set(files)
    for (let i = 0; i < hops; i++) {
      const next = new Set<string>()
      for (const f of frontier) {
        const syms = symByFile.get(f) ?? []
        for (const e of idx.edges) {
          if (syms.includes(e.from)) {
            const nf = fileBySym.get(e.to)
            if (nf && !seen.has(nf)) {
              seen.add(nf)
              next.add(nf)
            }
          }
        }
      }
      frontier = next
    }
    return seen
  }

  const seedFiles = new Set<string>([...table.keys()])
  const withNeighbors = neighbors(seedFiles, radius)
  for (const nf of withNeighbors) if (!table.has(nf)) bump(nf, 1, `neighbor:${radius}h`)

  const ranked = [...table.entries()].sort((a, b) => b[1].score - a[1].score)

  const pack: ContextPack = { full: [], skeletons: [], interfaces: [], search_hits: [], notes: "", budget: { target: budget } }
  let used = 0

  function tokensForText(text: string) {
    return tok.estimateTokens(text)
  }

  const raw = opts.task.split(/\r?\n/).slice(0, 2000).join("\n")
  const notesBudget = Math.max(200, Math.floor(budget * 0.05))
  const kw = keywordsFromTask(opts.task)
  const brief = await nlCompress(raw, { budgetTokens: notesBudget, keywords: kw, keepAtLeast: 3 })
  pack.notes = brief
  used += tokensForText(brief)

  const addedFull = new Set<string>()
  function addFullSpan(absPath: string, hintLine?: number) {
    const rel = relative(root, absPath).replace(/\\/g, "/")
    if (addedFull.has(rel)) return
    const isTest = TEST_PAT.test(absPath)
    const ranges = preferSpan && !isTest && hintLine ? [[Math.max(1, hintLine - windowLines), hintLine + windowLines] as [number, number]] : undefined
    pack.full.push({ path: rel, ranges })
    addedFull.add(rel)
  }

  for (const h of stacks) addFullSpan(resolve(root, h.path), h.line)
  for (const f of allFiles.filter((f) => TEST_PAT.test(f))) addFullSpan(f)

  function fileSliceText(absPath: string, ranges?: [number, number][]) {
    const content = readFileSync(absPath, "utf8")
    if (!ranges || !ranges.length) return content
    const ls = content.split(/\r?\n/)
    const chunks = ranges.map(([a, b]) => ls.slice(a - 1, Math.min(b, ls.length)).join("\n"))
    return chunks.join("\n...\n")
  }
  for (const f of pack.full) used += tokensForText(fileSliceText(resolve(root, f.path), f.ranges))

  for (const [rel] of ranked) {
    if (addedFull.has(rel)) continue
    const abs = resolve(root, rel)
    const sk = skeletonizeFile(root, abs)
    const t = tokensForText(sk.text)
    if (used + t > budget) continue
    pack.skeletons.push({ path: rel, hash: sk.elisions.map((e) => e.sha1).join(",") })
    used += t
  }

  for (const rel of allFiles.map((p) => relative(root, p).replace(/\\/g, "/"))) {
    if (addedFull.has(rel) || pack.skeletons.find((s) => s.path === rel)) continue
    const content = readFileSync(resolve(root, rel), "utf8")
    if (/interface|type\s+\w+|enum|const\s+\w+\s*=/.test(content)) {
      const t = tokensForText(content)
      if (t < 200 && used + t <= budget) {
        pack.interfaces.push({ path: rel })
        used += t
      }
    }
  }

  pack.search_hits = grep.slice(0, 40).map((h) => ({ path: relative(root, h.path).replace(/\\/g, "/"), line: h.line, text: h.text }))

  const debug = { scoreTable: [...table.entries()].map(([path, v]) => ({ path, score: v.score, reasons: v.reasons })), tokens: { target: budget, used, headroom: Math.max(0, budget - used) } }
  pack.budget = { target: budget, used }

  return { pack, debug }
}
