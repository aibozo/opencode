export interface Segment {
    text: string;
    start: number;
    end: number;
    kind: "line" | "code" | "stack" | "para";
}
export declare function segment(text: string): Segment[];
