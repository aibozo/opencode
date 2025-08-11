#!/usr/bin/env node
import { spawn } from "node:child_process"
const p = spawn(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--pool=forks"], { stdio: "inherit" })
p.on("exit", (code) => process.exit(code ?? 1))
