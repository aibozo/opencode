import { createRequire } from "node:module"
import { relative } from "node:path"
import type { Skeleton, Elision } from "@opencode/shared/src/types"
import { sha1 } from "../skeleton.js"

const require = createRequire(import.meta.url)
const Parser: any = require("tree-sitter")
const Python: any = require("tree-sitter-python")
const parser = new Parser()
parser.setLanguage(Python)

export function skeletonizePython(root: string, file: string, src: string): Skeleton {
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

  const rootNode: any = tree.rootNode
  const first = rootNode.namedChildren?.[0]
  let used = false
  if (first?.type === "expression_statement") {
    const s = first.namedChildren?.[0]
    if (s && (s.type === "string" || s.type === "string_literal")) {
      out.push(src.slice(s.startIndex, s.endIndex))
      used = true
    }
  }

  rootNode.namedChildren?.forEach((n: any) => {
    if (n.type === "import_statement" || n.type === "import_from_statement") out.push(lines[n.startPosition.row])
  })
  if (out.length) out.push("")

  function emit(node: any, ind: string, ctx?: string) {
    if (node.type === "function_definition") {
      const id = node.childForFieldName("name")
      const name = id?.text ?? "anonymous"
      const body = node.childForFieldName("body")
      const p = node.childForFieldName("parameters")
      const endRow = p?.endPosition?.row ?? node.startPosition.row
      out.push(ind + lines.slice(node.startPosition.row, endRow + 1).join("\n"))
      let doc = false
      if (body?.namedChildren?.length) {
        const f = body.namedChildren[0]
        const lit = f?.namedChildren?.[0]
        if (f?.type === "expression_statement" && lit && (lit.type === "string" || lit.type === "string_literal")) {
          out.push(ind + "    " + src.slice(lit.startIndex, lit.endIndex))
          doc = true
        }
      }
      const a = doc ? (body.namedChildren?.[0]?.endPosition?.row ?? body.startPosition.row) + 1 : body.startPosition.row
      const b = node.endPosition.row
      if (b >= a) {
        const e = push(ctx ? "method" : "func", ctx ? `${ctx}.${name}` : name, a, b)
        out.push(ind + `    # ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫`)
      }
      out.push("")
      return
    }
    if (node.type === "class_definition") {
      const id = node.childForFieldName("name")
      const name = id?.text ?? "AnonClass"
      out.push(ind + lines[node.startPosition.row])
      const suite = node.namedChildren?.find((n: any) => n.type === "block" || n.type === "suite") ?? node
      const f = suite?.namedChildren?.find((n: any) => n.type === "expression_statement")
      const lit = f?.namedChildren?.[0]
      if (lit && (lit.type === "string" || lit.type === "string_literal")) out.push(ind + "    " + src.slice(lit.startIndex, lit.endIndex))
      node.namedChildren?.forEach((ch: any) => { if (ch.type === "function_definition") emit(ch, ind + "    ", name) })
      const body = node.childForFieldName("body")
      if (body) {
        const e = push("class", name, body.startPosition.row, node.endPosition.row)
        out.push(ind + `    # ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫`)
      }
      out.push("")
      return
    }
  }

  rootNode.namedChildren?.forEach((n: any) => {
    if (n.type === "function_definition" || n.type === "class_definition") emit(n, "")
    if (n.type === "expression_statement" && !used) {}
  })

  const text = [
    `# File: ${rel}`,
    ...out,
  ].join("\n").replace(/\n{3,}/g, "\n\n")

  return { path: rel, lang: "python", text, elisions: els }
}
