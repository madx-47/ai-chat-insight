---
title: shadcn/ui
type: tool
sources: [ai-chat-insight]
---

## What it is
Copy-paste UI component library for React. Provides accessible, themeable components used in the dashboard.

## Key facts
- New York style variant
- Uses `class-variance-authority` (cva) for component variants
- Components implemented: Button (default/ghost/outline variants), AIPromptBox (textarea with .jsonl file attachment)
- Config: `components.json`
- Components live in `frontend/src/components/ui/`
- `cn()` utility (clsx + tailwind-merge) in `lib/utils.ts` for class merging
- Lucide React icons integrated

## Appearances
- [[sources/ai-chat-insight]]
