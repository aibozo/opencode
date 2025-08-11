import { createRequire } from "node:module"
import { relative } from "node:path"
import type { Skeleton, Elision } from "@opencode/shared/src/types"
import { sha1 } from "../skeleton.js"

const require = createRequire(import.meta.url)
const Parser: any = require("tree-sitter")
const JavaScript: any = require("tree-sitter-javascript")
const parser = new Parser()
parser.setLanguage(JavaScript)

export function skeletonizeJS(root: string, file: string, src: string): Skeleton {
  const tree = parser.parse(src)
  const els: Elision[] = []
  const out: string[] = []
  const rel = relative(root, file).replace(/\\/g, "/")
  const lines = src.split(/\r?\n/)
  const L = (n: number) => n + 1
  const slice = (a: number, b: number) => lines.slice(a, b + 1).join("\n")

  function push(kind: Elision["kind"], name: string | undefined, a: number, b: number) {
    const text = slice(a, b)
    const e = { kind, name, startLine: L(a), endLine: L(b), linesElided: b - a + 1, sha1: sha1(text) }
    els.push(e)
    return e
  }

  tree.rootNode.namedChildren?.forEach((n: any) => {
    if (n.type.includes("import")) out.push(slice(n.startPosition.row, n.endPosition.row))
  })
  if (out.length) out.push("")

  function hdr(node: any): number {
    let r = node.startPosition.row
    node.namedChildren?.forEach((ch: any) => { if (ch.type === "statement_block") r = Math.max(r, ch.startPosition.row) })
    return r
  }

  const walk = (n: any) => {
    if (n.type === "function_declaration") {
      const id = n.childForFieldName("name")
      const name = id?.text ?? "anonymous"
      const h = hdr(n)
      out.push(slice(n.startPosition.row, h) + " {")
      const e = push("func", name, h + 1, n.endPosition.row - 1)
      out.push(`  /* ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫ */\n}`)
      out.push("")
      return
    }
    if (n.type === "class_declaration") {
      const id = n.childForFieldName("name")
      const name = id?.text ?? "AnonClass"
      const h = hdr(n)
      out.push(slice(n.startPosition.row, h) + " {")
      const e = push("class", name, h + 1, n.endPosition.row - 1)
      out.push(`  /* ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫ */\n}`)
      out.push("")
      return
    }
    n.namedChildren?.forEach(walk)
  }
  walk(tree.rootNode)

  const text = [`// File: ${rel}`, ...out].join("\n").replace(/\n{3,}/g, "\n\n")
  return { path: rel, lang: "javascript", text, elisions: els }
}
