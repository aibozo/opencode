import { readFileSync } from "node:fs"
import crypto from "node:crypto"
import type { ContextPack } from "@opencode/shared/src/types"

export function stablePrefixBlock(): { text: string; sha256: string } {
  const a = readFileSync("AGENTS.md", "utf8")
  const b = readFileSync("docs/dev-standards.md", "utf8")
  const t = [
    "## Stable Project Rules",
    a.trim(),
    "",
    "## Coding Standards",
    b.trim(),
  ].join("\n")
  const h = crypto.createHash("sha256").update(t).digest("hex")
  return { text: t, sha256: h }
}

export function renderContextPack(pack: ContextPack): string {
  const out: string[] = []
  out.push("## FULL")
  for (const f of pack.full) {
    if (f.ranges && f.ranges.length) {
      for (const r of f.ranges) out.push(`- ${f.path} [L${r[0]}-${r[1]}]`)
    } else out.push(`- ${f.path} [FULL]`)
  }
  out.push("", "## SKELETON")
  for (const s of pack.skeletons) out.push(`- ${s.path} (elided; sha1=${((s.hash ?? "").slice(0, 7))}…)`)
  if (pack.interfaces && pack.interfaces.length) {
    out.push("", "## INTERFACES")
    for (const i of pack.interfaces) out.push(`- ${i.path}`)
  }
  if ((pack as any).search_hits && (pack as any).search_hits.length) {
    out.push("", "## SEARCH HITS (top)")
    for (const h of (pack as any).search_hits.slice(0, 10)) out.push(`- ${h.path}:${h.line} ${h.text}`)
  }
  return out.join("\n")
}

export function assemblePrompt(pack: ContextPack, notes: string, plan: string): string {
  const p = stablePrefixBlock().text
  const c = renderContextPack(pack)
  return [
    p,
    "",
    "# Task",
    "(see conversation above for full task; restated briefly here by the agent)",
    "",
    "# Plan",
    plan.trim(),
    "",
    "# Working Set (token-capped)",
    c,
    "",
    "# Notes (verbatim)",
    notes.trim(),
  ].join("\n")
}

