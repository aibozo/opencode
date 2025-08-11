import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
const EXP_PATH = ".opencode/state/exposure.jsonl";
export function appendExposure(log) {
    mkdirSync(dirname(EXP_PATH), { recursive: true });
    writeFileSync(EXP_PATH, JSON.stringify(log) + "\n", { flag: "a" });
}
export function readExposures(sessionId) {
    if (!existsSync(EXP_PATH))
        return [];
    const lines = readFileSync(EXP_PATH, "utf8").trim().split("\n").filter(Boolean);
    return lines.map((l) => JSON.parse(l)).filter((x) => x.sessionId === sessionId);
}
export function mergeExposures(logs) {
    const map = new Map();
    const push = (p, start, end) => {
        if (!map.has(p))
            map.set(p, []);
        map.get(p).push([start, end]);
    };
    for (const l of logs) {
        l.full.forEach((r) => push(r.path, r.start, r.end));
        l.spans.forEach((r) => push(r.path, r.start, r.end));
    }
    const out = [];
    for (const [path, ranges] of map) {
        const sorted = ranges.sort((a, b) => a[0] - b[0]);
        let [s, e] = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
            const [cs, ce] = sorted[i];
            if (cs <= e + 1)
                e = Math.max(e, ce);
            else {
                out.push({ path, start: s, end: e });
                [s, e] = [cs, ce];
            }
        }
        out.push({ path, start: s, end: e });
    }
    return out;
}
