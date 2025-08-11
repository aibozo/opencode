import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

function stableHash() {
  const a = readFileSync("AGENTS.md", "utf-8")
  const b = readFileSync("docs/dev-standards.md", "utf-8")
  return createHash("sha256").update(a + "\n---\n" + b).digest("hex")
}

describe("stable instruction prefix", () => {
  it("produces a deterministic hash", () => {
    const h1 = stableHash()
    const h2 = stableHash()
    expect(h1).toBe(h2)
  })
})

