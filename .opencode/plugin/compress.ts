import type { Plugin } from "@opencode-ai/plugin"
import { compress as nlCompress } from "@opencode/nl-compress/dist/index.js"

const RE = /<!--\s*compress:(on|off)\s*(?:budget=(\d+))?\s*-->/i

export const compress: Plugin = async () => ({
  async "chat.message"(_input, output) {
    let i = -1
    for (let x = 0; x < output.parts.length; x++) {
      const p = output.parts[x]
      if (p.type !== "text") continue
      if (!p.text || typeof p.text !== "string") continue
      if (!RE.test(p.text)) continue
      i = x
      break
    }
    if (i < 0) return
    const part = output.parts[i]
    const m = part.text.match(RE)
    if (!m) return
    const on = m[1].toLowerCase() === "on"
    const b = m[2] ? parseInt(m[2], 10) : 3000
    const clean = part.text.replace(RE, "").trim()
    if (!on) {
      output.parts[i] = { ...part, text: clean }
      return
    }
    const txt = await nlCompress(clean, { budgetTokens: Number.isFinite(b) && b > 0 ? b : 3000 })
    output.parts[i] = { ...part, text: txt }
  },
})
