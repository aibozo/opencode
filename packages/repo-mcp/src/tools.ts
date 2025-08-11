import { buildIndex, getIndex } from "@opencode/repo-index/src/index"

export async function handleGraphBuild(params: { root?: string }) {
  const root = params.root ?? process.cwd()
  await buildIndex(root)
  const idx = getIndex()
  return { ok: true, files: idx.files.length, symbols: idx.symbols.length, edges: idx.edges.length, updatedAt: idx.updatedAt }
}
