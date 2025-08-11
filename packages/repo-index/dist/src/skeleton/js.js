import { createRequire } from "node:module";
import { relative } from "node:path";
import { sha1 } from "../skeleton.js";
const require = createRequire(import.meta.url);
const Parser = require("tree-sitter");
const JavaScript = require("tree-sitter-javascript");
const parser = new Parser();
parser.setLanguage(JavaScript);
export function skeletonizeJS(root, file, src) {
    const tree = parser.parse(src);
    const els = [];
    const out = [];
    const rel = relative(root, file).replace(/\\/g, "/");
    const lines = src.split(/\r?\n/);
    const L = (n) => n + 1;
    const slice = (a, b) => lines.slice(a, b + 1).join("\n");
    function push(kind, name, a, b) {
        const text = slice(a, b);
        const e = { kind, name, startLine: L(a), endLine: L(b), linesElided: b - a + 1, sha1: sha1(text) };
        els.push(e);
        return e;
    }
    tree.rootNode.namedChildren?.forEach((n) => {
        if (n.type.includes("import"))
            out.push(slice(n.startPosition.row, n.endPosition.row));
    });
    if (out.length)
        out.push("");
    function hdr(node) {
        let r = node.startPosition.row;
        node.namedChildren?.forEach((ch) => { if (ch.type === "statement_block")
            r = Math.max(r, ch.startPosition.row); });
        return r;
    }
    const walk = (n) => {
        if (n.type === "function_declaration") {
            const id = n.childForFieldName("name");
            const name = id?.text ?? "anonymous";
            const h = hdr(n);
            out.push(slice(n.startPosition.row, h) + " {");
            const e = push("func", name, h + 1, n.endPosition.row - 1);
            out.push(`  /* ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫ */\n}`);
            out.push("");
            return;
        }
        if (n.type === "class_declaration") {
            const id = n.childForFieldName("name");
            const name = id?.text ?? "AnonClass";
            const h = hdr(n);
            out.push(slice(n.startPosition.row, h) + " {");
            const e = push("class", name, h + 1, n.endPosition.row - 1);
            out.push(`  /* ⟪ELIDED L${e.startLine}-${e.endLine}; ${e.linesElided} lines; sha1=${e.sha1}⟫ */\n}`);
            out.push("");
            return;
        }
        n.namedChildren?.forEach(walk);
    };
    walk(tree.rootNode);
    const text = [`// File: ${rel}`, ...out].join("\n").replace(/\n{3,}/g, "\n\n");
    return { path: rel, lang: "javascript", text, elisions: els };
}
