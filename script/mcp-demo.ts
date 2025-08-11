// Demo: minimal end-to-end MCP tool usage via stdio
// Run: bun run script/mcp-demo.ts

import { spawn } from "node:child_process"

const dec = new TextDecoder()

async function main() {
  const env = { ...process.env }
  const root = env.REPO_ROOT ?? process.cwd()
  const proc = spawn("node", ["packages/repo-mcp/dist/bin/repo-mcp.js"], { stdio: ["pipe", "pipe", "pipe"], env })

  let buf = ""
  proc.stdout.setEncoding("utf8")
  proc.stdout.on("data", (chunk) => { buf += String(chunk) })

  const line = async () => {
    while (true) {
      const i = buf.indexOf("\n")
      if (i >= 0) {
        const s = buf.slice(0, i).trim()
        buf = buf.slice(i + 1)
        if (s.startsWith("{")) return s
      }
      await new Promise((r) => setTimeout(r, 10))
    }
  }
  const send = (obj: unknown) => { proc.stdin.write(JSON.stringify(obj) + "\n") }
  const rpc = async (id: number, method: string, params?: unknown) => { send({ jsonrpc: "2.0", id, method, params }); const s = await line(); return s ? JSON.parse(s) : null }

  const list = await rpc(1, "tools/list")
  console.log("tools:", list?.result?.tools?.map((t: any) => t.name)?.join(", "))

  const gb = await rpc(2, "tools/call", { name: "repo.graphBuild", arguments: {} })
  console.log("graph:", gb?.result?.files, "files,", gb?.result?.symbols, "symbols")

  const tspath = `${root}/fixtures/ts-mini/ISSUE.md`
  const pyspath = `${root}/fixtures/py-mini/ISSUE.md`
  const hasTs = await Bun.file(tspath).exists()
  const hasPy = await Bun.file(pyspath).exists()
  const pick = hasTs ? tspath : hasPy ? pyspath : ""
  const task = pick ? await Bun.file(pick).text() : "Fix failing tests in repo"

  const sel = await rpc(3, "tools/call", { name: "repo.workingSet.select", arguments: { task, budgetTokens: 3000, radius: 1 } })
  const pack = sel?.result?.pack
  console.log("pack:", pack?.full?.length ?? 0, "full,", pack?.skeletons?.length ?? 0, "skeletons")

  const first = pack?.full?.[0]
  if (first) {
    const rng = Array.isArray(first.ranges) && first.ranges.length ? first.ranges[0] : [1, 80]
    const rs = await rpc(4, "tools/call", { name: "repo.code.readSpan", arguments: { path: first.path, start: rng[0], end: rng[1] } })
    console.log("span:", rs?.result?.path, `[${rs?.result?.start}-${rs?.result?.end}]`, rs?.result?.sha1)
  }

  const sk = pack?.skeletons?.[0]
  if (sk) {
    const out = await rpc(5, "tools/call", { name: "repo.code.skeleton", arguments: { path: sk.path } })
    const txt = String(out?.result?.text ?? "")
    console.log("skeleton:", sk.path, txt.split(/\n/).slice(0, 2).join(" "))
  }

  const sr = await rpc(6, "tools/call", { name: "repo.code.search", arguments: { pattern: "add", globs: ["**/*.{ts,py}"] } })
  console.log("search:", sr?.result?.hits?.length ?? 0, "hits")

  proc.kill()
}

main()
