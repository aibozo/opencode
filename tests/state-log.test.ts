import { describe, it, expect } from "vitest"
import { appendDecision, loadLog, summarize } from "../packages/state-log/src/index"
import { rmSync } from "node:fs"

describe("decision log", () => {
  it("appends and summarizes", () => {
    rmSync(".opencode/state", { recursive: true, force: true })
    appendDecision({ why: "fix add()", what: "src/mathy.ts" })
    appendDecision({ why: "adjust test", what: "test/mathy.test.ts", next: "re-run" })
    const s = summarize(2)
    expect(s).toMatch(/why: fix add/)
    expect(loadLog().entries.length).toBe(2)
  })
})

