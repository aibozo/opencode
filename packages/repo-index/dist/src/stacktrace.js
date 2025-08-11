// Extract file/line hints from Python, Node/JS, and Jest-style traces.
export function extractStackHits(text) {
    const hits = [];
    const py = [...text.matchAll(/File \"([^\"]+\.py)\", line (\d+)/g)];
    for (const m of py)
        hits.push({ path: m[1], line: +m[2], score: 3, kind: "py" });
    const js = [...text.matchAll(/(?:at |\()?(?:file:\/\/)?([^\s)]+?\.(?:[tj]s)x?):(\d+)(?::(\d+))?/g)];
    for (const m of js)
        hits.push({ path: m[1], line: +m[2], col: m[3] ? +m[3] : undefined, score: 3, kind: "js" });
    const jest = [...text.matchAll(/at ([^:\s]+?\.(?:[tj]s)x?):(\d+)(?::(\d+))?/g)];
    for (const m of jest)
        hits.push({ path: m[1], line: +m[2], col: m[3] ? +m[3] : undefined, score: 2, kind: "jest" });
    const generic = [...text.matchAll(/([A-Za-z0-9_./-]+\.(?:py|t[sj]s)x?)/g)];
    for (const m of generic)
        hits.push({ path: m[1], score: 1, kind: "generic" });
    const map = new Map();
    for (const h of hits) {
        const k = `${h.path}:${h.line ?? 0}`;
        const prev = map.get(k);
        if (!prev || h.score > prev.score)
            map.set(k, h);
    }
    return [...map.values()];
}
