#!/usr/bin/env node
import { spawn } from "node:child_process"

const args = ["node_modules/vitest/vitest.mjs", "run", ...process.argv.slice(2)]

const env = { ...process.env }
for (const k of Object.keys(env)) if (k === "BUN" || k.startsWith("BUN_")) delete env[k]
if (env.NODE_OPTIONS && /bun/iu.test(env.NODE_OPTIONS)) delete env.NODE_OPTIONS

const p = spawn("node", args, { stdio: "inherit", env })
p.on("exit", (code) => process.exit(code ?? 1))
