declare module '@dqbd/tiktoken'
declare module '@opencode/nl-compress/src/index' {
  export interface CompressOpts { budgetTokens: number; keywords?: string[]; keepAtLeast?: number; lambda?: number }
  export function compress(text: string, opts: CompressOpts): Promise<string>
}

