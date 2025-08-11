import type { FilePath } from "@opencode/shared/src/types";
export interface SymbolInfo {
    file: FilePath;
    name: string;
    kind: "func" | "class" | "const" | "type" | "var" | "module";
    startLine: number;
    endLine: number;
    doc?: string;
}
export interface Edge {
    from: string;
    to: string;
    type: "calls" | "imports" | "exports";
}
export interface RepoIndex {
    files: FilePath[];
    symbols: SymbolInfo[];
    edges: Edge[];
    updatedAt: number;
}
