import type { SymbolInfo, Edge } from "../types";
export declare function parsePython(root: string, file: string): {
    symbols: SymbolInfo[];
    edges: Edge[];
};
