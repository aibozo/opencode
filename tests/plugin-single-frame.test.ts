import { describe, it, expect } from "vitest"
import { onPreSendPrompt } from "../.opencode/plugin/context-pack"

describe("plugin keeps one frame", () => {
  it("removes older frames", () => {
    const p = "<CONTEXT_FRAME id=1>...</CONTEXT_FRAME>\nblah\n<CONTEXT_FRAME id=2>new</CONTEXT_FRAME>"
    const out = onPreSendPrompt(p)
    const frames = out.match(/<CONTEXT_FRAME[^>]*>/g) ?? []
    expect(frames.length).toBe(1)
    expect(out).toContain("id=2")
  })
})

