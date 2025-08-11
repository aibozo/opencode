import { stablePrefixBlock } from "../../packages/prompt-kit/src/index"

const SENSITIVE = /\.(env|aws|ssh|git)(\.|\/|$)/i

export function onPreSendPrompt(prompt: string) {
  const p = stablePrefixBlock()
  const has = prompt.includes("## Stable Project Rules") && prompt.includes("## Coding Standards")
  let out = has ? prompt : `${p.text}\n\n${prompt}`
  if (/\[FULL\]/.test(out) && !/tests?\//i.test(out)) out = `<!-- Hint: prefer readSpan for non-test files -->\n${out}`
  if (SENSITIVE.test(out)) out = `<!-- WARNING: sensitive filename detected; remove from prompt -->\n${out}`
  out = `<!-- prefix_sha256=${p.sha256} -->\n${out}`
  return out
}
