declare module '@opencode/nl-compress/src/index' {
  export interface CompressOpts { budgetTokens: number; keywords?: string[]; keepAtLeast?: number; lambda?: number }
  export function compress(text: string, opts: CompressOpts): Promise<string>
}

// Runtime-relative imports to metrics dist
declare module '@opencode/metrics/dist/exposure.js' {
  export interface ExposureRange { path: string; start: number; end: number }
  export interface ExposureLog { sessionId: string; root: string; full: ExposureRange[]; spans: ExposureRange[]; when: string }
  export function appendExposure(log: ExposureLog): void
  export function readExposures(sessionId: string): ExposureLog[]
  export function mergeExposures(logs: ExposureLog[]): ExposureRange[]
}

declare module '@opencode/metrics/dist/git.js' {
  export interface EditHunk { path: string; start: number; end: number }
  export function diffHunks(baseRef?: string, headRef?: string, cwd?: string): EditHunk[]
}

declare module '@opencode/metrics/dist/recall.js' {
  import type { EditHunk } from '@opencode/metrics/dist/git.js'
  import type { ExposureRange } from '@opencode/metrics/dist/exposure.js'
  export interface RecallResult { total: number; covered: number; pct: number; misses: EditHunk[] }
  export function computeRecall(edits: EditHunk[], exposure: ExposureRange[]): RecallResult
}

declare module '@opencode/metrics/dist/src/exposure.js' {
  export interface ExposureRange { path: string; start: number; end: number }
  export interface ExposureLog { sessionId: string; root: string; full: ExposureRange[]; spans: ExposureRange[]; when: string }
  export function appendExposure(log: ExposureLog): void
  export function readExposures(sessionId: string): ExposureLog[]
  export function mergeExposures(logs: ExposureLog[]): ExposureRange[]
}

declare module '@opencode/metrics/dist/src/git.js' {
  export interface EditHunk { path: string; start: number; end: number }
  export function diffHunks(baseRef?: string, headRef?: string, cwd?: string): EditHunk[]
}

declare module '@opencode/metrics/dist/src/recall.js' {
  import type { EditHunk } from '@opencode/metrics/dist/src/git.js'
  import type { ExposureRange } from '@opencode/metrics/dist/src/exposure.js'
  export interface RecallResult { total: number; covered: number; pct: number; misses: EditHunk[] }
  export function computeRecall(edits: EditHunk[], exposure: ExposureRange[]): RecallResult
}
