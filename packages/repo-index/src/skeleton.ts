import { readFileSync } from "node:fs"
import crypto from "node:crypto"
import type { Skeleton } from "@opencode/shared/src/types"
import type { Lang } from "./types.js"
import { skeletonizePython } from "./skeleton/python.js"
import { skeletonizeTS } from "./skeleton/ts.js"
import { skeletonizeJS } from "./skeleton/js.js"

export function skeletonizeFile(root: string, path: string): Skeleton {
  const src = readFileSync(path, "utf8")
  const lang = langOf(path)
  if (!lang) throw new Error(`Unsupported file type: ${path}`)
  if (lang === "python") return skeletonizePython(root, path, src)
  if (lang === "typescript") return skeletonizeTS(root, path, src)
  return skeletonizeJS(root, path, src)
}

export function sha1(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex")
}

function langOf(p: string): Lang | undefined {
  if (/\.(py)$/.test(p)) return "python"
  if (/\.(ts|tsx)$/.test(p)) return "typescript"
  if (/\.(js|jsx|mjs|cjs)$/.test(p)) return "javascript"
  return undefined
}
