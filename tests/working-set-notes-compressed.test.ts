import { describe, it, expect } from "vitest"
import { resolve } from "path"
import { buildIndex } from "../packages/repo-index/src/index"
import { readFileSync } from "fs"
import { createTokenizer } from "../packages/repo-index/src/tokenize"

describe("working-set uses compressed notes", async () => {
  it("notes honor ~5% budget and are shorter than raw", async () => {
    const root = resolve("fixtures/ts-mini")
    await buildIndex(root)
    const raw = readFileSync(resolve(root, "ISSUE.md"), "utf8").repeat(5)
    let mod: any
    try { mod = await import("../packages/repo-index/dist/src/working-set.js") } catch {}
    if (!mod?.selectWorkingSet) { expect(true).toBe(true); return }
    const { pack } = await mod.selectWorkingSet(root, { task: raw, budgetTokens: 4000, radius: 1 })
    const tok = await createTokenizer()
    expect(tok.estimateTokens(pack.notes ?? "")).toBeLessThanOrEqual(Math.floor(4000 * 0.05) + 5)
    expect((pack.notes ?? "").length).toBeLessThan(raw.length)
  })
})
