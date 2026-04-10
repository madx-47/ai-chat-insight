---
title: LLM Providers
type: tool
sources: [ai-chat-insight]
---

## What it is
The multi-provider LLM integration layer that analyzes AI chat sessions. Uses factory pattern with base class inheritance.

## Key facts
- **NVIDIA NIM** (default): qwen/qwen3.5-122b-a10b via SSE streaming
- **Anthropic Claude**: claude-sonnet-4-5 via forced `tool_use` for structured JSON
- **OpenAI**: gpt-4o-mini via forced `tool_choice` for structured JSON
- **Ollama**: local qwen3.5:0.8b via REST API JSON mode
- Factory: `src/providers/index.js` — `createAnalyzer(providerName)`
- Base class: `src/providers/base.js` — prompt building, JSON parsing, session transcript formatting
- Concurrency: 3 simultaneous session analyses
- Provider selection via `--provider=` CLI flag
- Model independence principle: no hard dependencies on specific providers (PROJECT_RULES.md)

## Appearances
- [[sources/ai-chat-insight]]
