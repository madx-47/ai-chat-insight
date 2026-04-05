import Anthropic from '@anthropic-ai/sdk';
import { SESSION_FACETS_SCHEMA } from './types.js';

const client = new Anthropic();

/**
 * Format a session's records into a readable text block for the LLM.
 * Strips system/telemetry noise. Includes tool calls by name only.
 *
 * @param {string} sessionId
 * @param {object[]} records
 * @returns {string}
 */
function formatSessionForAnalysis(sessionId, records) {
  const timestamps = records.map((r) => new Date(r.timestamp));
  const startTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));

  let output = '';
  output += `Session ID: ${sessionId}\n`;
  output += `Date: ${startTime.toISOString()}\n`;
  output += `Total records: ${records.length}\n\n`;

  for (const record of records) {
    if (record.type === 'user' && record.message?.parts) {
      const text = record.message.parts
        .map((p) => p.text || '')
        .join('')
        .trim();
      if (text) output += `[User]: ${text}\n`;
    } else if (record.type === 'assistant' && record.message?.parts) {
      for (const part of record.message.parts) {
        // Skip internal "thought" blocks — they're model internals, not responses
        if (part.thought) continue;

        if (part.text?.trim()) {
          output += `[Assistant]: ${part.text.trim()}\n`;
        } else if (part.functionCall?.name) {
          output += `[Tool call]: ${part.functionCall.name}(${JSON.stringify(part.functionCall.args || {})})\n`;
        }
      }
    } else if (record.type === 'tool_result' && record.toolCallResult) {
      const status = record.toolCallResult.status;
      const display = record.toolCallResult.resultDisplay;
      const displayStr =
        typeof display === 'string'
          ? display.slice(0, 120)
          : JSON.stringify(display).slice(0, 120);
      output += `[Tool result]: ${status} — ${displayStr}\n`;
    }
    // Skip system/telemetry records entirely
  }

  return output;
}

/**
 * Build the analysis prompt for a single session.
 * @param {string} sessionText
 * @returns {string}
 */
function buildAnalysisPrompt(sessionText) {
  return `You are analyzing an AI coding assistant session to extract structured insights.

Read the session transcript below and return a JSON object that captures:
- What the user fundamentally wanted (underlying_goal)
- Which categories of work were involved (goal_categories — free-form keys like "debugging", "learning", "project_setup", "refactoring", etc. with counts)
- Whether the user achieved their goal (outcome)
- Signs of user satisfaction or frustration (user_satisfaction_counts — free-form keys like "satisfied", "frustrated", "neutral", "confused" with counts)
- How helpful the AI was overall (ai_helpfulness)
- What type of session this was (session_type)
- Any friction or failure patterns (friction_counts — free-form keys like "misunderstood_intent", "wrong_tool", "repeated_corrections", "none" with counts)
- A one-sentence description of friction, or empty string (friction_detail)
- The primary thing the AI did well (primary_success)
- A one-sentence summary of the session (brief_summary)

Be objective. Base your analysis only on what is in the transcript.
If the session is very short or unclear, use "unclear_from_transcript" for outcome.

SESSION TRANSCRIPT:
${sessionText}`;
}

/**
 * Analyze a single conversational session using Claude.
 * Returns SessionFacets or null if analysis fails.
 *
 * @param {string} sessionId
 * @param {object[]} records
 * @returns {Promise<object|null>}
 */
export async function analyzeSession(sessionId, records) {
  const sessionText = formatSessionForAnalysis(sessionId, records);
  const prompt = buildAnalysisPrompt(sessionText);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      tools: [
        {
          name: 'extract_session_facets',
          description: 'Extract structured insight facets from a session transcript',
          input_schema: SESSION_FACETS_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_session_facets' },
      messages: [{ role: 'user', content: prompt }],
    });

    // Find the tool_use block
    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || !toolUse.input) {
      console.warn(`[analyzer] No tool_use block returned for session ${sessionId}`);
      return null;
    }

    return {
      session_id: sessionId,
      ...toolUse.input,
    };
  } catch (err) {
    console.error(`[analyzer] Failed to analyze session ${sessionId}:`, err.message);
    return null;
  }
}

/**
 * Analyze multiple sessions with a concurrency limit to avoid rate limits.
 *
 * @param {Map<string, object[]>} sessionMap - only conversational sessions
 * @param {{ concurrency?: number, onProgress?: (done: number, total: number) => void }} options
 * @returns {Promise<object[]>} array of SessionFacets (nulls filtered out)
 */
export async function analyzeAllSessions(sessionMap, options = {}) {
  const { concurrency = 3, onProgress } = options;
  const entries = [...sessionMap.entries()];
  const total = entries.length;
  const results = [];
  let done = 0;

  // Process in chunks of `concurrency`
  for (let i = 0; i < entries.length; i += concurrency) {
    const chunk = entries.slice(i, i + concurrency);

    const chunkResults = await Promise.all(
      chunk.map(([sessionId, records]) =>
        analyzeSession(sessionId, records).then((facet) => {
          done++;
          if (onProgress) onProgress(done, total);
          return facet;
        }),
      ),
    );

    results.push(...chunkResults.filter(Boolean));
  }

  return results;
}
