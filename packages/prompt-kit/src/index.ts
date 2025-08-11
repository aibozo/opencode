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

export function renderContextFrame(opts: {
  pack: ContextPack
  notes: string
  recentEdits?: string
  frameId: string
  prefixSha256: string
}): { text: string; sha256: string } {
  const b: string[] = []
  b.push(`<CONTEXT_FRAME id=${opts.frameId} prefix_sha=${opts.prefixSha256}>`)
  b.push("# INSTRUCTIONS")
  b.push("- Use ONLY this frame for coding decisions.")
  b.push("- If you need code bodies, call repo.code.readSpan(path,start,end).")
  b.push("")
  b.push("# WORKING SET (token-capped)")
  b.push(renderContextPack(opts.pack))
  b.push("")
  b.push("# NOTES (extractive, verbatim)")
  b.push((opts.notes || "").trim())
  b.push("")
  b.push("# RECENT EDITS (last 20)")
  b.push(((opts.recentEdits || "(no recent edits)") as string).trim())
  b.push("")
  b.push("# GUARANTEES")
  b.push("- All edited lines must be within FULL spans or readSpan results.")
  b.push("</CONTEXT_FRAME>")
  const t = b.join("\n")
  const h = crypto.createHash("sha256").update(t).digest("hex")
  return { text: t, sha256: h }
}
