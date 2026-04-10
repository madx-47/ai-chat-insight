---
title: Pipeline Architecture
sources: 1
---

## Overview
The system follows a clean linear pipeline with pure function stages:

```
JSONL Input → Reader → Metrics → LLM Facet Analysis → Aggregation → Qualitative Insights → JSON + HTML Report
```

Each stage is a pure function or module with clear inputs/outputs:
1. **Reader** (`reader.js`): JSONL parsing → ChatRecord[], session grouping → Map<sessionId, records[]>, conversational filtering
2. **Metrics** (`metrics.js`): ChatRecord[] → MetricsData (streaks, heatmaps, tool usage)
3. **LLM Facet Analysis** (`providers/*.js`): Each conversational session → SessionFacets (concurrency=3)
4. **Aggregator** (`aggregator.js`): SessionFacets[] → AggregatedData (cross-session statistics)
5. **Qualitative Generator** (`qualitative/generator.js`): MetricsData + AggregatedData → 8 insight sections (concurrency=4)
6. **Output** (`htmlGenerator.js`, `renderer.js`): Insight JSON → self-contained HTML dashboard

Progress callbacks flow through the pipeline for CLI progress bar display.

## Key tensions / open questions
- Should pipeline stages be more decoupled (event-driven vs direct calls)?
- Error recovery: current approach is process exit on fatal errors — is retry logic needed?
- How to add new pipeline stages without modifying `generateInsights()`?
- Should metrics and facets be computed in parallel or is sequential dependency required?

## Sources
- [[sources/ai-chat-insight]]
