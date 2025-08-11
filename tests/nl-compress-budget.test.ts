import { describe, it, expect } from "vitest"
import { compress } from "../packages/nl-compress/src/index"
import { createTokenizer } from "../packages/repo-index/src/tokenize"

describe("budget adherence", async () => {
  it("stays within token budget", async () => {
    const tok = await createTokenizer()
    const text = Array.from({ length: 200 }, (_, i) => `Line ${i} with error and expected/received`).join("\n")
    const out = await compress(text, { budgetTokens: 120 })
    expect(tok.estimateTokens(out)).toBeLessThanOrEqual(120)
  })
})

