import type { SymbolInfo, Edge } from "../types";
export declare function parseJavaScript(root: string, file: string): {
    symbols: SymbolInfo[];
    edges: Edge[];
};
