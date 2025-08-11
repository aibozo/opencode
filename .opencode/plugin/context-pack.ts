import { stablePrefixBlock } from "../../packages/prompt-kit/src/index"

const SENSITIVE = /\.(env|aws|ssh|git)(\.|\/|$)/i
const FRAME_RE = /<CONTEXT_FRAME[^>]*>[\s\S]*?<\/CONTEXT_FRAME>/g

export function onPreSendPrompt(prompt: string) {
  const p = stablePrefixBlock()
  const has = prompt.includes("## Stable Project Rules") && prompt.includes("## Coding Standards")
  let out = has ? prompt : `${p.text}\n\n${prompt}`
  const frames = out.match(FRAME_RE) ?? []
  if (frames.length > 1) {
    const stripped = out.replace(FRAME_RE, "")
    out = `${frames[frames.length - 1]}\n\n${stripped}`
  }
  if (!FRAME_RE.test(out)) out = `<!-- WARNING: no CONTEXT_FRAME detected; call repo.workingSet.select and include context_block -->\n${out}`
  if (/\[FULL\]/.test(out) && !/tests?\//i.test(out)) out = `<!-- Hint: prefer readSpan for non-test files -->\n${out}`
  if (SENSITIVE.test(out)) out = `<!-- WARNING: sensitive filename detected; remove from prompt -->\n${out}`
  out = `<!-- prefix_sha256=${p.sha256} -->\n${out}`
  return out
}
