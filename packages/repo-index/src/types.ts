import type { FilePath } from "@opencode/shared/src/types"

export type Lang = "python" | "javascript" | "typescript"

export interface SymbolInfo {
  file: FilePath
  lang: Lang
  name: string
  shortName: string
  kind: "func" | "method" | "class" | "const" | "type" | "var" | "module"
  startLine: number
  endLine: number
  doc?: string
  export?: boolean
}

export interface Edge {
  from: string
  to: string
  type: "calls" | "imports" | "exports"
}

export interface RepoIndex {
  root: string
  files: FilePath[]
  symbols: SymbolInfo[]
  edges: Edge[]
  updatedAt: number
}

export interface BuildOptions {
  include?: string[]
  exclude?: string[]
}
