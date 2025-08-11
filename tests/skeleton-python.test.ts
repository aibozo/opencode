import { describe, it, expect } from "vitest"
import { resolve } from "node:path"
import { skeletonizeFile } from "../packages/repo-index/src/skeleton"

describe("skeletonize python", () => {
  const root = resolve("fixtures/py-mini")
  const path = resolve(root, "pkg/mathy.py")
  const sk = skeletonizeFile(root, path)

  it("emits a readable skeleton", () => {
    expect(sk.text).toContain("# File: pkg/mathy.py")
    expect(sk.text).toContain("def add(a, b):")
    expect(sk.text).toContain("class Accumulator:")
  })

  it("includes docstrings when present", () => {
    expect(sk.text).toMatch(/"""Add two numbers.+"""/s)
  })

  it("adds elision markers with sha1", () => {
    expect(sk.elisions.length).toBeGreaterThan(0)
    const e = sk.elisions[0]
    expect(e.sha1).toMatch(/^[0-9a-f]{40}$/)
    expect(sk.text).toMatch(/⟪ELIDED L\d+-\d+; \d+ lines; sha1=[0-9a-f]{40}⟫/)
  })
})

