import fg from "fast-glob";
import { resolve } from "node:path";
import { parsePython } from "./lang/python.js";
import { parseJavaScript } from "./lang/javascript.js";
import { parseTypeScript } from "./lang/typescript.js";
import { startWatcher } from "./watcher.js";
import { createRequire } from "node:module";
export { skeletonizeFile } from "./skeleton.js";
let CURRENT_INDEX = { root: "", files: [], symbols: [], edges: [], updatedAt: 0 };
function langOf(path) {
    if (/\.(py)$/.test(path))
        return "python";
    if (/\.(ts|tsx)$/.test(path))
        return "typescript";
    if (/\.(js|jsx|mjs|cjs)$/.test(path))
        return "javascript";
    return undefined;
}
export async function buildIndex(root, opts = {}) {
    const include = opts.include ?? ["**/*.{py,ts,tsx,js,jsx}"];
    const exclude = opts.exclude ?? ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"];
    const files = await fg(include, { cwd: root, ignore: exclude, absolute: true });
    const symbols = [];
    const edges = [];
    for (const file of files) {
        const lang = langOf(file);
        if (!lang)
            continue;
        if (lang === "python") {
            const { symbols: ss, edges: es } = parsePython(root, file);
            symbols.push(...ss);
            edges.push(...es);
        }
        if (lang === "typescript") {
            const { symbols: ss, edges: es } = parseTypeScript(root, file);
            symbols.push(...ss);
            edges.push(...es);
        }
        if (lang === "javascript") {
            const { symbols: ss, edges: es } = parseJavaScript(root, file);
            symbols.push(...ss);
            edges.push(...es);
        }
    }
    CURRENT_INDEX = { root: resolve(root), files, symbols, edges, updatedAt: Date.now() };
    return CURRENT_INDEX;
}
export async function updateIndex(_changedPaths) {
    return CURRENT_INDEX.root ? buildIndex(CURRENT_INDEX.root) : CURRENT_INDEX;
}
export function getIndex() { return CURRENT_INDEX; }
export function ensureWatcher(root) {
    startWatcher(root, async () => { await updateIndex([]); });
}
export function initParsers() {
    const require = createRequire(import.meta.url);
    try {
        require("tree-sitter");
        require("tree-sitter-python");
        require("tree-sitter-javascript");
        require("tree-sitter-typescript");
        return true;
    }
    catch {
        return false;
    }
}
export function parserMode() {
    const require = createRequire(import.meta.url);
    try {
        const P = require("tree-sitter");
        const L = require("tree-sitter-python");
        const p = new P();
        p.setLanguage(L);
        return "native";
    }
    catch {
        return "fallback";
    }
}
