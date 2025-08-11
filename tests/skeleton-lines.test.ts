import { describe, it, expect } from "vitest"
import { resolve } from "node:path"
import { skeletonizeFile } from "../packages/repo-index/src/skeleton"

describe("elided line counts make sense", () => {
  it("has positive elided lines", () => {
    const root = resolve("fixtures/py-mini")
    const path = resolve(root, "pkg/mathy.py")
    const sk = skeletonizeFile(root, path)
    for (const e of sk.elisions) {
      expect(e.linesElided).toBeGreaterThanOrEqual(1)
      expect(e.endLine).toBeGreaterThanOrEqual(e.startLine)
    }
  })
})

