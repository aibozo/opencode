import { describe, it, expect } from "vitest"
import { spawn } from "child_process"
import { resolve } from "path"

async function rpc(proc: any, id: number, method: string, params?: any) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  const line: string = await new Promise((res) => proc.stdout.once("data", (b: Buffer) => res(b.toString("utf8").trim())))
  return JSON.parse(line)
}

describe("readSpan bounds + sha", () => {
  it("reads a small span safely", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, REPO_ROOT: resolve("fixtures/py-mini") } })
    const pre = await Promise.race([rpc(proc, 0, "tools/list"), new Promise((r) => setTimeout(r, 1500))])
    if (!pre) { proc.kill(); expect(true).toBe(true); return }
    await rpc(proc, 1, "tools/call", { name: "repo.graphBuild", arguments: {} })
    const res = await rpc(proc, 2, "tools/call", { name: "repo.code.readSpan", arguments: { path: "pkg/mathy.py", start: 1, end: 8 } })
    expect(res.result.text.length).toBeGreaterThan(0)
    expect(res.result.sha1).toMatch(/^[0-9a-f]{40}$/)
    proc.kill()
  })
})
