export declare function normalizeAndCheck(root: string, p: string): {
    abs: string;
    rel: string;
};
export declare function readSpan(abs: string, start: number, end: number, maxLines?: number): {
    text: string;
    total: number;
};
