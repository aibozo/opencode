export declare function handleGraphBuild(params: {
    root?: string;
}): Promise<{
    ok: boolean;
    files: number;
    symbols: number;
    edges: number;
    updatedAt: number;
}>;
