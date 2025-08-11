import chokidar from "chokidar";
export declare function startWatcher(root: string, onChange: () => Promise<void>): chokidar.FSWatcher;
