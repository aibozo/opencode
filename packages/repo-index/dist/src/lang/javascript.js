import { readFileSync } from "node:fs";
import { extname, relative } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let Parser = undefined;
let JavaScript = undefined;
try {
    Parser = require("tree-sitter");
    JavaScript = require("tree-sitter-javascript");
}
catch { }
function detectModuleName(root, file) {
    const rel = relative(root, file).replace(/\\/g, "/");
    return rel.replace(/\.(mjs|cjs|js|jsx)$/, "").replace(/\//g, ".");
}
export function parseJavaScript(root, file) {
    const src = readFileSync(file, "utf8");
    if (Parser && JavaScript) {
        try {
            const parser = new Parser();
            parser.setLanguage(JavaScript);
            const tree = parser.parse(src);
            const symbols = [];
            const edges = [];
            const moduleName = detectModuleName(root, file);
            const lineOf = (node) => node.startPosition.row + 1;
            const scopedName = (parts) => `${moduleName}:${parts.filter(Boolean).join(".")}`;
            const exportFlag = (node) => {
                let n = node;
                while (n) {
                    if (n.type === "export_statement" || n.type === "export_clause" || n.type === "export_declaration")
                        return true;
                    n = n.parent;
                }
                return false;
            };
            const walk = (node, classCtx) => {
                if (node.type === "function_declaration") {
                    const n = node.childForFieldName?.("name");
                    const name = n?.text ?? "anonymous";
                    const full = scopedName([classCtx ?? "", name]);
                    symbols.push({ file, lang: "javascript", name: full, shortName: name, kind: classCtx ? "method" : "func", startLine: lineOf(node), endLine: node.endPosition.row + 1, export: exportFlag(node) });
                    const ids = node.descendantsOfType?.(["identifier"]) ?? [];
                    for (const id of ids)
                        edges.push({ from: full, to: id.text, type: "calls" });
                }
                if (node.type === "class_declaration") {
                    const n = node.childForFieldName?.("name");
                    const name = n?.text ?? "AnonClass";
                    const full = scopedName([name]);
                    symbols.push({ file, lang: "javascript", name: full, shortName: name, kind: "class", startLine: lineOf(node), endLine: node.endPosition.row + 1, export: exportFlag(node) });
                    for (const ch of node.namedChildren ?? [])
                        walk(ch, name);
                }
                if (node.type.includes?.("import"))
                    edges.push({ from: scopedName([]), to: node.text, type: "imports" });
                if (node.type.includes?.("export"))
                    edges.push({ from: scopedName([]), to: "exports", type: "exports" });
                for (const ch of node.namedChildren ?? [])
                    walk(ch, classCtx);
            };
            walk(tree.rootNode);
            const lang = [".ts", ".tsx"].includes(extname(file)) ? "typescript" : "javascript";
            symbols.push({ file, lang, name: scopedName([]), shortName: moduleName, kind: "module", startLine: 1, endLine: tree.rootNode.endPosition.row + 1 });
            return { symbols, edges };
        }
        catch { }
    }
    const symbols = [];
    const edges = [];
    const moduleName = detectModuleName(root, file);
    const scopedName = (parts) => `${moduleName}:${parts.filter(Boolean).join(".")}`;
    const srcLines = src.split(/\r?\n/);
    const seenCalls = new Set();
    for (let i = 0; i < srcLines.length; i++) {
        const l = srcLines[i];
        const mFunc = /^\s*(export\s+)?function\s+([A-Za-z_][\w]*)\s*\(/.exec(l);
        if (mFunc)
            symbols.push({ file, lang: "javascript", name: scopedName([mFunc[2]]), shortName: mFunc[2], kind: "func", startLine: i + 1, endLine: i + 1, export: !!mFunc[1] });
        const mClass = /^\s*(export\s+)?class\s+([A-Za-z_][\w]*)/.exec(l);
        if (mClass)
            symbols.push({ file, lang: "javascript", name: scopedName([mClass[2]]), shortName: mClass[2], kind: "class", startLine: i + 1, endLine: i + 1, export: !!mClass[1] });
        if (/^\s*import\b/.test(l))
            edges.push({ from: scopedName([]), to: l.trim(), type: "imports" });
        const callRe = /\b([A-Za-z_$][\w$]*)\s*\(/g;
        let m = null;
        while ((m = callRe.exec(l)) !== null) {
            const name = m[1];
            if (/^(if|for|while|switch|return|function|class|typeof|new|catch|await|async)$/.test(name))
                continue;
            if (!seenCalls.has(name)) {
                seenCalls.add(name);
                edges.push({ from: scopedName([]), to: name, type: "calls" });
            }
        }
    }
    const lang = [".ts", ".tsx"].includes(extname(file)) ? "typescript" : "javascript";
    symbols.push({ file, lang, name: scopedName([]), shortName: moduleName, kind: "module", startLine: 1, endLine: srcLines.length });
    return { symbols, edges };
}
