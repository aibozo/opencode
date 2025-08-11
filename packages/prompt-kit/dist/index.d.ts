import type { ContextPack } from "@opencode/shared/src/types";
export declare function stablePrefixBlock(): {
    text: string;
    sha256: string;
};
export declare function renderContextPack(pack: ContextPack): string;
export declare function assemblePrompt(pack: ContextPack, notes: string, plan: string): string;
export declare function renderContextFrame(opts: {
    pack: ContextPack;
    notes: string;
    recentEdits?: string;
    frameId: string;
    prefixSha256: string;
}): {
    text: string;
    sha256: string;
};
