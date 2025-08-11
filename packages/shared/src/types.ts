export type FilePath = string

export interface ContextPack {
  full: Array<{ path: FilePath; ranges?: [number, number][] }>
  skeletons: Array<{ path: FilePath; hash?: string }>
  interfaces: Array<{ path: FilePath }>
  search_hits: Array<{ path: FilePath; line: number; text: string }>
  notes?: string
  budget?: { target: number; used?: number }
}

export interface Elision {
  kind: "func" | "method" | "class" | "module" | "block"
  name?: string
  startLine: number
  endLine: number
  linesElided: number
  sha1: string
}

export interface Skeleton {
  path: FilePath
  lang: "python" | "javascript" | "typescript"
  text: string
  elisions: Elision[]
}
