import { describe, it, expect } from "vitest"
import { assemblePrompt } from "../packages/prompt-kit/src/index"

const dummy: any = {
  full: [{ path: "src/x.py", ranges: [[10, 40]] }, { path: "tests/test_x.py" }],
  skeletons: [{ path: "src/y.py", hash: "abc123" }],
  interfaces: [{ path: "src/types.ts" }],
  search_hits: [{ path: "src/x.py", line: 12, text: "foo()", score: 1 }],
  notes: "Traceback...",
  budget: { target: 64000, used: 1234 },
}

describe("assemble prompt", () => {
  it("renders sections in correct order", () => {
    const out = assemblePrompt(dummy, "Traceback...", "- edit x.py")
    expect(out).toMatch(/## Stable Project Rules/)
    expect(out).toMatch(/# Working Set/)
    expect(out).toMatch(/## FULL/)
    expect(out).toMatch(/src\/x\.py \[L10-40\]/)
    expect(out).toMatch(/tests\/test_x\.py \[FULL\]/)
    expect(out).toMatch(/## SKELETON/)
  })
})

