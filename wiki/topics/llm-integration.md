---
title: LLM Integration
sources: 1
---

## Overview
The project integrates with 4 LLM providers through a factory pattern with base class inheritance. Each provider adapter handles API-specific authentication, streaming, and response parsing while sharing common prompt construction logic.

### Provider Details
| Provider | Model | Protocol | Structured Output Method |
|----------|-------|----------|-------------------------|
| NVIDIA NIM | qwen/qwen3.5-122b-a10b | SSE streaming | Prompt engineering |
| Anthropic Claude | claude-sonnet-4-5 | REST API | Forced `tool_use` with JSON schema |
| OpenAI | gpt-4o-mini | REST API | Forced `tool_choice` |
| Ollama | qwen3.5:0.8b | Local REST | Built-in JSON mode |

### Analysis Types
1. **Facet Analysis** (per session): Extract structured SessionFacets — goal, categories, outcome, satisfaction, friction, summary. Concurrency: 3 sessions simultaneously.
2. **Qualitative Insights** (cross-session): 8 parallel LLM calls generating narrative sections — impressive workflows, project areas, opportunities, friction, memorable moment, improvements, interaction style, At a Glance. Concurrency: 4 calls.

### Prompt Architecture
- Prompts defined in `qualitative/prompts.js` as templates
- Context built in `qualitative/context.js` from metrics + facets
- JSON schemas in `qualitative/schemas.js` for Claude tool_use validation
- Base class handles JSON parsing and retry logic for malformed responses

## Key tensions / open questions
- How to handle LLM provider rate limits and API quotas?
- Should structured output be enforced at the schema level for all providers (not just Claude)?
- Cost optimization: local Ollama model (0.8b) may produce lower quality — is the tradeoff acceptable?
- Prompt versioning: how to track and iterate on prompt changes over time?
- Fallback strategy: what happens when the default provider is unavailable?

## Sources
- [[sources/ai-chat-insight]]
