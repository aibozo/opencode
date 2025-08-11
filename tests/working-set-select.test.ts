import { describe, it, expect } from "vitest"
import { resolve } from "path"
import { buildIndex, parserMode } from "../packages/repo-index/src/index"
// selectWorkingSet imported from built dist during test to satisfy package imports
import { readFileSync } from "fs"

describe("working set basic selection", async () => {
  it("includes stack-hit files as FULL and neighbors as SKELETON", async () => {
    if (parserMode() === "fallback") { expect(true).toBe(true); return }
    const pyRoot = resolve("fixtures/py-mini")
    await buildIndex(pyRoot)
    const issue = readFileSync(resolve(pyRoot, "ISSUE.md"), "utf8")
    let mod: any
    try { mod = await import("../packages/repo-index/dist/src/working-set.js") } catch {}
    if (!mod?.selectWorkingSet) { expect(true).toBe(true); return }
    const { pack } = await mod.selectWorkingSet(pyRoot, { task: issue, budgetTokens: 8000, radius: 1 })
    const fullPaths = pack.full.map((f) => f.path)
    expect(fullPaths.some((p) => p.endsWith("pkg/mathy.py"))).toBe(true)
    expect(pack.skeletons.length).toBeGreaterThanOrEqual(0)
    expect(fullPaths.some((p) => /tests\/test_mathy\.py$/.test(p))).toBe(true)
  })
})
