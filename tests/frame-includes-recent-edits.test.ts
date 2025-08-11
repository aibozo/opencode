import { describe, it, expect } from "vitest"
import { renderContextFrame, stablePrefixBlock } from "../packages/prompt-kit/src/index"

describe("frame includes recent edits", () => {
  it("renders recent edits section", () => {
    const { sha256 } = stablePrefixBlock()
    const { text } = renderContextFrame({
      pack: { full: [], skeletons: [], interfaces: [], search_hits: [], notes: "", budget: { target: 1000, used: 0 } } as any,
      notes: "Traceback...",
      recentEdits: "- [ts] why: fix | what: x.ts:10-20",
      frameId: "abc",
      prefixSha256: sha256,
    })
    expect(text).toMatch(/# RECENT EDITS/)
    expect(text).toMatch(/why: fix/)
  })
})

