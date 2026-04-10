---
title: Session Analytics
sources: 1
---

## Overview
The core domain of AI Chat Insight — analyzing AI coding chat sessions to extract quantitative metrics and qualitative insights. Sessions are represented as JSONL files where each line is a ChatRecord with `sessionId`, `timestamp`, `type` (user/assistant/system/tool_result), and `message`.

The system computes: session counts, message counts, active hours, activity heatmaps (date-based), work streaks (current/longest), longest work duration, top tool usage, session durations. LLM analysis extracts: underlying goals, goal categories, outcomes, satisfaction signals, AI helpfulness, session types, friction points, primary successes.

## Key tensions / open questions
- How to handle malformed JSONL lines gracefully beyond simple skipping?
- Should non-conversational sessions (tool-only) receive any LLM analysis?
- How to detect and merge duplicate sessions?
- What's the minimum session length for meaningful LLM analysis?

## Sources
- [[sources/ai-chat-insight]]
