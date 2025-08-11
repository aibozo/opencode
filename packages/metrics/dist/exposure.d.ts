import type { ExposureLog, ExposureRange } from "./types";
export declare function appendExposure(log: ExposureLog): void;
export declare function readExposures(sessionId: string): ExposureLog[];
export declare function mergeExposures(logs: ExposureLog[]): ExposureRange[];
