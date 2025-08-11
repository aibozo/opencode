import { describe, it, expect } from "vitest"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import os from "node:os"
import { skeletonizeFile } from "../packages/repo-index/src/skeleton"

describe("skeleton hash updates when body changes", () => {
  it("changes sha1 if body changes", () => {
    const root = resolve("fixtures/ts-mini")
    const srcPath = resolve(root, "src/mathy.ts")
    const tmp = resolve(os.tmpdir(), "mathy.tmp.ts")
    writeFileSync(tmp, readFileSync(srcPath, "utf8"))
    const a = skeletonizeFile(root, tmp)
    writeFileSync(tmp, readFileSync(tmp, "utf8").replace("return this.v", "return this.v;\n"))
    const b = skeletonizeFile(root, tmp)
    const ah = a.elisions.map((e) => e.sha1).join(",")
    const bh = b.elisions.map((e) => e.sha1).join(",")
    expect(ah).not.toBe(bh)
  })
})
