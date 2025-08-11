import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve as resolvePath } from "path";
function applyUnifiedDiffText(diff, cwd) {
    const lines = diff.replace(/\r\n/g, "\n").split("\n");
    let i = 0;
    while (i < lines.length) {
        if (!lines[i].startsWith("--- a/")) {
            i++;
            continue;
        }
        const oldPath = lines[i].slice(6).trim();
        const newHdr = lines[i + 1] || "";
        if (!newHdr.startsWith("+++ b/")) {
            i += 1;
            continue;
        }
        const newPath = newHdr.slice(6).trim();
        i += 2;
        const target = newPath || oldPath;
        const abs = resolvePath(cwd, target);
        let content = readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
        let fileLines = content.split("\n");
        while (i < lines.length && lines[i].startsWith("@@")) {
            const m = /^@@ -([0-9]+)(?:,([0-9]+))? \+([0-9]+)(?:,([0-9]+))? @@/.exec(lines[i]);
            if (!m) {
                i++;
                continue;
            }
            const oldStart = parseInt(m[1], 10);
            const oldLen = m[2] ? parseInt(m[2], 10) : 1;
            i++;
            const newBlock = [];
            let seen = 0;
            while (i < lines.length && !lines[i].startsWith("@@") && !lines[i].startsWith("--- a/")) {
                const L = lines[i];
                if (!L) {
                    newBlock.push("");
                    i++;
                    continue;
                }
                const tag = L[0];
                const body = L.slice(1);
                if (tag === ' ') {
                    newBlock.push(body);
                    seen++;
                }
                else if (tag === '+') {
                    newBlock.push(body);
                }
                else if (tag === '-') {
                    seen++;
                }
                i++;
            }
            fileLines.splice(oldStart - 1, oldLen, ...newBlock);
        }
        writeFileSync(abs, fileLines.join("\n"));
    }
}
export function applyPatch(diffPath) {
    const diff = readFileSync(diffPath, "utf8");
    const cwd = dirname(diffPath);
    execSync("git init", { cwd });
    execSync("git diff --quiet || true", { cwd });
    execSync("git add -A && git commit -m 'baseline' || true", { cwd });
    applyUnifiedDiffText(diff, cwd);
    execSync("git add -A && git commit -m 'apply expected patch'", { cwd });
}
