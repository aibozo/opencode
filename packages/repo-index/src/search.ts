import { readFileSync } from "fs"

export interface GrepHit { path: string; line: number; text: string; score: number }

// Very simple in-memory grep over candidate files.
export function grepKeywords(root: string, files: string[], keywords: string[], maxPerFile = 5, caseSensitive = false): GrepHit[] {
  const out: GrepHit[] = []
  const needles = keywords.filter(Boolean)
  for (const f of files) {
    const lines = readFileSync(f, "utf8").split(/\r?\n/)
    let count = 0
    for (let i = 0; i < lines.length && count < maxPerFile; i++) {
      const L = lines[i]
      const src = caseSensitive ? L : L.toLowerCase()
      const hit = needles.some((n) => src.includes(caseSensitive ? n : n.toLowerCase()))
      if (hit) {
        out.push({ path: f, line: i + 1, text: L.slice(0, 200), score: 1 })
        count++
      }
    }
  }
  return out
}

export function keywordsFromTask(task: string): string[] {
  const quoted = [...task.matchAll(/["'`](.{2,64}?)[ "'`]/g)].map((m) => m[1])
  const camel = [...task.matchAll(/\b[A-Za-z_][A-Za-z0-9_]{2,}\b/g)].map((m) => m[0])
  return [...new Set([...quoted, ...camel])].slice(0, 50)
}

export function grepRegex(root: string, files: string[], re: RegExp, maxPerFile = 5): GrepHit[] {
  const out: GrepHit[] = []
  for (const f of files) {
    const lines = readFileSync(f, "utf8").split(/\r?\n/)
    let count = 0
    for (let i = 0; i < lines.length && count < maxPerFile; i++) {
      if (re.test(lines[i])) {
        out.push({ path: f, line: i + 1, text: lines[i].slice(0, 200), score: 1 })
        count++
      }
    }
  }
  return out
}
