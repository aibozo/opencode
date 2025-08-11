const AVG_CHARS_PER_TOKEN = 4;
export const HeuristicTokenizer = {
    estimateTokens(text) {
        const punct = (text.match(/[{}()\[\].,;:+\-*/=<>]/g) ?? []).length;
        const base = Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
        return base + Math.ceil(punct / 3);
    },
};
let _tok = null;
export async function createTokenizer() {
    if (_tok)
        return _tok;
    try {
        const name = "@dqbd/tiktoken";
        const imp = Function("m", "return import(m)");
        const m = await imp(name);
        const enc = m.encoding_for_model("gpt-4o");
        _tok = { estimateTokens(text) { try {
                return enc.encode(text).length;
            }
            catch {
                return HeuristicTokenizer.estimateTokens(text);
            } } };
        return _tok;
    }
    catch {
        _tok = HeuristicTokenizer;
        return _tok;
    }
}
