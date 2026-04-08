# AI Chat Insight

Analyze AI coding chat session logs (`.jsonl`) and generate:
- structured session insights (`output/insight.json`)
- a shareable static HTML report (`output/reports/insight-*.html`)

This project reads raw chat records, computes usage metrics, uses an LLM to extract per-session facets, aggregates patterns, then builds qualitative insights and renders a dashboard-style report.

## What This Project Does

- Parses JSONL chat logs
- Groups records by `sessionId`
- Computes non-LLM metrics (sessions, activity heatmap, streaks, tool usage, etc.)
- Filters to conversational sessions (must include both `user` and `assistant`)
- Runs LLM analysis per session to extract structured facets
- Aggregates facets across all sessions
- Generates 8 qualitative sections with LLM calls
- Produces a static HTML report from the final `insight.json`

## How It Works (Pipeline)

Main entry: `src/index.js`

1. Read and parse JSONL
2. Group records by session
3. Compute metrics (`src/metrics.js`)
4. Filter conversational sessions (`src/reader.js`)
5. Analyze sessions with provider (`src/providers/*`)
6. Aggregate facets (`src/aggregator.js`)
7. Generate qualitative insights (`src/qualitative/generator.js`)
8. Write `output/insight.json` and render HTML (`src/htmlGenerator.js`)

## Tech Stack

- Node.js (ESM modules)
- LLM provider support:
  - NVIDIA NIM
  - Anthropic Claude
  - OpenAI
  - Ollama (local)

## Project Structure

```text
src/
  index.js                 # pipeline + CLI
  reader.js                # JSONL parser + session grouping/filtering
  metrics.js               # computed usage metrics
  aggregator.js            # aggregate per-session facets
  htmlGenerator.js         # static HTML report generator
  renderer.js              # HTML template renderer
  providers/               # LLM provider adapters
  qualitative/             # qualitative prompts + schemas + generator
test/
  run-regression.js        # regression checks
output/
  insight.json             # generated insight payload
  reports/                 # generated HTML reports
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

Use the key for the provider you want.

```env
NVIDIA_API_KEY=your_nvidia_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

Notes:
- NVIDIA provider is default.
- Ollama does not need a cloud API key, but requires local Ollama running.

## How To Run

### Current behavior in this repo

`src/index.js` currently has hardcoded file paths:
- source: `D:\Side Project\ai-chat-insight\web-session3.jsonl`
- output: `D:\Side Project\ai-chat-insight\output\insight.json`

If your clone path is different, update those two constants in `src/index.js` first.

### Run analysis

```bash
npm run analyze
```

### Useful flags

```bash
node src/index.js --skip-llm
node src/index.js --skip-qualitative
node src/index.js --provider=claude
node src/index.js --provider=openai
node src/index.js --provider=ollama
node src/index.js --html
```

## Run Tests

```bash
npm test
```

## Output Files

- `output/insight.json`  
  Complete machine-readable insight data (metrics, per-session facets, aggregates, qualitative sections)

- `output/reports/insight-YYYY-MM-DD*.html`  
  Self-contained visual report you can open in a browser

## Notes for GitHub Visitors

- Input format is JSONL, one JSON object per line.
- Session grouping depends on `sessionId`.
- Conversational analysis runs only on sessions containing both `user` and `assistant` records.
- Qualitative layer is skipped automatically if no facets are generated.
