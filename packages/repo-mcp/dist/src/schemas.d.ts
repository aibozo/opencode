import { z } from "zod";
export declare const ZSelectArgs: z.ZodObject<{
    task: z.ZodString;
    budgetTokens: z.ZodOptional<z.ZodNumber>;
    radius: z.ZodOptional<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>]>>;
    preferSpanContext: z.ZodOptional<z.ZodBoolean>;
    windowLines: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    task: string;
    budgetTokens?: number | undefined;
    radius?: 2 | 1 | undefined;
    preferSpanContext?: boolean | undefined;
    windowLines?: number | undefined;
}, {
    task: string;
    budgetTokens?: number | undefined;
    radius?: 2 | 1 | undefined;
    preferSpanContext?: boolean | undefined;
    windowLines?: number | undefined;
}>;
export declare const ZReadSpanArgs: z.ZodObject<{
    path: z.ZodString;
    start: z.ZodNumber;
    end: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    path: string;
    start: number;
    end: number;
}, {
    path: string;
    start: number;
    end: number;
}>;
export declare const ZSkeletonArgs: z.ZodObject<{
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
}, {
    path: string;
}>;
export declare const ZSearchArgs: z.ZodObject<{
    pattern: z.ZodString;
    globs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxHits: z.ZodOptional<z.ZodNumber>;
    caseSensitive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    pattern: string;
    globs?: string[] | undefined;
    maxHits?: number | undefined;
    caseSensitive?: boolean | undefined;
}, {
    pattern: string;
    globs?: string[] | undefined;
    maxHits?: number | undefined;
    caseSensitive?: boolean | undefined;
}>;
export declare const ZCompressArgs: z.ZodObject<{
    text: z.ZodString;
    budgetTokens: z.ZodNumber;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    budgetTokens: number;
    text: string;
    keywords?: string[] | undefined;
}, {
    budgetTokens: number;
    text: string;
    keywords?: string[] | undefined;
}>;
export declare const ZSessionStartArgs: z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    label?: string | undefined;
}, {
    label?: string | undefined;
}>;
export declare const ZSessionIdArgs: z.ZodObject<{
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
}, {
    sessionId: string;
}>;
export declare const ZRecallArgs: z.ZodObject<{
    sessionId: z.ZodString;
    baseRef: z.ZodOptional<z.ZodString>;
    headRef: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    baseRef?: string | undefined;
    headRef?: string | undefined;
}, {
    sessionId: string;
    baseRef?: string | undefined;
    headRef?: string | undefined;
}>;
export declare const ZExpandArgs: z.ZodObject<{
    task: z.ZodString;
    sessionId: z.ZodString;
    radiusDelta: z.ZodDefault<z.ZodNumber>;
    budgetTokens: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    task: string;
    sessionId: string;
    radiusDelta: number;
    budgetTokens?: number | undefined;
}, {
    task: string;
    sessionId: string;
    budgetTokens?: number | undefined;
    radiusDelta?: number | undefined;
}>;
export type SelectArgs = z.infer<typeof ZSelectArgs>;
export type ReadSpanArgs = z.infer<typeof ZReadSpanArgs>;
export type SkeletonArgs = z.infer<typeof ZSkeletonArgs>;
export type SearchArgs = z.infer<typeof ZSearchArgs>;
export type CompressArgs = z.infer<typeof ZCompressArgs>;
export type SessionStartArgs = z.infer<typeof ZSessionStartArgs>;
export type SessionIdArgs = z.infer<typeof ZSessionIdArgs>;
export type RecallArgs = z.infer<typeof ZRecallArgs>;
export type ExpandArgs = z.infer<typeof ZExpandArgs>;
