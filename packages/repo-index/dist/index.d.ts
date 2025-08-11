import type { RepoIndex } from "./types";
export declare function buildIndex(root: string): Promise<RepoIndex>;
export declare function updateIndex(_changedPaths: string[]): Promise<RepoIndex>;
export declare function getIndex(): RepoIndex;
