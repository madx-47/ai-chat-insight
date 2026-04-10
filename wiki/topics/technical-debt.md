---
title: Technical Debt
sources: 1
---

## Overview
Identified technical debt from `.gsd/ARCHITECTURE.md` and codebase analysis:

### Testing
- [ ] No automated unit tests for core pipeline (only regression tests in `test/`)
- [ ] No unit test framework detected
- [ ] No test coverage tracking
- [ ] Empty `test/` and `web/` directories

### Infrastructure
- [ ] In-memory job queue only — no persistence, lost on server restart
- [ ] No error recovery in job processing
- [ ] No logging/monitoring infrastructure
- [ ] No rate limiting on web API endpoints

### Security
- [ ] No authentication/authorization on web endpoints
- [ ] No input validation/sanitization for uploaded JSONL files

### Code Quality
- [ ] Mixed JS/TS — backend is plain JavaScript, frontend is TypeScript
- [ ] No TypeScript types for core pipeline
- [ ] Large files: `App.tsx` at 634 lines should be split
- [ ] `src/analyzer.js` appears to be legacy code (duplicates provider system logic)
- [ ] Hardcoded file paths in `src/index.js` main()
- [ ] Hard-coded API endpoints with no configuration override

### Architecture
- [ ] No configuration management (environment variables, config files)
- [ ] Tight coupling between pipeline stages

## Key tensions / open questions
- Should TypeScript be adopted for the entire backend for type safety?
- Is persistence for the job queue necessary or is CLI the primary use case?
- Should authentication be added before or after core feature development?
- How to prioritize debt resolution vs new feature development?

## Sources
- [[sources/ai-chat-insight]]
