import { appendExposure } from "@opencode/metrics/dist/exposure.js"
import type { ContextPack } from "@opencode/shared/src/types"

export function logWorkingSet(sessionId: string, root: string, pack: ContextPack, fileLengths: Map<string, number>) {
  const full = pack.full.flatMap((f) => {
    if (!f.ranges?.length) {
      const n = fileLengths.get(f.path) ?? 1_000_000
      return [{ path: f.path, start: 1, end: n }]
    }
    return f.ranges.map(([a, b]) => ({ path: f.path, start: a, end: b }))
  })
  appendExposure({ sessionId, root, full, spans: [], when: new Date().toISOString() })
}

export function logSpan(sessionId: string, root: string, path: string, start: number, end: number) {
  appendExposure({ sessionId, root, full: [], spans: [{ path, start, end }], when: new Date().toISOString() })
}
