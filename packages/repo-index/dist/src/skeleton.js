import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { skeletonizePython } from "./skeleton/python.js";
import { skeletonizeTS } from "./skeleton/ts.js";
import { skeletonizeJS } from "./skeleton/js.js";
export function skeletonizeFile(root, path) {
    const src = readFileSync(path, "utf8");
    const lang = langOf(path);
    if (!lang)
        throw new Error(`Unsupported file type: ${path}`);
    if (lang === "python")
        return skeletonizePython(root, path, src);
    if (lang === "typescript")
        return skeletonizeTS(root, path, src);
    return skeletonizeJS(root, path, src);
}
export function sha1(text) {
    return crypto.createHash("sha1").update(text).digest("hex");
}
function langOf(p) {
    if (/\.(py)$/.test(p))
        return "python";
    if (/\.(ts|tsx)$/.test(p))
        return "typescript";
    if (/\.(js|jsx|mjs|cjs)$/.test(p))
        return "javascript";
    return undefined;
}
