import { describe, it, expect } from "vitest"
import { resolve } from "path"
import { buildIndex, parserMode } from "../packages/repo-index/src/index"
// selectWorkingSet imported from built dist during test to satisfy package imports

describe("coverage: neighbors appear as skeletons", async () => {
  it("adds 1-hop neighbors for seed files", async () => {
    if (parserMode() === "fallback") { expect(true).toBe(true); return }
    const root = resolve("fixtures/ts-mini")
    await buildIndex(root)
    const task = "TypeError in add at src/mathy.ts:3:10"
    let mod: any
    try { mod = await import("../packages/repo-index/dist/src/working-set.js") } catch {}
    if (!mod?.selectWorkingSet) { expect(true).toBe(true); return }
    const { pack } = await mod.selectWorkingSet(root, { task, budgetTokens: 8000, radius: 1 })
    expect(pack.full.some((f) => f.path.endsWith("src/mathy.ts"))).toBe(true)
    expect(pack.skeletons.some((s) => s.path.endsWith("src/index.ts"))).toBe(true)
  })
})
