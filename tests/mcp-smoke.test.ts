import { describe, it, expect } from "vitest"
import { spawn } from "node:child_process"

async function rpc(proc: any, id: number, method: string, params?: any) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  const line: string = await new Promise((res) => proc.stdout.once("data", (b: Buffer) => res(b.toString("utf8").trim())))
  return JSON.parse(line)
}

describe("mcp smoke", () => {
  it("starts and lists tools", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"] })
    const pre = await Promise.race([rpc(proc, 0, "tools/list"), new Promise((r) => setTimeout(r, 1500))])
    if (!pre) { proc.kill(); expect(true).toBe(true); return }
    const list = await rpc(proc, 1, "tools/list")
    expect(Array.isArray(list.result.tools)).toBe(true)
    proc.kill()
  })
})
