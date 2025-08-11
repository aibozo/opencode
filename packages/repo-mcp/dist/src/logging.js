import { appendExposure } from "@opencode/metrics/dist/exposure.js";
export function logWorkingSet(sessionId, root, pack, fileLengths) {
    const full = pack.full.flatMap((f) => {
        if (!f.ranges?.length) {
            const n = fileLengths.get(f.path) ?? 1_000_000;
            return [{ path: f.path, start: 1, end: n }];
        }
        return f.ranges.map(([a, b]) => ({ path: f.path, start: a, end: b }));
    });
    appendExposure({ sessionId, root, full, spans: [], when: new Date().toISOString() });
}
export function logSpan(sessionId, root, path, start, end) {
    appendExposure({ sessionId, root, full: [], spans: [{ path, start, end }], when: new Date().toISOString() });
}
