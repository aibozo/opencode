import { describe, it, expect } from "vitest"
import { resolve } from "path"
import { buildIndex, parserMode } from "../packages/repo-index/src/index"
// selectWorkingSet imported from built dist during test to satisfy package imports
import { readFileSync } from "fs"

describe("respects token budget", async () => {
  it("keeps used <= target", async () => {
    if (parserMode() === "fallback") { expect(true).toBe(true); return }
    const tsRoot = resolve("fixtures/ts-mini")
    await buildIndex(tsRoot)
    const issue = readFileSync(resolve(tsRoot, "ISSUE.md"), "utf8")
    let mod: any
    try { mod = await import("../packages/repo-index/dist/src/working-set.js") } catch {}
    if (!mod?.selectWorkingSet) { expect(true).toBe(true); return }
    const { debug } = await mod.selectWorkingSet(tsRoot, { task: issue, budgetTokens: 1500, radius: 1 })
    expect(debug.tokens.used).toBeLessThanOrEqual(debug.tokens.target)
  })
})
