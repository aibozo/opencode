import type { Hooks, Plugin as PluginInstance } from "@opencode-ai/plugin"
import { App } from "../app/app"
import { Config } from "../config/config"
import { Bus } from "../bus"
import { Log } from "../util/log"
import { createOpencodeClient } from "@opencode-ai/sdk"
import { Server } from "../server/server"
import { BunProc } from "../bun"
import path from "path"
import fs from "fs/promises"

export namespace Plugin {
  const log = Log.create({ service: "plugin" })

  const state = App.state("plugin", async (app) => {
    const client = createOpencodeClient({
      baseUrl: "http://localhost:4096",
      fetch: async (...args) => Server.app().fetch(...args),
    })
    const config = await Config.get()
    // Ensure per-project editable plugins exist
    const dir = path.join(app.path.cwd, ".opencode", "plugin")
    await fs.mkdir(dir, { recursive: true }).catch(() => {})
    const ensure = async (name: string, content: string) => {
      const file = path.join(dir, name)
      const exists = await Bun.file(file).exists()
      if (exists) return
      await Bun.write(file, content)
      log.info("scaffolded plugin", { path: file })
    }
    const contextPack = `import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "node:fs"
import crypto from "node:crypto"

const SENSITIVE = /\\.(env|aws|ssh|git)(\\.|\\/|$)/i
const FRAME_RE = /<CONTEXT_FRAME[^>]*>[\\s\\S]*?<\\/CONTEXT_FRAME>/g

function stablePrefixBlock() {
  let a = ""
  let b = ""
  try { a = readFileSync("AGENTS.md", "utf8") } catch {}
  try { b = readFileSync("docs/dev-standards.md", "utf8") } catch {}
  const t = [
    "## Stable Project Rules",
    a.trim(),
    "",
    "## Coding Standards",
    b.trim(),
  ].join("\\n")
  const h = crypto.createHash("sha256").update(t).digest("hex")
  return { text: t, sha256: h }
}

export function onPreSendPrompt(text: string) {
  const p = stablePrefixBlock()
  const has = text.includes("## Stable Project Rules") && text.includes("## Coding Standards")
  const base = has ? text : `${p.text}\\n\\n${text}`
  const frames = base.match(FRAME_RE) ?? []
  const last = frames.at(-1) ?? ""
  const stripped = base.replace(FRAME_RE, "").trim()
  const joined = last ? `${last}\\n\\n${stripped}` : stripped
  const frame = FRAME_RE.test(joined)
    ? joined
    : `<!-- WARNING: no CONTEXT_FRAME detected; call repo.workingSet.select and include context_block -->\\n${joined}`
  const hint = /\\[FULL\\]/.test(frame) && !/tests?\\//i.test(frame)
    ? `<!-- Hint: prefer readSpan for non-test files -->\\n${frame}`
    : frame
  const warn = SENSITIVE.test(hint)
    ? `<!-- WARNING: sensitive filename detected; remove from prompt -->\\n${hint}`
    : hint
  return `<!-- prefix_sha256=${p.sha256} -->\\n${warn}`
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
`
    const compress = `import type { Plugin } from "@opencode-ai/plugin"
import { compress as nlCompress } from "@opencode/nl-compress/dist/index.js"

const RE = /<!--\\s*compress:(on|off)\\s*(?:budget=(\\d+))?\\s*-->/i

export const compress: Plugin = async () => ({
  async "chat.message"(_input, output) {
    let i = -1
    for (let x = 0; x < output.parts.length; x++) {
      const p = output.parts[x]
      if (p.type !== "text") continue
      if (!p.text) continue
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
`
    await ensure("context-pack.ts", contextPack)
    await ensure("compress.ts", compress)
    const hooks = []
    for (let plugin of config.plugin ?? []) {
      log.info("loading plugin", { path: plugin })
      if (!plugin.startsWith("file://")) {
        const [pkg, version] = plugin.split("@")
        plugin = await BunProc.install(pkg, version ?? "latest")
      }
      const mod = await import(plugin)
      for (const [_name, fn] of Object.entries<PluginInstance>(mod)) {
        const init = await fn({
          client,
          app,
          $: Bun.$,
        })
        hooks.push(init)
      }
    }

    return {
      hooks,
    }
  })

  export async function trigger<
    Name extends keyof Required<Hooks>,
    Input = Parameters<Required<Hooks>[Name]>[0],
    Output = Parameters<Required<Hooks>[Name]>[1],
  >(name: Name, input: Input, output: Output): Promise<Output> {
    if (!name) return output
    for (const hook of await state().then((x) => x.hooks)) {
      const fn = hook[name]
      if (!fn) continue
      // @ts-expect-error if you feel adventurous, please fix the typing, make sure to bump the try-counter if you
      // give up.
      // try-counter: 2
      await fn(input, output)
    }
    return output
  }

  export function init() {
    Bus.subscribeAll(async (input) => {
      const hooks = await state().then((x) => x.hooks)
      for (const hook of hooks) {
        hook["event"]?.({
          event: input,
        })
      }
    })
  }
}
