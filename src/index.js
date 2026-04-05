/**
 * AI Chat Insight System — Entry Point
 *
 * Usage:
 *   node src/index.js <path-to-session.jsonl> [output.json]
 *
 * Pipeline:
 *   1. Read & parse JSONL
 *   2. Group by session
 *   3. Generate metrics (no LLM)
 *   4. Filter conversational sessions
 *   5. Analyze each session with Claude → facets
 *   6. Aggregate facets
 *   7. Write insight.json
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ override: true });
import { readJsonlFile, groupBySession, isConversationalSession } from './reader.js';
import { generateMetrics } from './metrics.js';
import { createAnalyzer } from './providers/index.js';
import { aggregateFacets } from './aggregator.js';

/**
 * Core pipeline function.
 *
 * @param {string} sourceFile - path to .jsonl file
 * @param {{ skipLlm?: boolean }} options
 * @returns {Promise<object>} InsightData
 */
export async function generateInsights(sourceFile, options = {}) {
  const { skipLlm = false, provider = 'nvidia', providerOptions = {} } = options;
  console.log(`\n[insight] Source: ${sourceFile}`);

  // ── Step 1: Read & parse ────────────────────────────────────────────────
  console.log('[1/5] Reading session file...');
  const records = await readJsonlFile(sourceFile);
  console.log(`      → ${records.length} records parsed`);

  // ── Step 2: Group by session ────────────────────────────────────────────
  console.log('[2/5] Grouping by session...');
  const allSessionMap = groupBySession(records);
  console.log(`      → ${allSessionMap.size} unique session(s) found`);

  // ── Step 3: Generate metrics (all sessions, no LLM) ─────────────────────
  console.log('[3/5] Computing metrics...');
  const { metrics, sessions } = generateMetrics(allSessionMap);
  console.log(`      → ${metrics.totalMessages} user messages across ${metrics.totalSessions} session(s)`);
  console.log(`      → Active days: ${Object.keys(metrics.heatmap).join(', ') || 'none'}`);
  console.log(`      → Streak: current=${metrics.currentStreak} longest=${metrics.longestStreak}`);

  // ── Step 4: Filter to conversational sessions only ──────────────────────
  console.log('[4/5] Filtering conversational sessions...');
  const conversationalMap = new Map(
    [...allSessionMap.entries()].filter(([, recs]) =>
      isConversationalSession(recs),
    ),
  );
  console.log(`      → ${conversationalMap.size} conversational session(s) eligible for analysis`);

  // ── Step 5: LLM analysis → facets ───────────────────────────────────────
  let facets = [];
  if (skipLlm) {
    console.log('[5/5] Skipping LLM analysis (--skip-llm flag set)');
  } else if (conversationalMap.size > 0) {
    console.log(`[5/5] Analyzing sessions with provider: ${provider}...`);
    const analyzer = createAnalyzer(provider, providerOptions);
    facets = await analyzer.analyzeAllSessions(conversationalMap, {
      concurrency: 3,
      onProgress: (done, total) => {
        process.stdout.write(`\r      → ${done}/${total} sessions analyzed`);
      },
    });
    console.log(`\n      → ${facets.length} facet(s) generated`);
  } else {
    console.log('[5/5] No conversational sessions to analyze — skipping LLM step');
  }

  // ── Step 6: Aggregate facets ─────────────────────────────────────────────
  const aggregated = aggregateFacets(facets);

  // ── Step 7: Assemble final InsightData ───────────────────────────────────
  const insightData = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.resolve(sourceFile),
    metrics,
    sessions,
    facets,
    aggregated,
    qualitative: null, // Phase 2
  };

  return insightData;
}

// ── CLI runner ──────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const flags = process.argv.slice(2).filter((a) => a.startsWith('--'));
  const skipLlm = flags.includes('--skip-llm');

  // --provider=nvidia  or  --provider=claude  etc.
  const providerFlag = flags.find((f) => f.startsWith('--provider='));
  const provider = providerFlag ? providerFlag.split('=')[1] : 'nvidia';

  // if (args.length === 0) {
  //   console.error('Usage: node src/index.js <session.jsonl> [output.json] [--skip-llm]');
  //   process.exit(1);
  // }

  // const sourceFile = args[0];
  // const outputFile = args[1] || 'insight.json';
  // const sourceFile = "D:\\Side Project\\ai-chat-insight\\test-session.jsonl";
  const sourceFile = "D:\\Side Project\\ai-chat-insight\\web-session3.jsonl";
  const outputFile = "D:\\Side Project\\ai-chat-insight\\output\\insight.json";

  try {
    // Auto-create output directory if needed
    const outputDir = path.dirname(path.resolve(outputFile));
    await fs.mkdir(outputDir, { recursive: true });

    const insight = await generateInsights(sourceFile, { skipLlm, provider });

    await fs.writeFile(outputFile, JSON.stringify(insight, null, 2), 'utf-8');
    console.log(`\n[insight] Done → ${outputFile}`);

    // Print a quick summary to terminal
    console.log('\n── Summary ──────────────────────────────────');
    console.log(`Sessions:       ${insight.metrics.totalSessions}`);
    console.log(`Messages:       ${insight.metrics.totalMessages}`);
    console.log(`Facets:         ${insight.facets.length}`);
    console.log(`Current streak: ${insight.metrics.currentStreak} day(s)`);
    if (insight.facets.length > 0) {
      console.log('\nSession facets:');
      for (const f of insight.facets) {
        console.log(`  [${f.session_id.slice(0, 8)}] ${f.brief_summary}`);
        console.log(`          outcome=${f.outcome} | helpfulness=${f.ai_helpfulness} | type=${f.session_type}`);
      }
    }
    if (Object.keys(insight.aggregated.goalsAgg).length > 0) {
      const topGoals = Object.entries(insight.aggregated.goalsAgg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      console.log('\nTop goals:', topGoals.map(([k, v]) => `${k}(${v})`).join(', '));
    }
    console.log('─────────────────────────────────────────────\n');
  } catch (err) {
    console.error('[insight] Fatal error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

main();
