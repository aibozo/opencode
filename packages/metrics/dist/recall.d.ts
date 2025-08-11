import type { EditHunk, ExposureRange } from "./types";
export interface RecallResult {
    total: number;
    covered: number;
    pct: number;
    misses: EditHunk[];
}
export declare function computeRecall(edits: EditHunk[], exposure: ExposureRange[]): RecallResult;
