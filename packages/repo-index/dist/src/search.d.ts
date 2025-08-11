export interface GrepHit {
    path: string;
    line: number;
    text: string;
    score: number;
}
export declare function grepKeywords(root: string, files: string[], keywords: string[], maxPerFile?: number, caseSensitive?: boolean): GrepHit[];
export declare function keywordsFromTask(task: string): string[];
export declare function grepRegex(root: string, files: string[], re: RegExp, maxPerFile?: number): GrepHit[];
