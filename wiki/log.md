# Ingest/Query/Lint Log

## Legend
This file is append-only. Each operation appends a new entry below.
Never edit existing entries — only add new ones.

## [2026-04-10] ingest | AI Chat Insight Project Source
- Source: raw/project-structure (inferred from codebase analysis)
- Pages touched: wiki/index.md, wiki/sources/ai-chat-insight.md, wiki/entities/nodejs.md, wiki/entities/react.md, wiki/entities/express.md, wiki/entities/vite.md, wiki/entities/tailwindcss.md, wiki/entities/shadcn-ui.md, wiki/entities/llm-providers.md, wiki/topics/session-analytics.md, wiki/topics/pipeline-architecture.md, wiki/topics/gsd-methodology.md, wiki/topics/llm-integration.md, wiki/topics/technical-debt.md
- Key claims:
  - Pipeline architecture: JSONL → Reader → Metrics → LLM Facets → Aggregator → Qualitative Insights → HTML Report
  - 4 LLM providers supported (NVIDIA NIM default, Claude, OpenAI, Ollama) via factory pattern
  - GSD methodology enforced: SPEC → PLAN → EXECUTE → VERIFY → COMMIT
  - Technical debt: no unit tests, no auth, no persistence, mixed JS/TS, large files

## [2026-04-10] ingest | src/ Core Source Code — Full File-by-File Analysis
- Source: raw/src-directory (full codebase read: 12 files across 3 directories)
- Pages touched: wiki/sources/src-core-code.md, wiki/index.md
- Key claims:
  - Pipeline orchestrator (`index.js`): `generateInsights()` with 8-stage progress callbacks (8%→100%), auto-selects recent JSONL, timestamped outputs
  - Reader (`reader.js`): 3 pure functions, 63 lines — JSONL parsing, session grouping, conversational filtering
  - Metrics (`metrics.js`): pure computation — streaks (current/longest), heatmap, activeHours, topTools (top 10), duration tracking
  - Server (`server.js`): Express API with in-memory job queue, 25MB upload limit, monotonic progress tracking, SPA fallback routing
  - Qualitative generator (`qualitative/generator.js`): 8 parallel LLM calls with concurrency=4, Claude uses tool_use, others use JSON-via-prompt
  - Provider base (`providers/base.js`): shared prompt builders, JSON parser (strips <think>/code fences), session transcript formatter, concurrency-controlled batch analysis
  - Renderer (`renderer.js`): normalizes nested data, remaps snake_case→camelCase, embeds React+CSS+JS into self-contained HTML with CDN dependencies
