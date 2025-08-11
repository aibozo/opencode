import { createRequire } from "node:module";
import { relative } from "node:path";
import { sha1 } from "../skeleton.js";
const require = createRequire(import.meta.url);
const Parser = require("tree-sitter");
const TypeScript = require("tree-sitter-typescript");
const parser = new Parser();
parser.setLanguage(TypeScript.typescript);
export function skeletonizeTS(root, file, src) {
    return skeletonizeJSLike(root, file, src);
}
function skeletonizeJSLike(root, file, src) {
    const tree = parser.parse(src);
    const els = [];
    const out = [];
    const rel = relative(root, file).replace(/\\/g, "/");
    const lines = src.split(/\r?\n/);
    const L = (n) => n + 1;
    const slice = (a, b) => lines.slice(a, b + 1).join("\n");
    tree.rootNode.namedChildren?.forEach((n) => {
        if (n.type.includes("import"))
            out.push(slice(n.startPosition.row, n.endPosition.row));
    });
    if (out.length)
        out.push("");
    function push(kind, name, a, b) {
        const text = slice(a, b);
        const e = { kind, name, startLine: L(a), endLine: L(b), linesElided: b - a + 1, sha1: sha1(text) };
        els.push(e);
        return e;
    }
    function headerRow(node) {
        let r = node.startPosition.row;
        const walk = (n) => {
            if (n.type === "{" || n.type === "statement_block") {
                r = Math.max(r, n.startPosition.row);
                return;
            }
            n.namedChildren?.forEach(walk);
        };
        walk(node);
        return r;
    }
    function emitFunc(node) {
        const id = node.childForFieldName("name");
        const name = id?.text ?? "anonymous";
        const hr = headerRow(node);
        out.push(slice(node.startPosition.row, hr) + " {");
        const e = push("func", name, hr + 1, node.endPosition.row - 1);
        out.push(`  /* ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫ */`);
        out.push("\n}");
        out.push("");
    }
    function emitClass(node) {
        const id = node.childForFieldName("name");
        const name = id?.text ?? "AnonClass";
        const hr = headerRow(node);
        out.push(slice(node.startPosition.row, hr) + " {");
        const ms = node.namedChildren?.filter((c) => c.type === "method_definition") ?? [];
        if (ms.length) {
            out.push("  // methods:");
            for (const m of ms) {
                const n = m.childForFieldName("name")?.text ?? "anonymous";
                out.push(`  // - ${n}(...)`);
            }
        }
        const e = push("class", name, hr + 1, node.endPosition.row - 1);
        out.push(`  /* ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫ */`);
        out.push("\n}");
        out.push("");
    }
    function emitMethod(node, cls) {
        const id = node.childForFieldName("name");
        const name = id?.text ?? "anonymous";
        const hr = headerRow(node);
        const e = push("method", cls ? `${cls}.${name}` : name, hr + 1, node.endPosition.row - 1);
        // do not print method bodies; class elision covers them
        return e;
    }
    function emitType(node) {
        out.push(slice(node.startPosition.row, node.endPosition.row));
        out.push("");
    }
    const walk = (n) => {
        if (n.type === "function_declaration") {
            emitFunc(n);
            return;
        }
        if (n.type === "class_declaration") {
            emitClass(n);
            return;
        }
        if (n.type === "interface_declaration" || n.type === "type_alias_declaration" || n.type === "enum_declaration") {
            emitType(n);
            return;
        }
        if (n.type === "method_definition") {
            emitMethod(n, n.parent?.childForFieldName?.("name")?.text);
            return;
        }
        if (n.type === "lexical_declaration" && /export/.test(n.text)) {
            emitType(n);
            return;
        }
        n.namedChildren?.forEach(walk);
    };
    walk(tree.rootNode);
    const text = [`// File: ${rel}`, ...out].join("\n").replace(/\n{3,}/g, "\n\n");
    return { path: rel, lang: "typescript", text, elisions: els };
}
