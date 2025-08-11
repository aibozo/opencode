import { describe, it, expect } from "vitest"
import { buildIndex } from "../packages/repo-index/src/index"
import { resolve } from "node:path"

describe("python indexing", async () => {
  const root = resolve("fixtures/py-mini")
  const idx = await buildIndex(root)

  it("finds files", () => {
    expect(idx.files.some((f) => f.endsWith("pkg/mathy.py"))).toBe(true)
  })

  it("extracts symbols with lines", () => {
    const syms = idx.symbols.filter((s) => s.file.endsWith("pkg/mathy.py"))
    const names = syms.map((s) => s.name).sort()
    expect(names).toContain("pkg.mathy:add")
    expect(names.find((n) => n.includes("Accumulator"))).toBeTruthy()
    const add = syms.find((s) => s.shortName === "add" && s.kind === "func")
    expect(add?.startLine).toBeGreaterThan(1)
    expect((add?.endLine ?? 0)).toBeGreaterThan(add!.startLine)
  })

  it("adds import/call edges best-effort", () => {
    const calls = idx.edges.filter((e) => e.type === "calls")
    expect(calls.some((e) => e.to === "add")).toBe(true)
  })
})

