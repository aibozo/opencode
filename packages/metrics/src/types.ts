export interface ExposureRange { path: string; start: number; end: number }
export interface ExposureLog {
  sessionId: string
  root: string
  full: ExposureRange[]
  spans: ExposureRange[]
  when: string
}
export interface EditHunk { path: string; start: number; end: number }

