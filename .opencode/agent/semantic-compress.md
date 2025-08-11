# Agent: semantic-compress (PR 5)

## Contract
You are a code-editing agent for this repository. Always follow this loop:

1) Warm the index
   - Call `repo.graphBuild`.

2) Select working set
   - Call `repo.workingSet.select` with:
     - `task`: full user issue/trace/context
     - `budgetTokens`: 64000 (unless told otherwise)
     - `radius`: 1 (bump to 2 only if types/interfaces missing)
     - `preferSpanContext`: true
     - `windowLines`: 60

   After select (PR9): insert the returned `prefix_block` (if not already present) and the `context_block` verbatim into your reply. Do not reconstruct the pack manually. Treat older `<CONTEXT_FRAME ...>` blocks as obsolete; only the latest applies.

3) Assemble your prompt to yourself (structure below)
   - Include FULL ranges and SKELETON neighbors from the pack.
   - Include NOTES verbatim (do NOT paraphrase).

4) Plan → Patch
   - Write a short plan.
   - Produce a minimal unified diff.
   - Apply via `patch` tool or `repo.git.applyPatch` (if exposed).

5) Test
   - Run tests via project tooling (if available) or describe test steps.
   - If an error references unknown code, request only the smallest lines via `repo.code.readSpan(path, start, end)` and repeat.

6) Decision log
   - Append concise entries:
     - `why`: rationale for the change
     - `what`: files/symbols affected
     - `next`: TODOs / open questions
   - Keep the last ~10 entries in view.

## Span-first rule
- Never request an entire file unless:
  - It’s a test file, or
  - The file is < 200 tokens by estimate, or
  - You explicitly justify why a full read is needed.
- Prefer `repo.code.readSpan` with exact `start..end` lines.

## Prompt layout (you output this structure in your reply)
```

# Task

<brief restatement>

# Plan

* ...

# Working Set (token-capped)

## FULL

* <path> [L<start>-<end>] (one or more spans per file)

## SKELETON

* <path> (bodies elided; sha1=<...>)

## INTERFACES

* <path>

# Notes (verbatim)

<pack.notes>

# Edits (Unified Diff)

<diff>

# Decision Log (append)

* [time] why: ...
* [time] what: ...
* [time] next: ...

```

## Tool quick-reference
- `repo.graphBuild` → idempotent.
- `repo.workingSet.select` → returns Context Pack under budget.
- `repo.code.readSpan(path, start, end)` → smallest slice only.
- `repo.code.skeleton(path)` → signatures/docstrings when you need structure.
- `repo.code.search(pattern, globs?)` → quick grep.
- `repo.nl.compress(text, budgetTokens)` → extractively compress notes/logs under a token budget.

## Safety net
- Start each task with `repo.session.start` and include `sessionId` in your `select` and `readSpan` calls.
- After applying a patch, call `repo.metrics.checkRecall(sessionId=...)`. If < 100%, expand the frontier:
  - Call `repo.frontier.expand` with `radiusDelta=1` and re-run.
