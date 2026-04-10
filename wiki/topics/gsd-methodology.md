---
title: GSD Methodology
sources: 1
---

## Overview
Get Shit Done (GSD) is the project's development methodology. Defined in `PROJECT_RULES.md` and `GSD-STYLE.md`.

### Core Protocol
**SPEC → PLAN → EXECUTE → VERIFY → COMMIT**
1. **SPEC**: Define requirements in `.gsd/SPEC.md` until status is `FINALIZED`
2. **PLAN**: Decompose into phases in `.gsd/ROADMAP.md`
3. **EXECUTE**: Implement with atomic commits per task
4. **VERIFY**: Prove completion with empirical evidence (never "trust me")
5. **COMMIT**: One task = one commit, verified before commit

### Key Principles
- **Planning Lock**: No implementation until SPEC.md is FINALIZED
- **Proof Requirements**: Every change requires captured evidence (curl output, screenshots, test results)
- **Search-First Discipline**: Search before reading files (grep/ripgrep → targeted reads)
- **Wave Execution**: Tasks grouped by dependencies, run in parallel within waves
- **State Snapshots**: End-of-wave summaries in STATE.md for context continuity
- **Model Independence**: No hard dependencies on specific LLM providers
- **Context Hygiene**: Plans under 50% context, fresh context per wave, state dump after 3 failures

### Commit Convention
Format: `type(scope): description`
Types: feat, fix, docs, refactor, test, chore

### Anti-Patterns (Banned)
- Stakeholder communication, sprint ceremonies, multiple approval levels
- Temporal language in implementation docs ("First, we'll...")
- Generic XML tags (use semantic: `<task>`, `<action>`, `<verify>`)
- Vague tasks (must be specific and actionable)

## Key tensions / open questions
- Is the full GSD protocol overhead justified for solo dev projects?
- How to enforce SPEC → PLAN discipline without tooling support?
- Should context management rules be automated?

## Sources
- [[sources/ai-chat-insight]]
