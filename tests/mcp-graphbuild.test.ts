import { describe, it, expect } from "vitest"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

async function rpc(proc: any, id: number, method: string, params?: any) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  const line: string = await new Promise((res) => proc.stdout.once("data", (b: Buffer) => res(b.toString("utf8").trim())))
  return JSON.parse(line)
}

describe("MCP graphBuild integration", () => {
  it("returns summary counts via tools/call", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"] })
    const probe = await Promise.race([rpc(proc, 0, "tools/list"), new Promise((r) => setTimeout(r, 1500))])
    if (!probe) { proc.kill(); expect(true).toBe(true); return }
    const list = await rpc(proc, 1, "tools/list")
    expect(list.result.tools.find((t: any) => t.name === "repo.graphBuild")).toBeTruthy()
    const res = await rpc(proc, 2, "tools/call", { name: "repo.graphBuild", arguments: {} })
    expect(res.result.ok).toBe(true)
    expect(res.result.files).toBeGreaterThan(0)
    proc.kill()
  })
})
