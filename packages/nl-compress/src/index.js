import { segment } from "./segment";
import { scoreSegments } from "./score";
import { selectMMR } from "./mmr";
import { createTokenizer } from "@opencode/repo-index/src/tokenize";
export async function compress(text, opts) {
    const tok = await createTokenizer();
    const segs = segment(text);
    if (!segs.length)
        return "";
    const scores = scoreSegments(segs, { keywords: opts.keywords });
    const order = selectMMR(segs, scores, opts.lambda ?? 0.8);
    const min = Math.max(1, opts.keepAtLeast ?? 3);
    const out = [];
    let used = 0;
    let kept = 0;
    for (const i of order) {
        const s = segs[i];
        const add = s.text;
        const cost = tok.estimateTokens(add);
        if (kept < min || used + cost <= opts.budgetTokens) {
            out.push(add);
            used += cost;
            kept++;
        }
        else
            break;
    }
    return out.join("\n\n");
}
