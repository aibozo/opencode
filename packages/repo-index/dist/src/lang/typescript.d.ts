import type { SymbolInfo, Edge } from "../types";
export declare function parseTypeScript(root: string, file: string): {
    symbols: SymbolInfo[];
    edges: Edge[];
};
