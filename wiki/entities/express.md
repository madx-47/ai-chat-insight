---
title: Express
type: tool
sources: [ai-chat-insight]
---

## What it is
Minimal web framework for Node.js. Powers the AI Chat Insight web API and serves the built frontend.

## Key facts
- Runs on port 4173
- Provides job queue API: `POST /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/:id/report`
- Handles file uploads via multer
- Serves static frontend build
- No authentication on endpoints (technical debt)
- No rate limiting (technical debt)
- In-memory job queue only (lost on restart)

## Appearances
- [[sources/ai-chat-insight]]
