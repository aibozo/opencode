import { describe, it, expect } from "vitest"
import { resolve } from "node:path"
import { buildIndex } from "../packages/repo-index/src/index"

describe("ts indexing", async () => {
  const root = resolve("fixtures/ts-mini")
  const idx = await buildIndex(root)

  it("extracts exported symbols", () => {
    const syms = idx.symbols.filter((s) => s.file.endsWith("src/mathy.ts"))
    const add = syms.find((s) => s.shortName === "add")
    const acc = syms.find((s) => s.shortName === "Accumulator")
    expect(add?.export).toBe(true)
    expect(acc?.export).toBe(true)
  })

  it("includes module symbols", () => {
    const mod = idx.symbols.find((s) => s.kind === "module" && s.file.endsWith("src/mathy.ts"))
    expect(mod).toBeTruthy()
  })
})

