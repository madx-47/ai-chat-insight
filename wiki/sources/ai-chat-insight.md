---
title: AI Chat Insight — Project Source
date_ingested: 2026-04-10
source_file: raw/project-structure (inferred from codebase)
tags: [analytics, ai-chat, dashboard, cli, llm, jsonl, session-analysis]
---

## Summary

AI Chat Insight is a session analytics platform that analyzes AI coding chat session logs (JSONL format) and generates both quantitative metrics and qualitative insights. It produces self-contained HTML dashboard reports. The system has two interfaces: a CLI tool for batch processing and a web-based React dashboard for interactive analysis. The pipeline reads JSONL session data, computes metrics (streaks, heatmaps, tool usage), runs LLM-powered facet analysis on conversational sessions, aggregates results, and generates narrative insights.

## Key claims

- Supports 4 LLM providers: NVIDIA NIM (default), Anthropic Claude, OpenAI, and local Ollama
- Pipeline architecture: Read JSONL → Group Sessions → Compute Metrics → LLM Facet Analysis → Aggregate → Qualitative Insights → HTML Report
- Uses concurrency control (3 for facet analysis, 4 for qualitative insights)
- Follows GSD (Get Shit Done) methodology with SPEC → PLAN → EXECUTE → VERIFY → COMMIT workflow
- Frontend: React 19 + TypeScript + Vite + TailwindCSS + shadcn/ui with custom WebGL animated background
- Backend: Node.js ESM + Express.js with async job queue API
- No automated unit tests — only regression tests exist
- Technical debt includes: no persistence, no auth, no rate limiting, large component files

## Architecture

### Entry Points
- **CLI**: `bin/insight.js` — global command, interactive file picker, progress bar, auto-opens HTML report
- **Web**: `src/server.js` — Express server (port 4173), job queue API, serves built frontend

### Pipeline Stages (`src/index.js: generateInsights()`)
1. **Read JSONL** (`src/reader.js`) — Parse one JSON object per line, skip malformed lines
2. **Group by Session** (`src/reader.js: groupBySession()`) — Group records by `sessionId` into Map
3. **Compute Metrics** (`src/metrics.js`) — Pure functions: total sessions/messages/hours, activity heatmap, active hours, streaks, top tool usage, session durations
4. **Filter Conversational** (`src/reader.js: isConversationalSession()`) — Only sessions with both `user` and `assistant` records
5. **LLM Facet Analysis** (`src/providers/*.js`) — Extract structured SessionFacets per session (goal, categories, outcome, satisfaction, friction, etc.), concurrency=3
6. **Aggregate Facets** (`src/aggregator.js`) — Cross-session statistics: satisfaction, friction, success, outcomes, goals
7. **Qualitative Insights** (`src/qualitative/generator.js`) — 8 parallel LLM calls (concurrency=4): impressive workflows, project areas, future opportunities, friction points, memorable moment, improvements, interaction style, At a Glance summary

### Output
- `output/insight-<timestamp>.json` — Complete machine-readable insight data
- `output/reports/insight-<timestamp>.html` — Self-contained visual dashboard

## Data Schemas

### ChatRecord (one JSONL line)
`{uuid, parentUuid, sessionId, timestamp, type: 'user'|'assistant'|'system'|'tool_result', message, toolCallResult, ...}`

### SessionFacets (LLM output per session)
`{session_id, underlying_goal, goal_categories, outcome, user_satisfaction_counts, ai_helpfulness, session_type, friction_counts, friction_detail, primary_success, brief_summary}`

### MetricsData
`{totalSessions, totalMessages, totalHours, heatmap, activeHours, currentStreak, longestStreak, longestWorkDuration, longestWorkDate, topTools, ...}`

### AggregatedData
`{satisfactionAgg, frictionAgg, primarySuccessAgg, outcomesAgg, goalsAgg}`

## Key Files Reference

| File | Purpose |
|------|---------|
| `bin/insight.js` | Global CLI entry point |
| `src/index.js` | Core pipeline orchestrator |
| `src/reader.js` | JSONL parsing, session grouping |
| `src/metrics.js` | Pure computation functions |
| `src/aggregator.js` | Cross-session facet aggregation |
| `src/providers/base.js` | Base analyzer class |
| `src/providers/nvidia.js` | NVIDIA NIM adapter (SSE streaming) |
| `src/providers/claude.js` | Anthropic adapter (tool_use) |
| `src/providers/openai.js` | OpenAI adapter (tool_choice) |
| `src/providers/ollama.js` | Local Ollama adapter |
| `src/qualitative/generator.js` | 8-section qualitative insight generation |
| `src/qualitative/prompts.js` | Prompt templates |
| `src/qualitative/schemas.js` | JSON schemas for Claude tool_use |
| `src/qualitative/context.js` | Shared context block builder |
| `src/htmlGenerator.js` | Static HTML generation |
| `src/renderer.js` | Template rendering |
| `src/insight-template.js` | CSS/JS strings for HTML report |
| `src/server.js` | Express server with job queue API |
| `src/types.js` | JSDoc type definitions |
| `frontend/src/App.tsx` | Main dashboard component (634 lines) |
| `frontend/src/main.tsx` | React entry point |
| `frontend/src/components/ui/` | shadcn UI components |
| `PROJECT_RULES.md` | GSD canonical rules |
| `GSD-STYLE.md` | Style and conventions guide |
| `.gsd/ARCHITECTURE.md` | Auto-generated architecture map |

## Related
- [[entities/nodejs]]
- [[entities/react]]
- [[entities/express]]
- [[entities/vite]]
- [[entities/tailwindcss]]
- [[entities/shadcn-ui]]
- [[entities/llm-providers]]
- [[topics/session-analytics]]
- [[topics/pipeline-architecture]]
- [[topics/gsd-methodology]]
- [[topics/llm-integration]]
- [[topics/technical-debt]]
