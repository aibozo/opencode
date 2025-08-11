import { describe, it, expect } from "vitest"
import { spawn } from "node:child_process"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

async function waitReady(proc: any) {
  return new Promise<void>((res) => {
    const onData = (b: Buffer) => {
      const s = b.toString("utf8")
      process.stderr.write(s)
      if (s.includes("MCP:READY")) { proc.stderr.off("data", onData); res() }
    }
    proc.stderr.on("data", onData)
  })
}

function makeLineReader(proc: any) {
  let buf = ""
  const queue: string[] = []
  const waiters: ((s: string) => void)[] = []
  proc.stdout.setEncoding("utf8")
  proc.stdout.on("data", (chunk: string) => {
    buf += chunk
    for (;;) {
      const i = buf.indexOf("\n")
      if (i === -1) break
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      const w = waiters.shift()
      if (w) w(line)
      else queue.push(line)
    }
  })
  return () => new Promise<string>((res) => {
    const first = queue.shift()
    if (first !== undefined) res(first)
    else waiters.push(res)
  })
}

function makeRpc(proc: any) {
  const nextLine = makeLineReader(proc)
  return async (id: number, method: string, params?: any) => {
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n")
    const line = await nextLine()
    return JSON.parse(line)
  }
}

describe.sequential("frontier expand", () => {
  it("expands skeleton coverage", async () => {
    const fix = resolve("fixtures/ts-mini")
    const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, REPO_ROOT: fix } })
    await waitReady(proc)
    const rpc = makeRpc(proc)
    process.stderr.write("[expand] graphBuild\n")
    await rpc(1, "tools/call", { name: "repo.graphBuild", arguments: {} })
    process.stderr.write("[expand] session.start\n")
    const ses = await rpc(2, "tools/call", { name: "repo.session.start", arguments: {} })
    const sessionId = ses.result.sessionId
    const issue = readFileSync(resolve(fix, "ISSUE.md"), "utf8")
    process.stderr.write("[expand] workingSet.select\n")
    const sel = await rpc(3, "tools/call", { name: "repo.workingSet.select", arguments: { task: issue, budgetTokens: 4000, radius: 1, sessionId } })
    const s1 = sel.result.pack.skeletons.length
    process.stderr.write("[expand] frontier.expand\n")
    const exp = await rpc(4, "tools/call", { name: "repo.frontier.expand", arguments: { task: issue, sessionId, radiusDelta: 1, budgetTokens: 4000 } })
    const s2 = exp.result.pack.skeletons.length
    expect(s2).toBeGreaterThanOrEqual(s1)
    proc.kill()
  }, 60000)
})
