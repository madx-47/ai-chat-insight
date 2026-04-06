/**
 * Ollama Local Provider
 *
 * Calls a locally running Ollama instance via its REST API.
 * Endpoint: http://localhost:11434/api/chat
 *
 * Ollama does not support tool_use, so we use the same
 * JSON-via-prompt approach as the NVIDIA provider.
 *
 * Setup: install Ollama, run `ollama pull <model>`, then `ollama serve`
 */

import { BaseAnalyzer } from './base.js';

const OLLAMA_URL = 'http://localhost:11434/api/chat';

export class OllamaAnalyzer extends BaseAnalyzer {
  /**
   * @param {{
   *   model?: string,
   *   baseUrl?: string,
   *   temperature?: number
   * }} options
   */
  constructor(options = {}) {
    super();
    this.model = options.model || 'qwen3.5:0.8b';
    this.baseUrl = options.baseUrl || OLLAMA_URL;
    this.temperature = options.temperature ?? 0.1;
  }

  /**
   * Call local Ollama instance (non-streaming, JSON mode).
   *
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @returns {Promise<string>}
   */
  async callLLM(systemPrompt, userPrompt) {
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      options: {
        temperature: this.temperature,
        num_predict: 2048,
      },
      format: 'json', // Ollama's built-in JSON mode
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180_000), // 3 min for local models
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data?.message?.content || '';
  }
}
