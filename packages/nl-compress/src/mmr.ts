import type { Segment } from "./segment"

function tokenSet(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[a-z0-9_]+/g) ?? []).filter((w) => w.length > 2))
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter((x) => b.has(x)))
  const uni = new Set([...a, ...b])
  return inter.size / Math.max(1, uni.size)
}

export function selectMMR(segs: Segment[], scores: number[], lambda = 0.8, limit?: number): number[] {
  const idxs = segs.map((_, i) => i).sort((a, b) => scores[b] - scores[a])
  const keep: number[] = []
  const sets = segs.map((s) => tokenSet(s.text))
  while (idxs.length) {
    let best = idxs[0]
    let bestVal = -Infinity
    for (const i of idxs) {
      const sim = keep.length ? Math.max(...keep.map((j) => jaccard(sets[i], sets[j]))) : 0
      const val = lambda * scores[i] - (1 - lambda) * sim
      if (val > bestVal) { bestVal = val; best = i }
    }
    keep.push(best)
    idxs.splice(idxs.indexOf(best), 1)
    if (limit && keep.length >= limit) break
  }
  return keep.sort((a, b) => segs[a].start - segs[b].start)
}

