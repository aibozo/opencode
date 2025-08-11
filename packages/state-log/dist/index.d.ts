export interface DecisionEntry {
    ts: string;
    why: string;
    what: string;
    next?: string;
}
export interface DecisionState {
    entries: DecisionEntry[];
}
export declare function loadLog(): DecisionState;
export declare function appendDecision(e: Omit<DecisionEntry, "ts">): void;
export declare function summarize(limit?: number): string;
export declare function recentEdits(n?: number): string;
