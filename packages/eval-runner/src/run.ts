import { spawn } from "child_process"
import { resolve, join } from "path"
import { readFileSync, cpSync, rmSync, mkdtempSync } from "fs"
import { tmpdir } from "os"
import { applyPatch } from "./patch.js"

async function waitReady(proc: any) {
  return new Promise<void>((res) => {
    const onData = (b: Buffer) => {
      const s = b.toString("utf8")
      process.stderr.write(s)
      if (s.includes("MCP:READY")) {
        proc.stderr.off("data", onData)
        res()
      }
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

export async function runFixtureEval(fixDir: string, issueFile = "ISSUE.md", diffFile = "expected_patch.diff") {
  const tmp = mkdtempSync(join(tmpdir(), "opencode-eval-"))
  cpSync(resolve(fixDir), tmp, { recursive: true })
  rmSync(join(tmp, ".git"), { recursive: true, force: true })
  const root = tmp
  const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, REPO_ROOT: resolve(root) },
  })
  try {
    await waitReady(proc)
    const rpc = makeRpc(proc)
    process.stderr.write("[eval] graphBuild\n")
    await rpc(1, "tools/call", { name: "repo.graphBuild", arguments: {} })
    const ses = await rpc(2, "tools/call", { name: "repo.session.start", arguments: {} })
    const sessionId = ses.result.sessionId

    const issue = readFileSync(resolve(root, issueFile), "utf8")
    process.stderr.write("[eval] workingSet.select\n")
    await rpc(3, "tools/call", {
      name: "repo.workingSet.select",
      arguments: { task: issue, budgetTokens: 4000, radius: 1, sessionId },
    })

    applyPatch(resolve(root, diffFile))
    process.stderr.write("[eval] metrics.checkRecall\n")
    const r = await rpc(4, "tools/call", { name: "repo.metrics.checkRecall", arguments: { sessionId } })
    return r.result.recall
  } finally {
    proc.kill()
    rmSync(root, { recursive: true, force: true })
  }
}
