export interface Tokenizer {
    estimateTokens(text: string): number;
}
export declare const HeuristicTokenizer: Tokenizer;
export declare function createTokenizer(): Promise<Tokenizer>;
