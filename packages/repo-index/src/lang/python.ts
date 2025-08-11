import { readFileSync } from "node:fs"
import { relative } from "node:path"
import { createRequire } from "node:module"
import type { SymbolInfo, Edge } from "../types"

const require = createRequire(import.meta.url)
let Parser: any = undefined
let Python: any = undefined
try {
  Parser = require("tree-sitter")
  Python = require("tree-sitter-python")
} catch {}

function detectModuleName(root: string, file: string): string {
  const rel = relative(root, file).replace(/\\/g, "/")
  return rel.replace(/\.py$/, "").replace(/\//g, ".")
}

export function parsePython(root: string, file: string): { symbols: SymbolInfo[]; edges: Edge[] } {
  const src = readFileSync(file, "utf8")
  if (Parser && Python) {
    try {
      const parser = new Parser()
      parser.setLanguage(Python)
      const tree = parser.parse(src)
      const symbols: SymbolInfo[] = []
      const edges: Edge[] = []
      const moduleName = detectModuleName(root, file)

      const lineOf = (node: { startPosition: { row: number } }) => node.startPosition.row + 1
      const scopedName = (parts: string[]) => `${moduleName}:${parts.filter(Boolean).join("." )}`

      const docstringFor = (node: any): string | undefined => {
        const suite = node?.namedChildren?.find((n: any) => n.type === "block" || n.type === "suite") ?? node
        const first = suite?.namedChildren?.find((n: any) => n.type === "expression_statement")
        const str = first?.namedChildren?.[0]
        if (str && (str.type === "string" || str.type === "string_literal")) return src.slice(str.startIndex, str.endIndex)
      }

      const walk = (node: any, classCtx?: string) => {
        if (node.type === "function_definition") {
          const n = node.childForFieldName?.("name")
          const name = n?.text ?? "anonymous"
          const kind: SymbolInfo["kind"] = classCtx ? "method" : "func"
          const full = scopedName([classCtx ?? "", name])
          symbols.push({ file, lang: "python", name: full, shortName: name, kind, startLine: lineOf(node), endLine: node.endPosition.row + 1, doc: docstringFor(node) })
          const body = node.childForFieldName?.("body")
          const ids: any[] = body?.descendantsOfType?.(["identifier"]) ?? []
          for (const id of ids) edges.push({ from: full, to: id.text, type: "calls" })
        }

        if (node.type === "class_definition") {
          const n = node.childForFieldName?.("name")
          const name = n?.text ?? "AnonClass"
          const full = scopedName([name])
          symbols.push({ file, lang: "python", name: full, shortName: name, kind: "class", startLine: lineOf(node), endLine: node.endPosition.row + 1, doc: docstringFor(node) })
          for (const ch of node.namedChildren ?? []) walk(ch, name)
        }

        if (node.type === "import_statement" || node.type === "import_from_statement") edges.push({ from: scopedName([]), to: node.text, type: "imports" })
        for (const ch of node.namedChildren ?? []) walk(ch, classCtx)
      }

      walk(tree.rootNode)
      symbols.push({ file, lang: "python", name: scopedName([]), shortName: moduleName, kind: "module", startLine: 1, endLine: tree.rootNode.endPosition.row + 1 })
      return { symbols, edges }
    } catch {}
  }
  // Fallback: simple regex-based extraction for tests when tree-sitter is unavailable
  const symbols: SymbolInfo[] = []
  const edges: Edge[] = []
  const moduleName = detectModuleName(root, file)
  const scopedName = (parts: string[]) => `${moduleName}:${parts.filter(Boolean).join(".")}`
  const lines = src.split(/\r?\n/)
  const seenCalls = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const mFunc = /^\s*def\s+([A-Za-z_][\w]*)\s*\(/.exec(line)
    if (mFunc) symbols.push({ file, lang: "python", name: scopedName([mFunc[1]]), shortName: mFunc[1], kind: "func", startLine: i + 1, endLine: i + 2 })
    const mClass = /^\s*class\s+([A-Za-z_][\w]*)/.exec(line)
    if (mClass) symbols.push({ file, lang: "python", name: scopedName([mClass[1]]), shortName: mClass[1], kind: "class", startLine: i + 1, endLine: i + 2 })
    if (/^\s*import\b/.test(line)) edges.push({ from: scopedName([]), to: line.trim(), type: "imports" })
    const callRe = /\b([A-Za-z_][\w]*)\s*\(/g
    let m: RegExpExecArray | null = null
    while ((m = callRe.exec(line)) !== null) {
      const name = m[1]
      if (/(def|class|if|for|while|with|return|print|assert|lambda)$/.test(name)) continue
      if (!seenCalls.has(name)) {
        seenCalls.add(name)
        edges.push({ from: scopedName([]), to: name, type: "calls" })
      }
    }
  }
  symbols.push({ file, lang: "python", name: scopedName([]), shortName: moduleName, kind: "module", startLine: 1, endLine: lines.length })
  return { symbols, edges }
}
