import { resolve, relative } from "path";
import { readFileSync } from "fs";
export function normalizeAndCheck(root, p) {
    const abs = resolve(root, p);
    const rel = relative(root, abs).replace(/\\/g, "/");
    if (rel.startsWith(".."))
        throw new Error(`Path escapes root: ${p}`);
    if (/(^|\/)\.(env|env\.local|aws|ssh|git)($|\/)/i.test(rel))
        throw new Error(`Access denied to sensitive path: ${rel}`);
    return { abs, rel };
}
export function readSpan(abs, start, end, maxLines = 8000) {
    if (end < start)
        throw new Error("end < start");
    const lines = readFileSync(abs, "utf8").split(/\r?\n/);
    const a = Math.max(1, start) - 1;
    const b = Math.min(end, lines.length) - 1;
    const count = b - a + 1;
    if (count > maxLines)
        throw new Error(`span too large: ${count} > ${maxLines}`);
    return { text: lines.slice(a, b + 1).join("\n"), total: lines.length };
}
