---
title: Node.js
type: tool
sources: [ai-chat-insight]
---

## What it is
Runtime environment for executing JavaScript server-side. The backend of AI Chat Insight is built entirely on Node.js using ES Modules (`"type": "module"` in package.json).

## Key facts
- Uses ES Modules (not CommonJS)
- Backend pipeline runs as pure JavaScript (no TypeScript on backend)
- Express.js web framework runs on Node.js (port 4173)
- CLI tool (`bin/insight.js`) executes via Node.js shebang
- Global CLI registration via `"bin"` field in package.json

## Appearances
- [[sources/ai-chat-insight]]
