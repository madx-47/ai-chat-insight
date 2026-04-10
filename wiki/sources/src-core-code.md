---
title: AI Chat Insight — src/ Core Source Code
date_ingested: 2026-04-10
source_file: raw/src-directory (full codebase read)
tags: [src, pipeline, reader, metrics, aggregator, types, server, html-generation, rendering]
---

## Summary

Deep dive into every file in `src/` — the core code and logic of AI Chat Insight. The source tree contains 12 files across 3 directories (`providers/`, `qualitative/`, and root-level modules). The pipeline is orchestrated by `index.js` which exports two main functions: `generateInsights()` (the full analysis pipeline) and `generateStaticHtml()` (HTML report generation from existing JSON). The web server (`server.js`) provides an Express API with async job queue, file upload, and progress tracking.

## Key claims

### Pipeline orchestrator (`index.js`)
- `generateInsights(sourceFile, options)` — core pipeline with progress callbacks
  - Options: `skipLlm`, `skipQualitative`, `provider`, `providerOptions`, `onProgress`
  - Emits progress events: `{step, percent, message}` at each stage
  - Steps: read(8%) → group(16%) → metrics(28%) → filter(40%) → llm_facets(52-70%) → aggregate(70%) → qualitative(82-88%) → done(100%)
  - Returns `InsightData` object
- `generateStaticHtml(insightJsonPath, onProgress)` — HTML report from existing JSON
- `main()` — CLI standalone mode: resolves input/output files, runs pipeline, generates both JSON and HTML
- Auto-selects most recent `.jsonl` from `sessions/` directory if no input specified
- Auto-generates timestamped output filenames: `insight-YYYYMMDD-HHMMSS.json`

### Reader (`reader.js`) — 63 lines, 3 pure functions
- `readJsonlFile(filePath)` — reads file, splits by newline, parses JSON, skips blank/malformed lines with warning
- `groupBySession(records)` — groups ChatRecord[] into Map<sessionId, records[]>
- `isConversationalSession(records)` — returns true only if both `user` AND `assistant` records exist

### Metrics (`metrics.js`) — Pure computation, no LLM
- `generateMetrics(sessionMap)` — main entry point, returns `{metrics, sessions}`
- `buildSessionMeta(sessionId, records)` — per-session: duration, message count, tool calls
- `calculateStreaks(dates)` — deduplicates, sorts dates, computes current and longest streaks
  - Current streak is active only if last active day was today or yesterday
- `collectToolNames(parts)` — extracts tool names from `functionCall.name` in message parts
- Metrics computed: totalSessions, totalMessages, totalHours, heatmap (date→count), activeHours (hour→count), streaks, longestWorkDuration/Date, topTools (top 10 by count)
- `totalLinesAdded`, `totalLinesRemoved`, `totalFiles` hardcoded to 0 (extendable via tool result diff data)

### Aggregator (`aggregator.js`) — 40 lines, pure function
- `aggregateFacets(facets)` — rolls up SessionFacets[] into AggregatedData
- Uses `addCounts()` for count aggregation (satisfaction, friction, goals)
- Uses `increment()` for single-value counts (outcomes, primary success)
- Returns: `satisfactionAgg`, `frictionAgg`, `primarySuccessAgg`, `outcomesAgg`, `goalsAgg`

### Types (`types.js`) — JSDoc typedefs + JSON schema
- Defines: `ChatRecord`, `SessionMeta`, `SessionFacets`, `AggregatedData`, `MetricsData`, `InsightData`
- Exports enum arrays: `OUTCOME_VALUES`, `AI_HELPFULNESS_VALUES`, `SESSION_TYPE_VALUES`, `PRIMARY_SUCCESS_VALUES`
- Exports `SESSION_FACETS_SCHEMA` — full JSON Schema for LLM structured output validation
- No runtime type enforcement (JavaScript) — serves as documentation and schema reference

### Server (`server.js`) — Express API with job queue
- Port: 4173 (or `PORT` env var)
- Routes:
  - `POST /api/jobs` — accepts multipart/form-data (file upload) or JSON body with `jsonlText`
  - `GET /api/jobs/:jobId` — returns job status, progress, summary
  - `GET /api/jobs/:jobId/report` — returns full insight JSON + paths
  - `GET /api/health` — health check
  - `GET /*` (non-API) — serves `frontend/dist/index.html` (SPA fallback)
- Job queue: in-memory `Map`, no persistence
- Job lifecycle: queued → running → done/failed
- Progress tracking: monotonic percent (never decreases)
- File upload: 25MB limit via multer, writes to `sessions/`
- Validates frontend build exists on startup, exits if missing
- Serves from both `frontend/dist/` and `web/` (legacy)

### HTML Generator (`htmlGenerator.js`)
- `StaticInsightGenerator` class
- `generateStaticInsight(insightJsonPath, onProgress, outputRoot)` — reads JSON, renders HTML, writes file
- Output: `output/reports/<original-name>.html`
- Uses `TemplateRenderer` for HTML generation

### Renderer (`renderer.js`)
- `TemplateRenderer` class
- `normalizeInsightData(data)` — flattens nested metrics/aggregated, remaps snake_case qualitative keys to camelCase
  - `impressive_workflows` → `impressiveWorkflows`
  - `project_areas` → `projectAreas`
  - `future_opportunities` → `futureOpportunities`
  - `friction_points` → `frictionPoints`
  - `memorable_moment` → `memorableMoment`
  - `improvements` → `improvements`
  - `interaction_style` → `interactionStyle`
  - `at_a_glance` → `atAGlance`
- `renderInsightHTML(insightData)` — produces self-contained HTML with:
  - Embedded CSS from `insight-template.js`
  - Embedded JS (React.createElement, no JSX) from `insight-template.js`
  - `window.INSIGHT_DATA` global with normalized data
  - React 18 + ReactDOM loaded from unpkg CDN
  - html2canvas from jsdelivr CDN for export

## Architecture Diagram

```
src/
├── reader.js          (3 functions: read, group, filter)
├── metrics.js         (pure computation: streaks, heatmap, tools)
├── aggregator.js      (pure function: cross-session facet rollup)
├── types.js           (JSDoc typedefs + SESSION_FACETS_SCHEMA)
├── index.js           (pipeline orchestrator + CLI main)
├── server.js          (Express API + job queue)
├── htmlGenerator.js   (StaticInsightGenerator class)
├── renderer.js        (TemplateRenderer + data normalization)
├── insight-template.js (CSS + JS strings for HTML report)
├── analyzer.js        (legacy standalone Claude analyzer)
├── providers/
│   ├── index.js       (createAnalyzer factory)
│   ├── base.js        (BaseAnalyzer class + prompt builders + JSON parser)
│   ├── nvidia.js      (NVIDIA NIM: SSE streaming, axios)
│   ├── claude.js      (Anthropic: tool_use, SDK)
│   ├── openai.js      (OpenAI: function_call, lazy import)
│   └── ollama.js      (Local: REST API, JSON mode)
└── qualitative/
    ├── generator.js   (8-section parallel generation, concurrency=4)
    ├── prompts.js     (7 qualitative prompt templates)
    ├── schemas.js     (8 JSON schemas for Claude tool_use)
    └── context.js     (prepareCommonData: shared context builder)
```

## Related
- [[sources/ai-chat-insight]]
- [[topics/pipeline-architecture]]
- [[topics/llm-integration]]
- [[entities/express]]
- [[entities/llm-providers]]
