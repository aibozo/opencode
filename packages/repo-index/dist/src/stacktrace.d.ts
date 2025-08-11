export interface StackHit {
    path: string;
    line?: number;
    col?: number;
    score: number;
    kind: "py" | "js" | "jest" | "generic";
}
export declare function extractStackHits(text: string): StackHit[];
