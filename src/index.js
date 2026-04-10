/**
 * AI Chat Insight System - Entry Point
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

import { readJsonlFile, groupBySession, isConversationalSession } from './reader.js';
import { generateMetrics } from './metrics.js';
import { createAnalyzer } from './providers/index.js';
import { aggregateFacets } from './aggregator.js';
import { generateQualitativeInsights } from './qualitative/generator.js';
import { StaticInsightGenerator } from './htmlGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * @typedef {{ step: string, percent: number, message: string }} PipelineProgress
 */

/**
 * Core pipeline function.
 * @param {string} sourceFile - path to .jsonl file
 * @param {{
 *  skipLlm?: boolean,
 *  skipQualitative?: boolean,
 *  provider?: string,
 *  providerOptions?: object,
 *  onProgress?: (event: PipelineProgress) => void,
 * }} options
 * @returns {Promise<object>} InsightData
 */
export async function generateInsights(sourceFile, options = {}) {
  const {
    skipLlm = false,
    skipQualitative = false,
    provider = 'nvidia',
    providerOptions = {},
    onProgress,
  } = options;

  const emitProgress = (step, percent, message) => {
    if (typeof onProgress === 'function') {
      onProgress({ step, percent, message });
    }
  };

  console.log(`\n[insight] Source: ${sourceFile}`);

  emitProgress('read', 8, 'Reading JSONL session data');
  console.log('[1/5] Reading session file...');
  const records = await readJsonlFile(sourceFile);
  console.log(`      -> ${records.length} records parsed`);

  emitProgress('group', 16, 'Grouping records by session');
  console.log('[2/5] Grouping by session...');
  const allSessionMap = groupBySession(records);
  console.log(`      -> ${allSessionMap.size} unique session(s) found`);

  emitProgress('metrics', 28, 'Computing metrics');
  console.log('[3/5] Computing metrics...');
  const { metrics, sessions } = generateMetrics(allSessionMap);
  console.log(`      -> ${metrics.totalMessages} user messages across ${metrics.totalSessions} session(s)`);
  console.log(`      -> Active days: ${Object.keys(metrics.heatmap).join(', ') || 'none'}`);
  console.log(`      -> Streak: current=${metrics.currentStreak} longest=${metrics.longestStreak}`);

  emitProgress('filter', 40, 'Filtering conversational sessions');
  console.log('[4/5] Filtering conversational sessions...');
  const conversationalMap = new Map(
    [...allSessionMap.entries()].filter(([, recs]) => isConversationalSession(recs)),
  );
  console.log(`      -> ${conversationalMap.size} conversational session(s) eligible for analysis`);

  let facets = [];
  let analyzer = null;
  if (skipLlm) {
    emitProgress('llm_facets', 52, 'Skipping LLM facet analysis');
    console.log('[5/5] Skipping LLM analysis (--skip-llm flag set)');
  } else if (conversationalMap.size > 0) {
    emitProgress('llm_facets', 52, `Analyzing ${conversationalMap.size} session(s) with ${provider}`);
    console.log(`[5/5] Analyzing sessions with provider: ${provider}...`);
    analyzer = createAnalyzer(provider, providerOptions);
    facets = await analyzer.analyzeAllSessions(conversationalMap, {
      concurrency: 3,
      onProgress: (done, total) => {
        const fraction = total > 0 ? done / total : 0;
        emitProgress('llm_facets', 52 + Math.round(fraction * 18), `Analyzed ${done}/${total} session(s)`);
        process.stdout.write(`\r      -> ${done}/${total} sessions analyzed`);
      },
    });
    console.log(`\n      -> ${facets.length} facet(s) generated`);
  } else {
    emitProgress('llm_facets', 60, 'No conversational sessions; skipping LLM facets');
    console.log('[5/5] No conversational sessions to analyze - skipping LLM step');
  }

  emitProgress('aggregate', 70, 'Aggregating facets');
  const aggregated = aggregateFacets(facets);

  let qualitative = null;
  if (skipLlm || skipQualitative) {
    emitProgress('qualitative', 82, 'Skipping qualitative insights');
    console.log('[7/8] Skipping qualitative insights');
  } else if (analyzer && facets.length > 0) {
    emitProgress('qualitative', 82, 'Generating qualitative insights');
    console.log('[7/8] Generating qualitative insights...');
    qualitative = await generateQualitativeInsights(analyzer, metrics, facets, {
      onProgress: (msg) => {
        emitProgress('qualitative', 88, msg);
        console.log(`      ${msg}`);
      },
    });
  } else {
    emitProgress('qualitative', 88, 'No facets; skipping qualitative insights');
    console.log('[7/8] No facets - skipping qualitative insights');
  }

  const insightData = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.resolve(sourceFile),
    metrics,
    sessions,
    facets,
    aggregated,
    qualitative,
  };

  emitProgress('done', 100, 'Insight data ready');
  return insightData;
}

/**
 * Reads an existing insight.json and generates a self-contained HTML report.
 * @param {string} [insightJsonPath]
 * @param {Function} [onProgress]
 * @returns {Promise<string>}
 */
export async function generateStaticHtml(insightJsonPath, onProgress) {
  const generator = new StaticInsightGenerator();
  return generator.generateStaticInsight(insightJsonPath, onProgress);
}

async function resolveHtmlInputFile(argPath, outputDir) {
  if (argPath) return path.resolve(argPath);

  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isFile() && /^insight-\d{8}-\d{6}\.json$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();

  if (candidates.length > 0) return path.join(outputDir, candidates[0]);
  return path.join(outputDir, 'insight.json');
}

async function resolveSourceFile(argPath, sessionsDir) {
  if (argPath) return path.resolve(argPath);

  await fs.mkdir(sessionsDir, { recursive: true });
  const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
  const jsonlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
    .map((entry) => entry.name);

  if (jsonlFiles.length === 0) {
    throw new Error(`No .jsonl files found in ${sessionsDir}. Add session files or pass an explicit input path.`);
  }

  const stats = await Promise.all(
    jsonlFiles.map(async (name) => ({
      name,
      mtimeMs: (await fs.stat(path.join(sessionsDir, name))).mtimeMs,
    })),
  );

  stats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return path.join(sessionsDir, stats[0].name);
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
  const skipLlm = flags.includes('--skip-llm');
  const skipQualitative = flags.includes('--skip-qualitative');
  const htmlOnly = flags.includes('--html');
  const projectRoot = path.resolve(__dirname, '..');
  const sessionsDir = path.join(projectRoot, 'sessions');
  const outputDir = path.join(projectRoot, 'output');

  const providerFlag = flags.find((f) => f.startsWith('--provider='));
  const provider = providerFlag ? providerFlag.split('=')[1] : 'nvidia';

  const sourceFile = await resolveSourceFile(args[0], sessionsDir);
  const outputFile = args[1]
    ? path.resolve(args[1])
    : path.join(outputDir, `insight-${buildTimestamp()}.json`);

  try {
    if (htmlOnly) {
      console.log('[insight] --html mode: rendering HTML from existing insight.json...');
      const htmlInputFile = await resolveHtmlInputFile(args[0], outputDir);
      console.log(`[insight] HTML source -> ${htmlInputFile}`);
      const htmlPath = await generateStaticHtml(htmlInputFile, (stage, pct) => {
        console.log(`      [${pct}%] ${stage}`);
      });
      console.log(`\n[insight] HTML report -> ${htmlPath}`);
      console.log('[insight] Open this file in your browser to view the report.');
      return;
    }

    const insightOutputDir = path.dirname(path.resolve(outputFile));
    await fs.mkdir(insightOutputDir, { recursive: true });

    const insight = await generateInsights(sourceFile, { skipLlm, skipQualitative, provider });

    await fs.writeFile(outputFile, JSON.stringify(insight, null, 2), 'utf-8');
    console.log(`\n[insight] Done -> ${outputFile}`);

    console.log('\n[insight] Generating HTML report...');
    const htmlPath = await generateStaticHtml(outputFile, (stage, pct) => {
      console.log(`      [${pct}%] ${stage}`);
    });
    console.log(`[insight] HTML report -> ${htmlPath}`);
    console.log('[insight] Open this file in your browser to view the report.');

    console.log('\n-- Summary ----------------------------------');
    console.log(`Sessions:       ${insight.metrics.totalSessions}`);
    console.log(`Messages:       ${insight.metrics.totalMessages}`);
    console.log(`Facets:         ${insight.facets.length}`);
    console.log(`Current streak: ${insight.metrics.currentStreak} day(s)`);
    console.log('---------------------------------------------\n');
  } catch (err) {
    console.error('[insight] Fatal error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
