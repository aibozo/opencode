import type { ContextPack } from "@opencode/shared/src/types";
export interface SelectOptions {
    task: string;
    budgetTokens?: number;
    radius?: 1 | 2;
    preferSpanContext?: boolean;
    windowLines?: number;
}
export interface SelectionDebug {
    scoreTable: Array<{
        path: string;
        score: number;
        reasons: string[];
    }>;
    tokens: {
        target: number;
        used: number;
        headroom: number;
    };
}
export interface WorkingSetResult {
    pack: ContextPack;
    debug: SelectionDebug;
}
export declare function selectWorkingSet(root: string, opts: SelectOptions): Promise<WorkingSetResult>;
