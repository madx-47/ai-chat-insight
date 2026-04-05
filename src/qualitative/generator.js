/**
 * generateQualitativeInsights — Phase 2
 *
 * Runs 8 LLM calls in parallel (concurrency=4, same as Qwen).
 * Each call gets: qualitative prompt + commonData context block.
 *
 * Uses the same provider system as the facet analyzer, but calls
 * the LLM differently per provider:
 *   - Claude  → tool_use with schema
 *   - NVIDIA/Ollama → JSON-via-prompt + parseJsonResponse
 *
 * Returns QualitativeInsights or null if facets are empty.
 */

import { getQualitativePrompt } from './prompts.js';
import { QUALITATIVE_SCHEMAS } from './schemas.js';
import { prepareCommonData } from './context.js';
import { parseJsonResponse } from '../providers/base.js';

// Concurrency limit — 4 parallel calls max, same as Qwen
const CONCURRENCY = 4;

/**
 * Run an array of async tasks with a max concurrency limit.
 * @param {Array<() => Promise<any>>} tasks
 * @param {number} limit
 * @returns {Promise<any[]>}
 */
async function withConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Call LLM for one qualitative section.
 * Handles both Claude (tool_use) and text-based providers (NVIDIA/Ollama).
 *
 * @param {object} analyzer - provider instance (BaseAnalyzer subclass)
 * @param {string} sectionKey - e.g. 'impressive_workflows'
 * @param {string} commonData - context block from prepareCommonData()
 * @returns {Promise<object|null>}
 */
async function generateSection(analyzer, sectionKey, commonData) {
  const promptTemplate = getQualitativePrompt(sectionKey);
  const schema = QUALITATIVE_SCHEMAS[sectionKey];

  // Full prompt = template + context block (same pattern as Qwen)
  const fullPrompt = `${promptTemplate}\n\n${commonData}`;

  try {
    // Claude uses tool_use — override callLLM with direct messages.create
    if (analyzer.constructor.name === 'ClaudeAnalyzer') {
      return await callClaudeSection(analyzer, sectionKey, schema, fullPrompt);
    }

    // All other providers: JSON-via-prompt
    const raw = await analyzer.callLLM(
      'You are an AI usage analyst. Respond with valid JSON only. No markdown, no explanation.',
      fullPrompt,
    );
    return parseJsonResponse(raw, sectionKey);

  } catch (err) {
    console.error(`[qualitative] Failed section "${sectionKey}": ${err.message}`);
    return null;
  }
}

/**
 * Claude-specific section call using forced tool_use.
 * @param {object} analyzer
 * @param {string} sectionKey
 * @param {object} schema
 * @param {string} fullPrompt
 * @returns {Promise<object|null>}
 */
async function callClaudeSection(analyzer, sectionKey, schema, fullPrompt) {
  // Access the Anthropic client directly from the ClaudeAnalyzer
  // We import Anthropic here to avoid circular deps
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic();

  const response = await client.messages.create({
    model: analyzer.model || 'claude-sonnet-4-5',
    max_tokens: 2048,
    tools: [
      {
        name: 'respond_in_schema',
        description: `Generate the ${sectionKey} section of the AI usage insight report`,
        input_schema: schema,
      },
    ],
    tool_choice: { type: 'tool', name: 'respond_in_schema' },
    messages: [{ role: 'user', content: fullPrompt }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse?.input) {
    console.warn(`[qualitative] No tool_use block for section "${sectionKey}"`);
    return null;
  }
  return toolUse.input;
}

/**
 * Main Phase 2 entry point.
 *
 * @param {object} analyzer  - provider instance from createAnalyzer()
 * @param {object} metrics   - MetricsData
 * @param {object[]} facets  - SessionFacets[]
 * @param {{ onProgress?: (msg: string) => void }} options
 * @returns {Promise<object|null>} QualitativeInsights or null
 */
export async function generateQualitativeInsights(analyzer, metrics, facets, options = {}) {
  const { onProgress } = options;

  if (!facets || facets.length === 0) {
    console.log('[qualitative] No facets available — skipping qualitative generation');
    return null;
  }

  // Build the shared context block once — sent to all 8 LLM calls
  const commonData = prepareCommonData(metrics, facets);

  const SECTIONS = [
    'impressive_workflows',
    'project_areas',
    'future_opportunities',
    'friction_points',
    'memorable_moment',
    'improvements',
    'interaction_style',
    'at_a_glance',
  ];

  if (onProgress) onProgress('Generating qualitative insights (8 sections)...');

  // Run all 8 in parallel with concurrency cap of 4
  const tasks = SECTIONS.map((key) => async () => {
    if (onProgress) onProgress(`  → ${key}...`);
    const result = await generateSection(analyzer, key, commonData);
    if (onProgress) onProgress(`  ✓ ${key}`);
    return [key, result];
  });

  const results = await withConcurrency(tasks, CONCURRENCY);

  // Build the qualitative object — null entries preserved so caller can
  // detect partial failures
  const qualitative = {};
  for (const [key, value] of results) {
    qualitative[key] = value;
  }

  const succeeded = results.filter(([, v]) => v !== null).length;
  console.log(`\n[qualitative] ${succeeded}/${SECTIONS.length} sections generated`);

  return qualitative;
}
