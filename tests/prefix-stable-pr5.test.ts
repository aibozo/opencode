import { describe, it, expect } from "vitest"
import { stablePrefixBlock } from "../packages/prompt-kit/src/index"

describe("stable prefix block", () => {
  it("has deterministic sha256", () => {
    const a = stablePrefixBlock()
    const b = stablePrefixBlock()
    expect(a.sha256).toEqual(b.sha256)
    expect(a.text.length).toBeGreaterThan(50)
  })
})

