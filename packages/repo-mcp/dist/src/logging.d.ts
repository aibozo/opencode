import type { ContextPack } from "@opencode/shared/src/types";
export declare function logWorkingSet(sessionId: string, root: string, pack: ContextPack, fileLengths: Map<string, number>): void;
export declare function logSpan(sessionId: string, root: string, path: string, start: number, end: number): void;
