import { describe, it, expect } from "vitest"
import { onPreSendPrompt } from "../.opencode/plugin/context-pack"

describe("plugin guards", () => {
  it("adds prefix when missing and nudges on FULL", () => {
    const out = onPreSendPrompt("# Working Set\n## FULL\n- src/app.ts [FULL]\n")
    expect(out).toMatch(/Stable Project Rules/)
    expect(out).toMatch(/prefix_sha256=/)
    expect(out).toMatch(/prefer readSpan/)
  })
})

