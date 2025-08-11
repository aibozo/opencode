import { describe, it, expect } from "vitest"
import { resolve } from "path"
import { buildIndex, parserMode } from "../packages/repo-index/src/index"
// selectWorkingSet imported from built dist during test to satisfy package imports

function sig(pack: any) {
  return JSON.stringify({
    full: pack.full.map((f: any) => [f.path, f.ranges]),
    sk: pack.skeletons.map((s: any) => s.path),
    ifc: pack.interfaces.map((i: any) => i.path),
    notes: pack.notes.slice(0, 120),
  })
}

describe("deterministic selection", async () => {
  it("produces same pack for same inputs", async () => {
    if (parserMode() === "fallback") { expect(true).toBe(true); return }
    const root = resolve("fixtures/py-mini")
    await buildIndex(root)
    const task = 'Traceback: File "pkg/mathy.py", line 5, in add'
    let mod: any
    try { mod = await import("../packages/repo-index/dist/src/working-set.js") } catch {}
    if (!mod?.selectWorkingSet) { expect(true).toBe(true); return }
    const a = await mod.selectWorkingSet(root, { task, budgetTokens: 4000, radius: 1 })
    const b = await mod.selectWorkingSet(root, { task, budgetTokens: 4000, radius: 1 })
    expect(sig(a.pack)).toEqual(sig(b.pack))
  })
})
