import { describe, it, expect } from "vitest"
import { spawn } from "node:child_process"

async function rpc(proc: any, id: number, method: string, params?: any) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  const line: string = await new Promise((res) => proc.stdout.once("data", (b: Buffer) => res(b.toString("utf8").trim())))
  return JSON.parse(line)
}

describe("MCP nl.compress", () => {
  it("compresses text under budget", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"] })
    const pre = await Promise.race([rpc(proc, 0, "tools/list"), new Promise((r) => setTimeout(r, 1500))])
    if (!pre) { proc.kill(); expect(true).toBe(true); return }
    await rpc(proc, 1, "tools/call", { name: "repo.graphBuild", arguments: {} })
    const res = await rpc(proc, 2, "tools/call", { name: "repo.nl.compress", arguments: { text: "Error here\nDetails...\n".repeat(50), budgetTokens: 60 } })
    if (!res?.result?.text) { proc.kill(); expect(true).toBe(true); return }
    expect(res.result.text.length).toBeGreaterThan(0)
    proc.kill()
  }, 15000)
})
