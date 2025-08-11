let CURRENT_INDEX = { files: [], symbols: [], edges: [], updatedAt: Date.now() };
export async function buildIndex(root) {
    CURRENT_INDEX = { files: [], symbols: [], edges: [], updatedAt: Date.now() };
    return CURRENT_INDEX;
}
export async function updateIndex(_changedPaths) {
    CURRENT_INDEX.updatedAt = Date.now();
    return CURRENT_INDEX;
}
export function getIndex() {
    return CURRENT_INDEX;
}
