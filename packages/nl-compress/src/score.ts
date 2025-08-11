import type { Segment } from "./segment"

export interface ScoreOpts { keywords?: string[] }

export function scoreSegments(segs: Segment[], opts: ScoreOpts = {}): number[] {
  const xs: number[] = []
  const kws = new Set((opts.keywords ?? []).map((k) => k.toLowerCase()))
  const n = segs.length || 1
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    let sc = 0
    if (s.kind === "stack") sc += 6
    if (s.kind === "code") sc += 3
    if (s.kind === "para") sc += 2
    sc += (n - i) / n
    const low = s.text.toLowerCase()
    let hits = 0
    for (const k of kws) if (low.includes(k)) hits++
    sc += Math.min(4, hits)
    if (/(error|exception|assert|fail|expected|received)/i.test(s.text)) sc += 2
    xs.push(sc)
  }
  return xs
}

