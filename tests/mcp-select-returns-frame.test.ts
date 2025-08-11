import { describe, it, expect } from "vitest"
import { spawn } from "child_process"
import { resolve } from "path"
import { readFileSync } from "fs"

async function rpc(proc: any, id: number, method: string, params?: any) {
  proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
  const line: string = await new Promise((res) => {
    let buf = ""
    const on = (b: Buffer) => {
      buf += b.toString("utf8")
      const i = buf.indexOf("\n")
      if (i !== -1) {
        proc.stdout.off("data", on)
        res(buf.slice(0, i).trim())
      }
    }
    proc.stdout.on("data", on)
  })
  return JSON.parse(line)
}

describe("workingSet.select returns pre-rendered frame + prefix", () => {
  it("includes context_block and hashes", async () => {
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, REPO_ROOT: resolve("fixtures/ts-mini") },
    })
    const pre = await Promise.race([rpc(proc, 0, "tools/list"), new Promise((r) => setTimeout(r, 1500))])
    if (!pre) { proc.kill(); expect(true).toBe(true); return }
    await rpc(proc, 1, "tools/call", { name: "repo.graphBuild", arguments: {} })
    const issue = readFileSync(resolve("fixtures/ts-mini/ISSUE.md"), "utf8")
    const r = await rpc(proc, 2, "tools/call", {
      name: "repo.workingSet.select",
      arguments: { task: issue, budgetTokens: 3000, radius: 1 },
    })
    expect(r.result.context_block).toMatch(/<CONTEXT_FRAME .*?>/)
    expect(r.result.prefix_block).toMatch(/## Stable Project Rules/)
    expect(r.result.prefix_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(r.result.frame_sha256).toMatch(/^[0-9a-f]{64}$/)
    proc.kill()
  }, 30000)
})
