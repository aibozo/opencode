import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname } from "node:path"

export interface DecisionEntry {
  ts: string
  why: string
  what: string
  next?: string
}

export interface DecisionState { entries: DecisionEntry[] }

const PATH = ".opencode/state/decision-log.json"

export function loadLog(): DecisionState {
  if (!existsSync(PATH)) return { entries: [] }
  try {
    const s = readFileSync(PATH, "utf8")
    const j = JSON.parse(s) as DecisionState
    return j && Array.isArray(j.entries) ? j : { entries: [] }
  } catch {
    return { entries: [] }
  }
}

export function appendDecision(e: Omit<DecisionEntry, "ts">) {
  const s = loadLog()
  s.entries.push({ ts: new Date().toISOString(), why: e.why, what: e.what, next: e.next })
  mkdirSync(dirname(PATH), { recursive: true })
  writeFileSync(PATH, JSON.stringify(s, null, 2))
}

export function summarize(limit = 10): string {
  const s = loadLog()
  const t = s.entries.slice(-limit)
  if (!t.length) return "(no prior decisions)"
  return t
    .map((x) => `- [${x.ts}] why: ${x.why} | what: ${x.what}${x.next ? ` | next: ${x.next}` : ""}`)
    .join("\n")
}

export function recentEdits(n = 20): string {
  return summarize(n)
}
