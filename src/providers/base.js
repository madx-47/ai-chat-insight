/**
 * Base interface for all LLM analyzer providers.
 *
 * Every provider file exports a class that extends BaseAnalyzer and
 * implements `callLLM(prompt: string): Promise<string>`.
 *
 * The shared logic (prompt building, JSON parsing, session formatting)
 * lives here so each provider only needs to handle its own HTTP call.
 */

import { SESSION_FACETS_SCHEMA } from '../types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Insight Prompts
// Used for qualitative analysis passes (not the per-session JSON extraction).
// ─────────────────────────────────────────────────────────────────────────────

// type InsightPromptType =
//   | 'analysis'
//   | 'impressive_workflows'
//   | 'project_areas'
//   | 'future_opportunities'
//   | 'friction_points'
//   | 'memorable_moment'
//   | 'improvements'
//   | 'interaction_style'
//   | 'at_a_glance';

const INSIGHT_PROMPTS = {
  analysis: `Analyze this coding session and extract structured facets.

CRITICAL GUIDELINES:

1. **goal_categories**: Count ONLY what the USER explicitly asked for.
   - DO NOT count the model's autonomous exploration
   - DO NOT count work the model decided to do on its own
   - ONLY count when user says "can you...", "please...", "I need...", "let's..."
   - POSSIBLE CATEGORIES (but be open to others that appear in the data):
      - bug_fix
      - feature_request
      - debugging
      - test_creation
      - code_refactoring
      - documentation_update

2. **user_satisfaction_counts**: Base ONLY on explicit user signals.
   - "Yay!", "great!", "perfect!" → happy
   - "thanks", "looks good", "that works" → satisfied
   - "ok, now let's..." (continuing without complaint) → likely_satisfied
   - "that's not right", "try again" → dissatisfied
   - "this is broken", "I give up" → frustrated

3. **friction_counts**: Be specific about what went wrong.
   - misunderstood_request: model interpreted incorrectly
   - wrong_approach: Right goal, wrong solution method
   - buggy_code: Code didn't work correctly
   - user_rejected_action: User said no/stop to an attempted action
   - excessive_changes: Over-engineered or changed too much

4. If very short or just warmup, use warmup_minimal for goal_category

5. **facet construction rules**: 
   - Create ONE OR MORE facets per session when the conversation contains distinct sub-goals or topic shifts; each facet must have session_id matching sessions[]
   - underlying_goal: Summarize the user's primary intent for this facet in 1 concise sentence
   - outcome: Use ONLY enum values: "fully_achieved" | "mostly_achieved" | "partially_achieved" | "not_achieved" | "unclear_from_transcript"
   - ai_helpfulness: Use ONLY enum values: "unhelpful" | "slightly_helpful" | "moderately_helpful" | "very_helpful" | "essential"
   - session_type: Use ONLY enum values: "single_task" | "multi_task" | "iterative_refinement" | "exploration" | "quick_question"
   - primary_success: Use ONLY enum values: "none" | "fast_accurate_search" | "correct_code_edits" | "good_explanations" | "proactive_help" | "multi_file_changes" | "good_debugging"
   - friction_detail: Provide empty string "" if friction_counts is {"none": 1}
   - brief_summary: Must be ≤ 20 words, factual and neutral tone
   - When creating multiple facets for one session, ensure each represents a logically distinct user goal or phase; avoid redundant or overlapping facets`,


  impressive_workflows: `Analyze this usage data and identify what's working well for this user. Use second person ("you").

Provide a JSON object structured as follows:
{
  "intro": "1 sentence of context",
  "impressive_workflows": [
    {"title": "Short title (3-6 words)", "description": "2-3 sentences describing the impressive workflow or approach. Use 'you' not 'the user'."}
  ]
}

Include 3 impressive workflows.`,

  project_areas: `Analyze this usage data and identify project areas.

Provide a JSON object structured as follows:
{
  "areas": [
    {"name": "Area name", "session_count": N, "description": "2-3 sentences about what was worked on and how the model was used."}
  ]
}

Include 4-5 areas. Skip internal QC operations.`,

  future_opportunities: `Analyze this usage data and identify future opportunities.

Provide a JSON object structured as follows:
{
  "intro": "1 sentence about evolving AI-assisted development",
  "opportunities": [
    {"title": "Short title (4-8 words)", "whats_possible": "2-3 ambitious sentences about autonomous workflows", "how_to_try": "1-2 sentences mentioning relevant tooling", "copyable_prompt": "Detailed prompt to try"}
  ]
}

Include 3 opportunities. Think BIG - autonomous workflows, parallel agents, iterating against tests.`,

  friction_points: `Analyze this usage data and identify friction points for this user. Use second person ("you").

Provide a JSON object structured as follows:
{
  "intro": "1 sentence summarizing friction patterns",
  "categories": [
    {"category": "Concrete category name", "description": "1-2 sentences explaining this category and what could be done differently. Use 'you' not 'the user'.", "examples": ["Specific example with consequence", "Another example"]}
  ]
}

Include 3 friction categories with 2 examples each.`,

  memorable_moment: `Analyze this usage data and find a memorable moment.

Provide a JSON object structured as follows:
{
  "headline": "A memorable QUALITATIVE moment from the transcripts - not a statistic. Something human, funny, or surprising.",
  "detail": "Brief context about when/where this happened"
}

Find something genuinely interesting or amusing from the session summaries.`,

  improvements: `Analyze this usage data and suggest improvements.`,

  at_a_glance: `You're writing an "At a Glance" summary for usage insights. The goal is to help the user understand their usage and improve how they can work with the model better, especially as models improve.

Use this 4-part structure:

1. **What's working** - What is the user's unique style of interacting with the model and what are some impactful things they've done? You can include one or two details, but keep it high level. Don't be fluffy or overly complimentary. Also, don't focus on specific actions.

2. **What's hindering you** - Split into (a) model-side issues (misunderstandings, wrong approaches, bugs) and (b) user-side friction (not providing enough context, environment issues -- ideally more general than just one project). Be honest but constructive.

3. **Quick wins to try** - Specific features or workflow techniques they could try. (Avoid generic advice like "ask for confirmation" or "type more context" which are less compelling.)

4. **Ambitious workflows for better models** - As models become more capable over the next 3-6 months, what should they prepare for? What workflows that seem impossible now will become possible? Draw from the appropriate sections above.

Keep each section to 2-3 not-too-long sentences. Don't overwhelm the user. Don't mention specific numerical stats. Use a coaching tone.

Provide a JSON object structured as follows:
{
  "whats_working": "(refer to instructions above)",
  "whats_hindering": "(refer to instructions above)",
  "quick_wins": "(refer to instructions above)",
  "ambitious_workflows": "(refer to instructions above)"
}`,

};

export function getInsightPrompt(type) {
  return INSIGHT_PROMPTS[type] || INSIGHT_PROMPTS['analysis'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the system prompt that instructs the model to return strict JSON.
 * All providers use the same prompt — only the HTTP layer differs.
 *
 * @returns {string}
 */
export function buildSystemPrompt() {
  const schemaStr = JSON.stringify(SESSION_FACETS_SCHEMA, null, 2);

  return `You are an AI session analyst. Analyze the chat session transcript and extract structured insights.

CRITICAL GUIDELINES:

1. **goal_categories**: Count each DISTINCT goal or topic the user engaged with — both explicit requests AND implicit needs revealed through their questions or follow-ups.
   - Count each DISTINCT task/topic as its own category key with a count
   - Example: if user asked about X, then asked to create Y, then asked how to do Z, that is 3 categories each with count 1
   - Each category's count = how many times user returned to or extended that specific goal
   - DO NOT count assistant-initiated work the user never asked about
   - Possible category keys (use your own if needed): bug_fix, feature_request, debugging, test_creation, code_refactoring, documentation_update, architecture_design, research, general_question, learning, project_setup, content_creation, guidance, explanation

2. **user_satisfaction_counts**: Count satisfaction signals ACROSS THE WHOLE SESSION — tally each individual instance.
   - "Yay!", "great!", "perfect!", "amazing" → happy (count each occurrence separately)
   - "thanks", "looks good", "that works" → satisfied (count each)
   - User smoothly continuing to next topic without complaint → likely_satisfied (count each smooth transition)
   - "that's not right", "try again", "no" → dissatisfied
   - "this is broken", "I give up" → frustrated
   - Nuanced signals like "engaged", "curious", "impressed" → use as-is if clearly present

3. **friction_counts**: Be specific about what went wrong.
   - misunderstood_request: assistant interpreted the request incorrectly
   - wrong_approach: right goal, wrong solution method
   - buggy_code: code didn't work correctly
   - user_rejected_action: user said no/stop to an action
   - excessive_changes: over-engineered or changed too much
   - hallucination: assistant invented details
   - Use {"none": 1} if there was no friction.

4. **primary_success**: Pick the ONE thing the assistant did BEST in this session.
   - good_explanations: clearly explained concepts or answered questions
   - correct_code_edits: made correct code changes
   - fast_accurate_search: found/retrieved information quickly
   - proactive_help: anticipated needs beyond what was asked
   - good_debugging: identified and fixed bugs effectively
   - multi_file_changes: coordinated changes across multiple files
   - none: assistant did not do anything particularly well

5. If very short or just warmup, use warmup_minimal for goal_category.

You MUST respond with a single valid JSON object that exactly matches this schema:
${schemaStr}

Rules:
- Output ONLY the JSON object. No markdown, no code fences, no explanation before or after.
- All enum fields must use exactly one of the allowed values.
- brief_summary: one sentence, max 20 words.
- friction_detail: one sentence or empty string "".`;
}

/**
 * Build the user-turn prompt for a session analysis.
 *
 * @param {string} sessionText - formatted session transcript
 * @returns {string}
 */
export function buildUserPrompt(sessionText) {
  return `${getInsightPrompt('analysis')}\n\nSESSION:\n${sessionText}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Transcript Formatter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a session's records into a clean readable transcript.
 * Shared across all providers.
 *
 * @param {string} sessionId
 * @param {object[]} records
 * @returns {string}
 */
export function formatSessionTranscript(sessionId, records) {
  const timestamps = records.map((r) => new Date(r.timestamp));
  const startTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));

  let out = `Session ID: ${sessionId}\n`;
  out += `Date: ${startTime.toISOString()}\n`;
  out += `Records: ${records.length}\n\n`;
  out += `--- TRANSCRIPT ---\n`;

  for (const record of records) {
    if (record.type === 'user' && record.message?.parts) {
      const text = record.message.parts
        .map((p) => p.text || '')
        .join('')
        .trim();
      if (text) out += `[User]: ${text}\n\n`;

    } else if (record.type === 'assistant' && record.message?.parts) {
      for (const part of record.message.parts) {
        if (part.thought) continue; // skip internal thinking blocks
        if (part.text?.trim()) {
          out += `[Assistant]: ${part.text.trim()}\n\n`;
        } else if (part.functionCall?.name) {
          const args = JSON.stringify(part.functionCall.args || {}).slice(0, 100);
          out += `[Tool call]: ${part.functionCall.name}(${args})\n`;
        }
      }

    } else if (record.type === 'tool_result' && record.toolCallResult) {
      const { status, resultDisplay } = record.toolCallResult;
      const display =
        typeof resultDisplay === 'string'
          ? resultDisplay.slice(0, 150)
          : JSON.stringify(resultDisplay).slice(0, 150);
      out += `[Tool result]: ${status} — ${display}\n`;
    }
    // Skip system/telemetry records
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON Response Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse the LLM's raw text output into a validated facets object.
 * Strips markdown code fences and <think> blocks if present.
 *
 * @param {string} raw - raw LLM output text
 * @param {string} sessionId
 * @returns {object} SessionFacets
 */
export function parseJsonResponse(raw, sessionId) {
  // Strip <think>...</think> blocks (some models output internal reasoning)
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Extract the first complete JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);
  return { session_id: sessionId, ...parsed };
}

// ─────────────────────────────────────────────────────────────────────────────
// Base Analyzer Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base class — providers extend this and implement callLLM().
 */
export class BaseAnalyzer {
  /**
   * Call the LLM and return raw text output.
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @returns {Promise<string>}
   */
  async callLLM(systemPrompt, userPrompt) {
    throw new Error('callLLM() must be implemented by subclass');
  }

  /**
   * Analyze one session: format → prompt → LLM → parse → facets.
   *
   * @param {string} sessionId
   * @param {object[]} records
   * @returns {Promise<object|null>} SessionFacets or null on failure
   */
  async analyzeSession(sessionId, records) {
    if (!records || records.length === 0) return null;

    const transcript = formatSessionTranscript(sessionId, records);
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(transcript);

    try {
      const raw = await this.callLLM(systemPrompt, userPrompt);
      try {
        return parseJsonResponse(raw, sessionId);
      } catch (parseErr) {
        console.error(`[${this.constructor.name}] Parsing failed for session ${sessionId}: ${parseErr.message}`);
        console.error(`Raw output (first 500 chars): ${raw?.slice(0, 500)}`);
        return null;
      }
    } catch (err) {
      console.error(`[${this.constructor.name}] Failed session ${sessionId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Analyze all sessions with concurrency control.
   *
   * @param {Map<string, object[]>} sessionMap
   * @param {{ concurrency?: number, onProgress?: Function }} options
   * @returns {Promise<object[]>}
   */
  async analyzeAllSessions(sessionMap, options = {}) {
    const { concurrency = 3, onProgress } = options;
    const entries = [...sessionMap.entries()];
    const total = entries.length;
    const results = [];
    let done = 0;

    for (let i = 0; i < entries.length; i += concurrency) {
      const chunk = entries.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(([sessionId, records]) =>
          this.analyzeSession(sessionId, records).then((facet) => {
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
}
