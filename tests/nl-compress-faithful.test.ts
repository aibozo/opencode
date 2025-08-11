import { describe, it, expect } from "vitest"
import { compress } from "../packages/nl-compress/src/index"

const SAMPLE = `
Error: Something blew up
    at src/mathy.ts:10:3

Details:
We expected 4, received 5.

\`\`\`diff
- return a + b;
+ return a + b - 1;
\`\`\`
`

describe("faithful extractive compression", async () => {
  it("returns only substrings of input and keeps code blocks whole", async () => {
    const out = await compress(SAMPLE, { budgetTokens: 40, keywords: ["expected", "received"] })
    for (const line of out.split(/\r?\n/).filter((l) => l.trim())) expect(SAMPLE).toContain(line)
    if (out.includes("```")) {
      expect(out).toContain("```diff")
      expect(out).toContain("+ return a + b - 1;")
    }
  })
})

