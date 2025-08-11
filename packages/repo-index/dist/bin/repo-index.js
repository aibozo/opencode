#!/usr/bin/env bun
import { buildIndex, getIndex } from "../src/index";
const root = process.argv[2] ?? process.cwd();
await buildIndex(root);
console.log(JSON.stringify({ ok: true, indexUpdatedAt: getIndex().updatedAt }));
