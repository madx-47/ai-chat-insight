/**
 * Provider Factory
 *
 * Single import point. Returns the correct analyzer instance based on
 * a provider name string. Used by index.js and the config system.
 *
 * Usage:
 *   import { createAnalyzer } from './providers/index.js';
 *   const analyzer = createAnalyzer('nvidia');
 *   const facets = await analyzer.analyzeAllSessions(sessionMap);
 *
 * Provider names:
 *   'nvidia'  → NvidiaAnalyzer  (default, uses NVIDIA_API_KEY)
 *   'claude'  → ClaudeAnalyzer  (uses ANTHROPIC_API_KEY)
 *   'openai'  → OpenAIAnalyzer  (uses OPENAI_API_KEY)
 *   'ollama'  → OllamaAnalyzer  (uses local Ollama instance)
 */

import { NvidiaAnalyzer } from './nvidia.js';
import { ClaudeAnalyzer } from './claude.js';
import { OpenAIAnalyzer } from './openai.js';
import { OllamaAnalyzer } from './ollama.js';

/**
 * Create and return an analyzer instance for the given provider.
 *
 * @param {'nvidia'|'claude'|'openai'|'ollama'} provider
 * @param {object} options - passed to the provider constructor
 * @returns {import('./base.js').BaseAnalyzer}
 */
export function createAnalyzer(provider = 'nvidia', options = {}) {
  switch (provider.toLowerCase()) {
    case 'nvidia':
      return new NvidiaAnalyzer(options);

    case 'claude':
    case 'anthropic':
      return new ClaudeAnalyzer(options);

    case 'openai':
    case 'gpt':
      return new OpenAIAnalyzer(options);

    case 'ollama':
    case 'local':
      return new OllamaAnalyzer(options);

    default:
      throw new Error(
        `Unknown provider: "${provider}". Valid options: nvidia, claude, openai, ollama`,
      );
  }
}

export { NvidiaAnalyzer, ClaudeAnalyzer, OpenAIAnalyzer, OllamaAnalyzer };
