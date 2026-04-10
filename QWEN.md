# QWEN.md — AI Chat Insight Project Context

## Project Overview

**AI Chat Insight** is a CLI tool and analysis pipeline for AI coding chat session logs (`.jsonl` format). It reads raw chat records, computes usage metrics, uses LLM APIs to extract structured per-session facets, aggregates patterns, generates qualitative insights, and renders a dashboard-style static HTML report.

### What It Does
- Parses JSONL chat logs and groups records by `sessionId`
- Computes non-LLM metrics (sessions, activity heatmap, streaks, tool usage, etc.)
- Filters to conversational sessions (must include both `user` and `assistant` messages)
- Runs LLM analysis per session to extract structured facets (topics, quality, tools used, etc.)
- Aggregates facets across all sessions to find patterns
- Generates 8 qualitative insight sections via additional LLM calls
- Produces a self-contained HTML report for visual review

### Architecture

```
bin/insight.js          → Interactive CLI entry point (global command after `npm link`)
src/index.js            → Core pipeline orchestrator (generateInsights, generateStaticHtml)
src/reader.js           → JSONL parsing, session grouping, conversational filtering
src/metrics.js          → Computed usage metrics
src/aggregator.js       → Aggregates per-session facets into cross-session patterns
src/htmlGenerator.js    → Static HTML report generator
src/renderer.js         → HTML template rendering
src/providers/          → LLM provider adapters (nvidia, claude, openai, ollama)
src/qualitative/        → Qualitative prompts, schemas, and insight generation

frontend/               → React + Vite + Tailwind SPA (separate web UI, if used)
```

### Tech Stack
- **Runtime:** Node.js (ESM modules)
- **Language:** JavaScript (backend), TypeScript (frontend)
- **Frontend:** React 19, Vite 5, Tailwind CSS 3, lucide-react icons
- **CLI:** `@inquirer/prompts`, `cli-progress`, `open`
- **Server:** Express, Multer (for file uploads)
- **LLM Providers:** NVIDIA NIM (default), Anthropic Claude, OpenAI, Ollama (local)

---

## Building and Running

### Install Dependencies
```bash
npm install
```

### Configure Environment
Create a `.env` file with API keys for the providers you intend to use:
```env
NVIDIA_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

### Register Global CLI
```bash
npm link
```
After linking, the `insight` command is available from any directory.

### Run Commands

| Command | Description |
|---------|-------------|
| `npm run analyze` | Run the analysis pipeline (`node src/index.js`) |
| `npm test` | Run regression tests (`node test/run-regression.js`) |
| `npm run web` | Start Express server (`node src/server.js`) |
| `npm run frontend:dev` | Start Vite dev server for the React frontend |
| `npm run frontend:build` | Build the React frontend |
| `insight` | Interactive CLI — picks `.jsonl` files from CWD |

### CLI Flags
```bash
insight --skip-llm              # Skip LLM facet analysis
insight --skip-qualitative      # Skip qualitative insight generation
insight --provider=claude       # Use Anthropic Claude instead of default NVIDIA
insight --provider=openai       # Use OpenAI
insight --provider=ollama       # Use local Ollama
insight --html                  # Render HTML from existing insight.json only
```

### Output Files
- `output/insight.json` — Machine-readable insight data
- `output/reports/insight-YYYY-MM-DD*.html` — Self-contained visual report

---

## Pipeline Stages

1. **Read** — Parse JSONL file into records
2. **Group** — Group records by `sessionId`
3. **Metrics** — Compute usage metrics (heatmap, streaks, tool counts)
4. **Filter** — Keep only conversational sessions (has both `user` + `assistant`)
5. **LLM Facets** — Analyze each session with chosen LLM provider
6. **Aggregate** — Combine per-session facets into cross-session patterns
7. **Qualitative** — Generate 8 high-level insight sections via LLM
8. **HTML** — Render static report from `insight.json`

---

## Development Conventions

### GSD Methodology
This project follows the **Get Shit Done (GSD)** methodology defined in `PROJECT_RULES.md` and `GSD-STYLE.md`:
- **SPEC → PLAN → EXECUTE → VERIFY → COMMIT**
- No implementation code until `SPEC.md` is `FINALIZED`
- Every change requires empirical proof (test output, screenshots, command results)
- One task = one atomic commit
- Search before reading files (token efficiency)

### Commit Conventions
```
type(scope): description
```
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Code Style
- ESM modules (`import`/`export`)
- JSDoc annotations on exported functions
- Node.js `fs/promises` for async file operations
- Provider adapters extend `BaseAnalyzer` from `src/providers/base.js`

### File Ignored
- `node_modules/`, `.env`, `output/`, `sessions/`, `dist/` (see `.gitignore`)

---

## Key Directories & Artifacts

| Path | Purpose |
|------|---------|
| `.agent/workflows/` | Slash command definitions (`/plan`, `/execute`, etc.) |
| `.agents/skills/` | Agent specialization skills |
| `.gsd/` | GSD state, specs, roadmaps, templates |
| `test/` | Regression test runner |
| `frontend/src/` | React SPA source (components, lib, App, main) |
| `output/` | Generated insights and reports (git-ignored) |
| `sessions/` | Input JSONL session files (git-ignored) |

---

## Provider Adapters

Supported LLM providers (via factory in `src/providers/index.js`):
- `nvidia` → `NvidiaAnalyzer` (default, uses `NVIDIA_API_KEY`)
- `claude` / `anthropic` → `ClaudeAnalyzer` (uses `ANTHROPIC_API_KEY`)
- `openai` / `gpt` → `OpenAIAnalyzer` (uses `OPENAI_API_KEY`)
- `ollama` / `local` → `OllamaAnalyzer` (local, no cloud key needed)

All providers implement the `BaseAnalyzer` interface with `analyzeAllSessions()`.

---

## Notes
- Input format is **JSONL** — one JSON object per line
- Session grouping requires a `sessionId` field on each record
- Qualitative generation is automatically skipped if no facets are produced
- The `src/index.js` entry point has hardcoded paths in some versions; update if cloning to a different location
