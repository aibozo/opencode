import { describe, it, expect } from "vitest"
import { resolve } from "node:path"
import { skeletonizeFile } from "../packages/repo-index/src/skeleton"

describe("skeletonize ts", () => {
  const root = resolve("fixtures/ts-mini")
  const path = resolve(root, "src/mathy.ts")
  const sk = skeletonizeFile(root, path)

  it("keeps function and class headers", () => {
    expect(sk.text).toContain("export function add(a: number, b: number)")
    expect(sk.text).toContain("export class Accumulator")
  })

  it("elides bodies with markers", () => {
    expect(sk.text).toMatch(/\/\* ⟪ELIDED L\d+-\d+; \d+ lines; sha1=[0-9a-f]{40}⟫ \*\//)
  })

  it("records elision metadata", () => {
    expect(sk.elisions.some((e) => e.kind === "func")).toBe(true)
    expect(sk.elisions.some((e) => e.kind === "class")).toBe(true)
  })
})

