import type { Plugin } from "@opencode-ai/plugin"
import { stablePrefixBlock } from "../../packages/prompt-kit/src/index"

const SENSITIVE = /\.(env|aws|ssh|git)(\.|\/|$)/i
const FRAME_RE = /<CONTEXT_FRAME[^>]*>[\s\S]*?<\/CONTEXT_FRAME>/g

export function onPreSendPrompt(input: unknown) {
  const text = typeof input === "string" ? input : String(input ?? "")
  const p = stablePrefixBlock()
  const has = text.includes("## Stable Project Rules") && text.includes("## Coding Standards")
  const base = has ? text : `${p.text}\n\n${text}`
  const frames = base.match(FRAME_RE) ?? []
  const last = frames.length ? frames[frames.length - 1] : ""
  const stripped = base.replace(FRAME_RE, "").trim()
  const joined = last ? `${last}\n\n${stripped}` : stripped
  const frame = FRAME_RE.test(joined)
    ? joined
    : `<!-- WARNING: no CONTEXT_FRAME detected; call repo.workingSet.select and include context_block -->\n${joined}`
  const hint = /\[FULL\]/.test(frame) && !/tests?\//i.test(frame)
    ? `<!-- Hint: prefer readSpan for non-test files -->\n${frame}`
    : frame
  const warn = SENSITIVE.test(hint)
    ? `<!-- WARNING: sensitive filename detected; remove from prompt -->\n${hint}`
    : hint
  return `<!-- prefix_sha256=${p.sha256} -->\n${warn}`
}

export const contextPack: Plugin = async () => ({
  async "chat.message"(_input, output) {
    output.parts = output.parts.map((part) => {
      if (part.type !== "text") return part
      if (!part.text) return part
      return { ...part, text: onPreSendPrompt(part.text) }
    })
  },
})
