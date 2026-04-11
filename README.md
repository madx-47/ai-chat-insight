# AI Chat Insight

AI Chat Insight analyzes AI chat session logs (`.jsonl`) and produces:

- structured JSON insights
- a shareable static HTML report
- dashboard-ready data for a web experience

This repository has three ways to use the project:

1. Core Node pipeline (main logic in `src/`)
2. CLI app (interactive local workflow)
3. Web app (upload + async analysis workflow)

## What This Project Solves

When you have many chat sessions, it is hard to quickly understand:

- how users interact over time
- where friction appears
- what goals users are trying to achieve
- what outcomes were reached

AI Chat Insight turns raw session logs into metrics + qualitative insights so teams can review behavior at scale.

## Architecture At A Glance

The architecture is pipeline-driven.

1. Read JSONL
2. Group by session
3. Compute metrics
4. Keep only conversational sessions (user + assistant)
5. Run LLM facet analysis per session
6. Aggregate facets across sessions
7. Generate qualitative insights
8. Write JSON and render HTML report

Primary implementation lives in:

- `src/index.js` (pipeline orchestrator)
- `src/reader.js` (JSONL parsing + session grouping)
- `src/metrics.js` (quantitative analytics)
- `src/providers/` (LLM provider adapters)
- `src/aggregator.js` (cross-session facet aggregation)
- `src/qualitative/` (narrative insight generation)
- `src/htmlGenerator.js` (static report generation)

For deeper architecture notes, see `.gsd/ARCHITECTURE.md`.

## Project Structure

```text
bin/
  insight.js                # Interactive CLI entry point
frontend/
  src/                      # React dashboard source
  vite.config.ts            # Frontend build config
src/
  index.js                  # Main Node pipeline (core logic)
  server.js                 # Express API for web mode
  reader.js
  metrics.js
  aggregator.js
  htmlGenerator.js
  providers/
  qualitative/
sessions/                   # Input .jsonl files (default for core mode)
output/                     # Generated JSON + HTML reports
test/
  run-regression.js
```

## Requirements

- Node.js 18+
- npm
- One LLM provider configured (or run with `--skip-llm`)

## Install

```bash
npm install
```

## Environment Variables

Create a `.env` file in project root.

Use the provider you want:

```env
NVIDIA_API_KEY=your_nvidia_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

Notes:

- Default provider is `nvidia`.
- `ollama` can be used for local inference (no cloud key, but local Ollama runtime is required).

## Input Format

Input is JSONL (one JSON object per line).

Session-level analysis depends on records being groupable by `sessionId`.

## Main Version: Core Node Pipeline (`src/`)

This is the main implementation of the project.

### Run Full Analysis

```bash
npm run analyze
```

Behavior:

- auto-picks the newest `.jsonl` file from `sessions/` if you do not pass a path
- generates JSON output in `output/insight-<timestamp>.json`
- generates HTML report in `output/reports/insight-<timestamp>.html`

### Direct Run With Optional Paths

```bash
node src/index.js [input.jsonl] [output.json]
```

### Core Flags

```bash
node src/index.js --skip-llm
node src/index.js --skip-qualitative
node src/index.js --provider=nvidia
node src/index.js --provider=claude
node src/index.js --provider=openai
node src/index.js --provider=ollama
node src/index.js --html
```

`--html` mode renders HTML from existing insight JSON (latest in `output/` if not specified).

## CLI Version (Reference + Usage)

CLI entry point: `bin/insight.js`

This version is ideal when you want an interactive local flow.

How it works:

1. Run from any folder containing `.jsonl` files
2. CLI scans current directory for `.jsonl`
3. If multiple files exist, it shows an interactive picker
4. Runs analysis pipeline
5. Writes output inside that same directory under `output/`
6. Opens generated HTML report in browser

### Use CLI

1. Link command globally once:

```bash
npm link
```

2. In your sessions folder:

```bash
insight
```

3. Optional CLI flags:

```bash
insight --skip-llm
insight --skip-qualitative
insight --provider=claude
```

## Web Version (Reference + Usage)

Backend entry point: `src/server.js`

Frontend source: `frontend/`

This version is ideal for browser-based upload and job tracking.

How it works:

1. User uploads JSONL (or submits raw JSONL text)
2. Server creates async job
3. Pipeline runs in background with progress updates
4. Output JSON + HTML report are stored in `output/`
5. Client polls job status and fetches final report payload

### Use Web Mode

1. Build frontend assets:

```bash
npm run frontend:build
```

2. Start server:

```bash
npm run web
```

3. Open:

```text
http://localhost:4173
```

Set a custom port with:

```bash
PORT=5000 npm run web
```

On Windows PowerShell:

```powershell
$env:PORT=5000; npm run web
```

## API Summary (Web)

- `POST /api/jobs` create analysis job (multipart upload or JSONL text)
- `GET /api/jobs/:jobId` get job status + progress
- `GET /api/jobs/:jobId/report` fetch final insight payload after completion
- `GET /api/health` health check

## Output Files

- `output/insight-<timestamp>.json`
- `output/reports/insight-<timestamp>.html`

## Testing

Run regression tests:

```bash
npm test
```

## Troubleshooting

### No `.jsonl` found

- Core mode expects files in `sessions/` unless input path is passed.
- CLI mode expects files in your current working directory.

### Provider errors

- Check `.env` key for selected provider.
- Try `--provider=<name>` explicitly.

### Web server says frontend build is missing

Run:

```bash
npm run frontend:build
```

## Notes

- The Node pipeline in `src/` is the source of truth for business logic.
- CLI and Web are interfaces around the same core pipeline.
- Generated reports are static HTML files and can be shared directly.
