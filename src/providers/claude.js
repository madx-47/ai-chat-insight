/**
 * Anthropic Claude Provider
 *
 * Uses the Anthropic SDK with forced tool_use so the model always
 * returns validated structured JSON — no prompt engineering needed.
 *
 * API key: set ANTHROPIC_API_KEY environment variable
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseAnalyzer, formatSessionTranscript, buildUserPrompt } from './base.js';
import { SESSION_FACETS_SCHEMA } from '../types.js';

const client = new Anthropic();

export class ClaudeAnalyzer extends BaseAnalyzer {
  /**
   * @param {{
   *   model?: string,
   *   maxTokens?: number,
   *   apiKey?: string
   * }} options
   */
  constructor(options = {}) {
    super();
    this.model = options.model || 'claude-sonnet-4-5';
    this.maxTokens = options.maxTokens || 1024;
  }

  /**
   * Claude uses tool_use for guaranteed structured JSON output.
   * We override analyzeSession directly instead of using callLLM.
   *
   * @param {string} sessionId
   * @param {object[]} records
   * @returns {Promise<object|null>}
   */
  async analyzeSession(sessionId, records) {
    if (!records || records.length === 0) return null;

    const transcript = formatSessionTranscript(sessionId, records);
    const prompt = buildUserPrompt(transcript);

    try {
      const response = await client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
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

      const toolUse = response.content.find((b) => b.type === 'tool_use');
      if (!toolUse?.input) {
        console.warn(`[ClaudeAnalyzer] No tool_use block for session ${sessionId}`);
        return null;
      }

      return { session_id: sessionId, ...toolUse.input };
    } catch (err) {
      console.error(`[ClaudeAnalyzer] Failed session ${sessionId}: ${err.message}`);
      return null;
    }
  }

  // callLLM not used for Claude (we use tool_use directly above)
  async callLLM() {
    throw new Error('ClaudeAnalyzer uses analyzeSession directly, not callLLM');
  }
}
