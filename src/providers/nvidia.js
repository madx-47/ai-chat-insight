/**
 * NVIDIA NIM Provider
 *
 * Uses: https://integrate.api.nvidia.com/v1/chat/completions
 * Default model: qwen/qwen3.5-122b-a10b
 *
 * Key differences from OpenAI:
 * - Uses axios with responseType: 'stream' for SSE
 * - Qwen3 thinking mode enabled via chat_template_kwargs
 * - Thinking tokens appear in <think>...</think> tags — stripped in base.js
 * - No native function/tool calling for this model — JSON via prompt
 *
 * API key: set NVIDIA_API_KEY environment variable
 */

import axios from 'axios';
import { BaseAnalyzer } from './base.js';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export class NvidiaAnalyzer extends BaseAnalyzer {
  /**
   * @param {{
   *   model?: string,
   *   maxTokens?: number,
   *   temperature?: number,
   *   enableThinking?: boolean,
   *   apiKey?: string
   * }} options
   */
  constructor(options = {}) {
    super();
    this.model = options.model || 'qwen/qwen3.5-122b-a10b';
    this.maxTokens = options.maxTokens || 32000;
    this.temperature = options.temperature ?? 0.3; // lower = more deterministic JSON
    this.enableThinking = options.enableThinking ?? false; // disable: thinking burns all tokens before JSON output
    this.apiKey = options.apiKey || process.env.NVIDIA_API_KEY;

    if (!this.apiKey) {
      console.log(this.apiKey);
      throw new Error(
        'NVIDIA_API_KEY is not set. Set it as an environment variable or pass apiKey in options.',
      );
    }
  }

  /**
   * Collect SSE stream chunks into a full string.
   * NVIDIA streams data as: data: {"choices":[{"delta":{"content":"..."}}]}
   *
   * @param {import('stream').Readable} stream
   * @returns {Promise<string>}
   */
  async collectStream(stream) {
    return new Promise((resolve, reject) => {
      let fullText = '';
      let buffer = '';
      let hasResolved = false;

      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          console.log('[NVIDIA] Stream timeout - resolving with current text');
          resolve(fullText);
        }
      }, 120000); // 2 minutes timeout

      stream.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        buffer += chunkStr;
        const lines = buffer.split('\n');

        // Keep last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') {
            if (trimmed === 'data: [DONE]') {
              console.log('[NVIDIA] Received [DONE] signal');
            }
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
              }
            } catch (err) {
              console.warn('[NVIDIA] Failed to parse SSE line:', trimmed.slice(0, 100));
            }
          }
        }
      });

      stream.on('end', () => {
        clearTimeout(timeout);
        if (!hasResolved) {
          hasResolved = true;
          console.log(`[NVIDIA] Stream ended, collected ${fullText.length} chars`);
          resolve(fullText);
        }
      });

      stream.on('error', (err) => {
        clearTimeout(timeout);
        if (!hasResolved) {
          hasResolved = true;
          console.error('[NVIDIA] Stream error:', err.message);
          reject(err);
        }
      });
    });
  }

  /**
   * Call the NVIDIA NIM API with streaming and return full response text.
   *
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @returns {Promise<string>}
   */
  async callLLM(systemPrompt, userPrompt) {
    console.log("[NVIDIA] Calling LLM with prompts...");
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      top_p: 0.95,
      stream: true,
    };

    if (this.enableThinking) {
      payload.chat_template_kwargs = { enable_thinking: true };
    }

    console.log("[NVIDIA] Sending request to:", NVIDIA_API_URL);
    const response = await axios.post(NVIDIA_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      responseType: 'stream',
      timeout: 120_000, // 2 min per session
    });

    console.log("[NVIDIA] Response received, collecting stream...");
    // Wait for the stream to complete and return the full response
    const fullResponse = await this.collectStream(response.data);
    console.log(`[NVIDIA] Collection complete, got ${fullResponse.length} characters`);
    return fullResponse;
  }
}
