import { describe, it, expect } from "vitest"
import { compress } from "../packages/nl-compress/src/index"

describe("determinism", async () => {
  it("same input -> same output", async () => {
    const t = "Error X\nat a/b.ts:1:1\n\nMore details...\n\nExpected 4, received 5."
    const a = await compress(t, { budgetTokens: 60 })
    const b = await compress(t, { budgetTokens: 60 })
    expect(a).toEqual(b)
  })
})

