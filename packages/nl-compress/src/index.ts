import { segment } from "./segment.js"
import { scoreSegments } from "./score.js"
import { selectMMR } from "./mmr.js"
import { createTokenizer } from "@opencode/repo-index/dist/src/tokenize.js"

export interface CompressOpts { budgetTokens: number; keywords?: string[]; keepAtLeast?: number; lambda?: number }

export async function compress(text: string, opts: CompressOpts): Promise<string> {
  const tok = await createTokenizer()
  const segs = segment(text)
  if (!segs.length) return ""
  const scores = scoreSegments(segs, { keywords: opts.keywords })
  const order = selectMMR(segs, scores, opts.lambda ?? 0.8)
  const min = Math.max(1, opts.keepAtLeast ?? 3)
  const out: string[] = []
  let used = 0
  let kept = 0
  for (const i of order) {
    const s = segs[i]
    const add = s.text
    const cost = tok.estimateTokens(add)
    if (kept < min || used + cost <= opts.budgetTokens) {
      out.push(add)
      used += cost
      kept++
    } else break
  }
  return out.join("\n\n")
}
