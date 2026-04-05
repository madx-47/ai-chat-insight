/**
 * OpenAI Provider
 *
 * Uses the official openai npm package with function_call forced mode
 * for guaranteed structured JSON output — same pattern as Claude.
 *
 * API key: set OPENAI_API_KEY environment variable
 */

import { BaseAnalyzer, formatSessionTranscript, buildUserPrompt } from './base.js';
import { SESSION_FACETS_SCHEMA } from '../types.js';

export class OpenAIAnalyzer extends BaseAnalyzer {
  /**
   * @param {{
   *   model?: string,
   *   maxTokens?: number,
   *   apiKey?: string
   * }} options
   */
  constructor(options = {}) {
    super();
    this.model = options.model || 'gpt-4o-mini';
    this.maxTokens = options.maxTokens || 1024;
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  }

  /**
   * OpenAI uses function_call (tool_choice) for structured JSON.
   * We lazily import 'openai' so users who don't use this provider
   * don't need the package installed.
   *
   * @param {string} sessionId
   * @param {object[]} records
   * @returns {Promise<object|null>}
   */
  async analyzeSession(sessionId, records) {
    if (!records || records.length === 0) return null;

    // Lazy import — only fails if user actually calls this provider
    let OpenAI;
    try {
      ({ default: OpenAI } = await import('openai'));
    } catch {
      throw new Error(
        'openai package not installed. Run: npm install openai',
      );
    }

    const client = new OpenAI({ apiKey: this.apiKey });
    const transcript = formatSessionTranscript(sessionId, records);
    const prompt = buildUserPrompt(transcript);

    try {
      const response = await client.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_session_facets',
              description: 'Extract structured insight facets from a session transcript',
              parameters: SESSION_FACETS_SCHEMA,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_session_facets' } },
        messages: [{ role: 'user', content: prompt }],
      });

      const toolCall = response.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        console.warn(`[OpenAIAnalyzer] No tool_call for session ${sessionId}`);
        return null;
      }

      const parsed = JSON.parse(toolCall.function.arguments);
      return { session_id: sessionId, ...parsed };
    } catch (err) {
      console.error(`[OpenAIAnalyzer] Failed session ${sessionId}: ${err.message}`);
      return null;
    }
  }

  async callLLM() {
    throw new Error('OpenAIAnalyzer uses analyzeSession directly, not callLLM');
  }
}
