import type { Segment } from "./segment";
export interface ScoreOpts {
    keywords?: string[];
}
export declare function scoreSegments(segs: Segment[], opts?: ScoreOpts): number[];
