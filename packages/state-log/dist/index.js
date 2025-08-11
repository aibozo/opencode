import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
const PATH = ".opencode/state/decision-log.json";
export function loadLog() {
    if (!existsSync(PATH))
        return { entries: [] };
    try {
        const s = readFileSync(PATH, "utf8");
        const j = JSON.parse(s);
        return j && Array.isArray(j.entries) ? j : { entries: [] };
    }
    catch {
        return { entries: [] };
    }
}
export function appendDecision(e) {
    const s = loadLog();
    s.entries.push({ ts: new Date().toISOString(), why: e.why, what: e.what, next: e.next });
    mkdirSync(dirname(PATH), { recursive: true });
    writeFileSync(PATH, JSON.stringify(s, null, 2));
}
export function summarize(limit = 10) {
    const s = loadLog();
    const t = s.entries.slice(-limit);
    if (!t.length)
        return "(no prior decisions)";
    return t
        .map((x) => `- [${x.ts}] why: ${x.why} | what: ${x.what}${x.next ? ` | next: ${x.next}` : ""}`)
        .join("\n");
}
