import { execSync } from "child_process"
import type { EditHunk } from "./types"

export function diffHunks(baseRef = "HEAD~1", headRef = "HEAD", cwd?: string): EditHunk[] {
  const out = execSync(`git diff --unified=0 ${baseRef} ${headRef}`, { encoding: "utf8", cwd })
  const hunks: EditHunk[] = []
  let currentPath: string | null = null
  const lines = out.split("\n")
  for (const line of lines) {
    if (line.startsWith("+++ b/")) {
      currentPath = line.slice(6).trim()
      continue
    }
    const m = line.match(/^@@ [^+]+\+(\d+)(?:,(\d+))? @@/)
    if (m && currentPath) {
      const start = parseInt(m[1], 10)
      const len = m[2] ? parseInt(m[2], 10) : 1
      hunks.push({ path: currentPath, start, end: start + Math.max(0, len - 1) })
    }
  }
  return hunks
}
