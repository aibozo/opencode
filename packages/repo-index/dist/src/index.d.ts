import type { BuildOptions, RepoIndex } from "./types.js";
export { skeletonizeFile } from "./skeleton.js";
export declare function buildIndex(root: string, opts?: BuildOptions): Promise<RepoIndex>;
export declare function updateIndex(_changedPaths: string[]): Promise<RepoIndex>;
export declare function getIndex(): RepoIndex;
export declare function ensureWatcher(root: string): void;
export declare function initParsers(): boolean;
export declare function parserMode(): "native" | "fallback";
