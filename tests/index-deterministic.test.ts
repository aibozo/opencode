import { describe, it, expect } from "vitest"
import { resolve } from "node:path"
import { buildIndex } from "../packages/repo-index/src/index"
import crypto from "node:crypto"

function hash(obj: unknown) {
  return crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex")
}

describe("deterministic index", async () => {
  it("is stable across runs", async () => {
    const idx1 = await buildIndex(resolve("fixtures/py-mini"))
    const idx2 = await buildIndex(resolve("fixtures/py-mini"))
    expect(hash(idx1.symbols)).toBe(hash(idx2.symbols))
    expect(hash(idx1.edges)).toBe(hash(idx2.edges))
  })
})

