#!/usr/bin/env node
/**
 * insight — CLI tool for AI Chat Insight
 *
 * Usage (from any folder containing .jsonl files):
 *   insight                    — interactive picker
 *   insight --skip-llm         — skip LLM analysis
 *   insight --provider=claude  — choose provider
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

// ─── Bootstrap: load .env from CWD first, then fall back to package root ────
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

// Try .env in CWD, fall back to package root .env
import dotenv from 'dotenv';
const cwdEnv = path.join(process.cwd(), '.env');
try {
  await fs.access(cwdEnv);
  dotenv.config({ path: cwdEnv });
} catch {
  dotenv.config({ path: path.join(packageRoot, '.env') });
}

// ─── Imports ─────────────────────────────────────────────────────────────────
import { select } from '@inquirer/prompts';
import cliProgress from 'cli-progress';
import open from 'open';
import { generateInsights } from '../src/index.js';
import { StaticInsightGenerator } from '../src/htmlGenerator.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

function formatSize(bytes) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function parseFlags() {
  const args = process.argv.slice(2);
  const skipLlm = args.includes('--skip-llm');
  const skipQualitative = args.includes('--skip-qualitative');
  const providerFlag = args.find((f) => f.startsWith('--provider='));
  const provider = providerFlag ? providerFlag.split('=')[1] : 'nvidia';
  return { skipLlm, skipQualitative, provider };
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║      AI Chat Insight  —  Session CLI     ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  printBanner();

  const cwd = process.cwd();
  const { skipLlm, skipQualitative, provider } = parseFlags();

  // 1. Scan CWD for .jsonl files
  let entries;
  try {
    entries = await fs.readdir(cwd, { withFileTypes: true });
  } catch (err) {
    console.error(`  ✖  Cannot read directory: ${cwd}`);
    process.exit(1);
  }

  const jsonlFiles = entries.filter(
    (e) => e.isFile() && e.name.endsWith('.jsonl'),
  );

  if (jsonlFiles.length === 0) {
    console.error('  ✖  No .jsonl session files found in the current directory.');
    console.error(`     Directory: ${cwd}`);
    console.error('     Add a .jsonl session file here and try again.\n');
    process.exit(1);
  }

  // Enrich with file sizes
  const fileInfos = await Promise.all(
    jsonlFiles.map(async (e) => {
      const stat = await fs.stat(path.join(cwd, e.name));
      return { name: e.name, size: stat.size };
    }),
  );

  // Sort by size desc so the biggest (usually the most useful) is first
  fileInfos.sort((a, b) => b.size - a.size);

  console.log(`  Found ${fileInfos.length} session file(s) in:\n  ${cwd}\n`);

  // 2. Let user pick ONE file
  let chosenFile;
  if (fileInfos.length === 1) {
    // Only one file — skip the prompt
    chosenFile = fileInfos[0].name;
    console.log(`  Auto-selected: ${chosenFile}  (${formatSize(fileInfos[0].size)})\n`);
  } else {
    chosenFile = await select({
      message: 'Select a session file to analyse:',
      choices: fileInfos.map((f) => ({
        name: `${f.name.padEnd(40)}  ${formatSize(f.size)}`,
        value: f.name,
        short: f.name,
      })),
    });
    console.log('');
  }

  const sourceFile = path.join(cwd, chosenFile);
  const sessionRoot = cwd;  // output/ lives right next to the .jsonl files

  // 3. Prepare output paths
  const timestamp = buildTimestamp();
  const outputJsonDir = path.join(sessionRoot, 'output');
  const outputJsonPath = path.join(outputJsonDir, `insight-${timestamp}.json`);
  await fs.mkdir(outputJsonDir, { recursive: true });

  // 4. Progress bar
  const bar = new cliProgress.SingleBar(
    {
      format: '  {bar} {percentage}%  {message}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: false,
    },
    cliProgress.Presets.shades_classic,
  );

  bar.start(100, 0, { message: 'Starting…' });

  const onProgress = ({ percent, message }) => {
    bar.update(percent, { message });
  };

  // 5. Run insight pipeline
  let insight;
  try {
    insight = await generateInsights(sourceFile, {
      skipLlm,
      skipQualitative,
      provider,
      onProgress,
    });
  } catch (err) {
    bar.stop();
    console.error('\n  ✖  Pipeline error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }

  // 6. Write insight JSON
  try {
    await fs.writeFile(outputJsonPath, JSON.stringify(insight, null, 2), 'utf-8');
  } catch (err) {
    bar.stop();
    console.error('\n  ✖  Failed to write JSON:', err.message);
    process.exit(1);
  }
  bar.update(92, { message: 'Generating HTML report…' });

  // 7. Generate HTML — output goes to sessionRoot/output/reports/
  const generator = new StaticInsightGenerator();
  let htmlPath;
  try {
    htmlPath = await generator.generateStaticInsight(
      outputJsonPath,
      (stage, pct) => {
        bar.update(92 + Math.round(pct * 0.08), { message: stage });
      },
      sessionRoot,   // ← custom outputRoot: writes to CWD/output/reports/
    );
  } catch (err) {
    bar.stop();
    console.error('\n  ✖  HTML generation error:', err.message);
    process.exit(1);
  }

  bar.update(100, { message: 'Done!' });
  bar.stop();

  // 8. Summary
  console.log('');
  console.log('  ─────────────────────────────────────────────');
  console.log(`  Sessions :  ${insight.metrics.totalSessions}`);
  console.log(`  Messages :  ${insight.metrics.totalMessages}`);
  console.log(`  Facets   :  ${insight.facets.length}`);
  console.log(`  Streak   :  ${insight.metrics.currentStreak} day(s)`);
  console.log('  ─────────────────────────────────────────────');
  console.log(`  JSON  →  ${outputJsonPath}`);
  console.log(`  HTML  →  ${htmlPath}`);
  console.log('');
  console.log('  Opening report in browser…');
  console.log('');

  // 9. Open in browser
  try {
    await open(htmlPath);
  } catch {
    console.log(`  Could not auto-open. Open manually:\n  ${htmlPath}\n`);
  }
}

main().catch((err) => {
  console.error('\n  ✖  Unexpected error:', err.message);
  process.exit(1);
});
