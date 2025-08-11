import { readFileSync } from "node:fs"
import { relative } from "node:path"
import { createRequire } from "node:module"
import type { SymbolInfo, Edge } from "../types"

const require = createRequire(import.meta.url)
let Parser: any = undefined
let TypeScript: any = undefined
try {
  Parser = require("tree-sitter")
  TypeScript = require("tree-sitter-typescript")
} catch {}

function detectModuleName(root: string, file: string): string {
  const rel = relative(root, file).replace(/\\/g, "/")
  return rel.replace(/\.(ts|tsx)$/, "").replace(/\//g, ".")
}

export function parseTypeScript(root: string, file: string): { symbols: SymbolInfo[]; edges: Edge[] } {
  const src = readFileSync(file, "utf8")
  if (Parser && TypeScript) {
    try {
      const parser = new Parser()
      parser.setLanguage(TypeScript.typescript)
      const tree = parser.parse(src)
      const symbols: SymbolInfo[] = []
      const edges: Edge[] = []
      const moduleName = detectModuleName(root, file)
      const lineOf = (node: { startPosition: { row: number } }) => node.startPosition.row + 1
      const scopedName = (parts: string[]) => `${moduleName}:${parts.filter(Boolean).join(".")}`
      const exportFlag = (node: any): boolean => { let n = node; while (n) { if (n.type?.includes?.("export")) return true; n = n.parent } return false }
      const walk = (node: any, classCtx?: string) => {
        if (node.type === "function_declaration" || node.type === "method_definition") {
          const id = node.childForFieldName?.("name") ?? node.child?.(1)
          const name = id?.text ?? "anonymous"
          const full = scopedName([classCtx ?? "", name])
          const kind: SymbolInfo["kind"] = node.type === "method_definition" ? "method" : "func"
          symbols.push({ file, lang: "typescript", name: full, shortName: name, kind, startLine: lineOf(node), endLine: node.endPosition.row + 1, export: exportFlag(node) })
          const ids: any[] = node.descendantsOfType?.(["identifier"]) ?? []
          for (const idn of ids) edges.push({ from: full, to: idn.text, type: "calls" })
        }
        if (node.type === "class_declaration" || node.type === "interface_declaration" || node.type === "type_alias_declaration") {
          const n = node.childForFieldName?.("name")
          const name = n?.text ?? "Anon"
          const kind: SymbolInfo["kind"] = node.type === "class_declaration" ? "class" : "type"
          const full = scopedName([name])
          symbols.push({ file, lang: "typescript", name: full, shortName: name, kind, startLine: lineOf(node), endLine: node.endPosition.row + 1, export: exportFlag(node) })
          for (const ch of node.namedChildren ?? []) walk(ch, name)
        }
        if (node.type?.includes?.("import")) edges.push({ from: scopedName([]), to: node.text, type: "imports" })
        if (node.type?.includes?.("export")) edges.push({ from: scopedName([]), to: "exports", type: "exports" })
        for (const ch of node.namedChildren ?? []) walk(ch, classCtx)
      }
      walk(tree.rootNode)
      symbols.push({ file, lang: "typescript", name: scopedName([]), shortName: moduleName, kind: "module", startLine: 1, endLine: tree.rootNode.endPosition.row + 1 })
      return { symbols, edges }
    } catch {}
  }
  const symbols: SymbolInfo[] = []
  const edges: Edge[] = []
  const moduleName = detectModuleName(root, file)
  const scopedName = (parts: string[]) => `${moduleName}:${parts.filter(Boolean).join(".")}`
  const lines = src.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const mFunc = /^\s*(export\s+)?function\s+([A-Za-z_][\w]*)\s*\(/.exec(l)
    if (mFunc) symbols.push({ file, lang: "typescript", name: scopedName([mFunc[2]]), shortName: mFunc[2], kind: "func", startLine: i + 1, endLine: i + 1, export: !!mFunc[1] })
    const mClass = /^\s*(export\s+)?class\s+([A-Za-z_][\w]*)/.exec(l)
    if (mClass) symbols.push({ file, lang: "typescript", name: scopedName([mClass[2]]), shortName: mClass[2], kind: "class", startLine: i + 1, endLine: i + 1, export: !!mClass[1] })
    if (/^\s*import\b/.test(l)) edges.push({ from: scopedName([]), to: l.trim(), type: "imports" })
  }
  symbols.push({ file, lang: "typescript", name: scopedName([]), shortName: moduleName, kind: "module", startLine: 1, endLine: lines.length })
  return { symbols, edges }
}
