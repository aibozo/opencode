import chokidar from "chokidar";
export function startWatcher(root, onChange) {
    const watcher = chokidar.watch(["**/*.{py,ts,tsx,js,jsx}"], {
        cwd: root,
        ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
        ignoreInitial: true,
    });
    let timer = undefined;
    const bump = () => {
        if (timer)
            clearTimeout(timer);
        timer = setTimeout(() => { onChange().catch(() => { }); }, 100);
    };
    watcher.on("add", bump).on("change", bump).on("unlink", bump);
    return watcher;
}
