import type { ContextPack } from "@opencode/shared/src/types";
export declare function stablePrefixBlock(): {
    text: string;
    sha256: string;
};
export declare function renderContextPack(pack: ContextPack): string;
export declare function assemblePrompt(pack: ContextPack, notes: string, plan: string): string;
