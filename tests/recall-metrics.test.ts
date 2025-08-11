import { describe, it, expect } from "vitest"
import { runFixtureEval } from "../packages/eval-runner/src/run"
import { resolve } from "path"
import { execSync } from "child_process"

describe.sequential("fixture eval recall", () => {
  it("py-mini recall is 100%", async () => {
    const root = resolve("fixtures/py-mini")
    execSync("git init", { cwd: root })
    execSync("git add -A && git commit -m init || true", { cwd: root })
    const res = await runFixtureEval(root)
    expect(res.pct).toBe(100)
  }, 60000)
})
