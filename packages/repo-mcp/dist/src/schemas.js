import { z } from "zod";
export const ZSelectArgs = z.object({
    task: z.string().min(1),
    budgetTokens: z.number().int().positive().optional(),
    radius: z.union([z.literal(1), z.literal(2)]).optional(),
    preferSpanContext: z.boolean().optional(),
    windowLines: z.number().int().positive().max(2000).optional(),
});
export const ZReadSpanArgs = z.object({
    path: z.string().min(1),
    start: z.number().int().positive(),
    end: z.number().int().positive(),
});
export const ZSkeletonArgs = z.object({ path: z.string().min(1) });
export const ZSearchArgs = z.object({
    pattern: z.string().min(1),
    globs: z.array(z.string()).optional(),
    maxHits: z.number().int().positive().max(500).optional(),
    caseSensitive: z.boolean().optional(),
});
export const ZCompressArgs = z.object({
    text: z.string().min(1),
    budgetTokens: z.number().int().positive(),
    keywords: z.array(z.string()).optional(),
});
export const ZSessionStartArgs = z.object({ label: z.string().optional() });
export const ZSessionIdArgs = z.object({ sessionId: z.string().uuid() });
export const ZRecallArgs = z.object({
    sessionId: z.string().uuid(),
    baseRef: z.string().optional(),
    headRef: z.string().optional(),
});
export const ZExpandArgs = z.object({
    task: z.string().min(1),
    sessionId: z.string().uuid(),
    radiusDelta: z.number().int().min(1).max(2).default(1),
    budgetTokens: z.number().int().positive().optional(),
});
