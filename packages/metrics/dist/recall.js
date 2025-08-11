export function computeRecall(edits, exposure) {
    const coverMap = new Map();
    exposure.forEach((r) => {
        const arr = coverMap.get(r.path) ?? [];
        arr.push(r);
        coverMap.set(r.path, arr);
    });
    let covered = 0;
    const misses = [];
    for (const h of edits) {
        const ranges = (coverMap.get(h.path) ?? []).sort((a, b) => a.start - b.start);
        let ok = false;
        for (const r of ranges) {
            if (h.start >= r.start && h.end <= r.end) {
                ok = true;
                break;
            }
        }
        if (ok)
            covered++;
        else
            misses.push(h);
    }
    const total = edits.length;
    const pct = total ? Math.round((covered / total) * 1000) / 10 : 100;
    return { total, covered, pct, misses };
}
