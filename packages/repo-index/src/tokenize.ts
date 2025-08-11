// Tokenization utilities with optional tiktoken support.
export interface Tokenizer { estimateTokens(text: string): number }

const AVG_CHARS_PER_TOKEN = 4

export const HeuristicTokenizer: Tokenizer = {
  estimateTokens(text: string) {
    const punct = (text.match(/[{}()\[\].,;:+\-*/=<>]/g) ?? []).length
    const base = Math.ceil(text.length / AVG_CHARS_PER_TOKEN)
    return base + Math.ceil(punct / 3)
  },
}

let _tok: Tokenizer | null = null

export async function createTokenizer(): Promise<Tokenizer> {
  if (_tok) return _tok
  try {
    const name = "@dqbd/tiktoken"
    const imp: any = (Function("m", "return import(m)") as any)
    const m: any = await imp(name)
    const enc = m.encoding_for_model("gpt-4o")
    _tok = { estimateTokens(text: string) { try { return enc.encode(text).length } catch { return HeuristicTokenizer.estimateTokens(text) } } }
    return _tok
  } catch {
    _tok = HeuristicTokenizer
    return _tok
  }
}
