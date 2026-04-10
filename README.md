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
A CLI tool for analyzing and visualizing AI chat session data. It extracts qualitative and quantitative insights from conversational session logs (`.jsonl`), scoring interactions, topics, and overall user goals to generate a beautiful, self-contained HTML report.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd ai-chat-insight
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or in the directory where you'll run the command) and add your AI provider API key. For the default provider (NVIDIA NIM in this example), add:
   ```env
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```
   *(If you use Claude, add `ANTHROPIC_API_KEY=...` and run with `--provider=claude`, etc.)*

4. **Register the Global CLI Tool:**
   To run the `insight` command from any directory on your computer, create a global symlink using NPM:
   ```bash
   npm link
   ```

## Usage

Once linked, the `insight` tool is available globally as an interactive CLI.

### 1. Basic Interactive Mode

Navigate to any directory containing your session logs (`.jsonl` files) and run the command:

```bash
cd path/to/your/sessions/folder
insight
```

The tool will:
- Automatically find all `.jsonl` files in the current folder.
- Show an interactive checkbox menu so you can select a session file (or it will auto-select if there is only one file).
- Process the session data using the configured AI provider.
- Generate a detailed HTML report and save it in a new `./output/reports/` folder *inside the directory where you ran the command*.
- Automatically open the HTML report in your default web browser once finished.

### 2. Available Flags

You can customize the pipeline execution with the following command-line flags:

- **Skip LLM Analysis (`--skip-llm`):**
  Generate basic statistics and group sessions without invoking the AI LLM (saves time / API calls if you only care about metrics).
  ```bash
  insight --skip-llm
  ```

- **Choose Provider (`--provider=<name>`):**
  Explicitly state which AI provider to use. Make sure your `.env` contains the required key for that provider.
  ```bash
  insight --provider=claude
  ```

- **Skip Qualitative Info (`--skip-qualitative`):**
  Skips the generation of high-level qualitative summaries at the end of the pipeline.
  ```bash
  insight --skip-qualitative
  ```

## How It Works

- **`bin/insight.js`**: The main executable that presents the CLI menu, handles file pickup, coordinates progress reporting, and runs the downstream pipeline.
- **`src/index.js`**: Handles the core logic: loading source files, running analysis modules (via LLMs or heuristically), and orchestrating metrics aggregation.
- **`src/htmlGenerator.js`**: Takes the processed JSON insight data and populates a beautifully designed HTML report, allowing quick visualization of AI performance and user interaction metrics.

## Example Output

When processing is complete, the CLI will output a summary to your terminal:
```text
  ─────────────────────────────────────────────
  Sessions :  2
  Messages :  47
  Facets   :  15
  Streak   :  2 day(s)
  ─────────────────────────────────────────────
  JSON  →  D:\Projects\Insights\sessions\output\insight-20260406-202948.json
  HTML  →  D:\Projects\Insights\sessions\output\reports\insight-20260406-202948.html

  Opening report in browser…
```
