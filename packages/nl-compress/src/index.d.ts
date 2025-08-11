export interface CompressOpts {
    budgetTokens: number;
    keywords?: string[];
    keepAtLeast?: number;
    lambda?: number;
}
export declare function compress(text: string, opts: CompressOpts): Promise<string>;
