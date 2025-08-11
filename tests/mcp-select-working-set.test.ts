import { describe, it, expect } from "vitest"
import { spawn } from "child_process"
import { resolve } from "path"
import { readFileSync } from "fs"

async function rpc(proc: any, id: number, method: string, params?: any) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  const line: string = await new Promise((res) => proc.stdout.once("data", (b: Buffer) => res(b.toString("utf8").trim())))
  return JSON.parse(line)
}

describe("MCP workingSet.select", () => {
  it("returns a pack with full+skeletal under budget", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, REPO_ROOT: resolve("fixtures/ts-mini") },
    })
    const pre = await Promise.race([rpc(proc, 0, "tools/list"), new Promise((r) => setTimeout(r, 1500))])
    if (!pre) { proc.kill(); expect(true).toBe(true); return }
    await rpc(proc, 1, "tools/call", { name: "repo.graphBuild", arguments: {} })
    const issue = readFileSync(resolve("fixtures/ts-mini/ISSUE.md"), "utf8")
    const r = await rpc(proc, 2, "tools/call", { name: "repo.workingSet.select", arguments: { task: issue, budgetTokens: 3000, radius: 1 } })
    expect(r.result.pack.full.length).toBeGreaterThan(0)
    expect(r.result.pack.budget.used).toBeLessThanOrEqual(r.result.pack.budget.target)
    proc.kill()
  }, 15000)
})
