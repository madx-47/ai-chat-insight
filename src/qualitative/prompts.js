/**
 * Qualitative insight prompt templates.
 * Adapted from Qwen Code's packages/core/src/core/prompts.ts — INSIGHT_PROMPTS.
 *
 * Each prompt is a function that returns the full prompt string.
 * The commonData block (from prepareCommonData) is appended by the caller.
 *
 * 8 qualitative sections:
 *   1. impressive_workflows
 *   2. project_areas
 *   3. future_opportunities
 *   4. friction_points
 *   5. memorable_moment
 *   6. improvements
 *   7. interaction_style
 *   8. at_a_glance
 */

export const QUALITATIVE_PROMPTS = {

  impressive_workflows: `Analyze this AI assistant usage data and identify what's working well for this user. Use second person ("you").

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "intro": "1 sentence of context",
  "impressive_workflows": [
    {"title": "Short title (3-6 words)", "description": "2-3 sentences describing the impressive workflow or approach. Use 'you' not 'the user'."}
  ]
}

Include 3 impressive workflows.`,

  project_areas: `Analyze this AI assistant usage data and identify project areas the user worked on.

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "areas": [
    {"name": "Area name", "session_count": N, "description": "2-3 sentences about what was worked on and how the AI was used."}
  ]
}

Include 4-5 areas. Skip generic or meta AI-interaction topics.`,

  future_opportunities: `Analyze this AI assistant usage data and identify future opportunities for this user.

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "intro": "1 sentence about evolving AI-assisted development",
  "opportunities": [
    {"title": "Short title (4-8 words)", "whats_possible": "2-3 ambitious sentences about autonomous workflows", "how_to_try": "1-2 sentences with concrete steps", "copyable_prompt": "A detailed ready-to-use prompt the user can paste into an AI chat"}
  ]
}

Include 3 opportunities. Think BIG — autonomous workflows, parallel tasks, iterating against tests.`,

  friction_points: `Analyze this AI assistant usage data and identify friction points for this user. Use second person ("you").

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "intro": "1 sentence summarizing the main friction patterns",
  "categories": [
    {"category": "Concrete category name", "description": "1-2 sentences explaining this friction and what could be done differently. Use 'you' not 'the user'.", "examples": ["Specific example with consequence", "Another specific example"]}
  ]
}

Include 3 friction categories with 2 examples each.`,

  memorable_moment: `Analyze this AI assistant usage data and find a memorable moment.

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "headline": "A memorable QUALITATIVE moment from the session summaries — not a statistic. Something human, surprising, or impressive.",
  "detail": "Brief context: when/where this happened and why it stands out"
}

Find something genuinely interesting or notable from the session summaries. Avoid generic summaries.`,

  improvements: `Analyze this AI assistant usage data and suggest actionable improvements for this user.

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "system_prompt_additions": [
    {"addition": "A specific instruction to add to the AI system prompt", "why": "Why this would help based on observed patterns", "prompt_scaffold": "The exact text the user should add"}
  ],
  "features_to_try": [
    {"feature": "Feature or technique name", "one_liner": "What it does in one sentence", "why_for_you": "Why it fits this user's specific patterns", "example": "Concrete example of how to use it"}
  ],
  "usage_patterns": [
    {"title": "Pattern title", "suggestion": "What to change", "detail": "Why this would improve results", "copyable_prompt": "A ready-to-use prompt demonstrating the pattern"}
  ]
}

IMPORTANT for system_prompt_additions: PRIORITIZE suggestions that address recurring friction or repeated corrections seen in the data.
Include 2-3 items per section.`,

  interaction_style: `Analyze this AI assistant usage data and describe the user's interaction style.

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "narrative": "2-3 paragraphs analyzing HOW the user interacts with AI assistants. Use second person 'you'. Describe patterns: iterate quickly vs detailed upfront specs? Interrupt often or let AI run? Trust AI output or verify heavily? Include specific examples from the data. Use **bold** for key insights.",
  "key_pattern": "One sentence — the single most distinctive thing about how this user works with AI"
}`,

  at_a_glance: `You're writing an "At a Glance" summary for an AI assistant usage insights report.

Use this 4-part structure:
1. **What's working** — The user's effective patterns and biggest wins. High level, not fluffy.
2. **What's hindering** — Split: (a) AI's fault/limitations, (b) user-side friction. Honest and constructive.
3. **Quick wins to try** — 2-3 specific, immediately actionable changes.
4. **Ambitious workflows** — What becomes possible with better prompting or more AI trust in the next few months?

Keep each section 2-3 sentences. Coaching tone. No specific statistics.

Respond with A VALID JSON OBJECT only — no markdown, no explanation:
{
  "whats_working": "...",
  "whats_hindering": "...",
  "quick_wins": "...",
  "ambitious_workflows": "..."
}`,
};

/**
 * Get a prompt template by key.
 * @param {keyof typeof QUALITATIVE_PROMPTS} type
 * @returns {string}
 */
export function getQualitativePrompt(type) {
  const prompt = QUALITATIVE_PROMPTS[type];
  if (!prompt) throw new Error(`Unknown qualitative prompt type: "${type}"`);
  return prompt;
}
