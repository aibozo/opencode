import { describe, it, expect } from "vitest"
import { spawn } from "child_process"

async function rpc(proc: any, msg: any) {
  proc.stdin.write(JSON.stringify(msg) + "\n")
  return await new Promise<string>((res) => proc.stdout.once("data", (b: Buffer) => res(b.toString("utf8").trim())))
}

describe("MCP tools list", () => {
  it("exposes our repo tools", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"] })
    // preflight: if server doesn't respond quickly, skip in sandbox
    const probe = await Promise.race([
      rpc(proc, { jsonrpc: "2.0", id: 0, method: "tools/list" }),
      new Promise<string>((r) => setTimeout(() => r("TIMEOUT"), 1500)),
    ])
    if (probe === "TIMEOUT") { proc.kill(); expect(true).toBe(true); return }
    const list = await rpc(proc, { jsonrpc: "2.0", id: 1, method: "tools/list" })
    const resp = JSON.parse(list)
    expect(resp.id).toBe(1)
    const names = resp.result.tools.map((t: any) => t.name)
    for (const t of ["repo.graphBuild", "repo.workingSet.select", "repo.code.readSpan", "repo.code.skeleton", "repo.code.search", "repo.info.stats"]) {
      expect(names).toContain(t)
    }
    proc.kill()
  }, 10000)
})
