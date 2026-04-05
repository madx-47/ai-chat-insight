/**
 * JSON schemas for qualitative insight sections.
 * Used for Claude's tool_use and for validation/parsing in other providers.
 * Matches Qwen's DataProcessor.ts schema definitions exactly.
 */

export const QUALITATIVE_SCHEMAS = {

  impressive_workflows: {
    type: 'object',
    properties: {
      intro: { type: 'string' },
      impressive_workflows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['title', 'description'],
        },
      },
    },
    required: ['intro', 'impressive_workflows'],
  },

  project_areas: {
    type: 'object',
    properties: {
      areas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            session_count: { type: 'number' },
            description: { type: 'string' },
          },
          required: ['name', 'session_count', 'description'],
        },
      },
    },
    required: ['areas'],
  },

  future_opportunities: {
    type: 'object',
    properties: {
      intro: { type: 'string' },
      opportunities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            whats_possible: { type: 'string' },
            how_to_try: { type: 'string' },
            copyable_prompt: { type: 'string' },
          },
          required: ['title', 'whats_possible', 'how_to_try', 'copyable_prompt'],
        },
      },
    },
    required: ['intro', 'opportunities'],
  },

  friction_points: {
    type: 'object',
    properties: {
      intro: { type: 'string' },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            description: { type: 'string' },
            examples: { type: 'array', items: { type: 'string' } },
          },
          required: ['category', 'description', 'examples'],
        },
      },
    },
    required: ['intro', 'categories'],
  },

  memorable_moment: {
    type: 'object',
    properties: {
      headline: { type: 'string' },
      detail: { type: 'string' },
    },
    required: ['headline', 'detail'],
  },

  improvements: {
    type: 'object',
    properties: {
      system_prompt_additions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            addition: { type: 'string' },
            why: { type: 'string' },
            prompt_scaffold: { type: 'string' },
          },
          required: ['addition', 'why', 'prompt_scaffold'],
        },
      },
      features_to_try: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            feature: { type: 'string' },
            one_liner: { type: 'string' },
            why_for_you: { type: 'string' },
            example: { type: 'string' },
          },
          required: ['feature', 'one_liner', 'why_for_you', 'example'],
        },
      },
      usage_patterns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            suggestion: { type: 'string' },
            detail: { type: 'string' },
            copyable_prompt: { type: 'string' },
          },
          required: ['title', 'suggestion', 'detail', 'copyable_prompt'],
        },
      },
    },
    required: ['system_prompt_additions', 'features_to_try', 'usage_patterns'],
  },

  interaction_style: {
    type: 'object',
    properties: {
      narrative: { type: 'string' },
      key_pattern: { type: 'string' },
    },
    required: ['narrative', 'key_pattern'],
  },

  at_a_glance: {
    type: 'object',
    properties: {
      whats_working: { type: 'string' },
      whats_hindering: { type: 'string' },
      quick_wins: { type: 'string' },
      ambitious_workflows: { type: 'string' },
    },
    required: ['whats_working', 'whats_hindering', 'quick_wins', 'ambitious_workflows'],
  },
};
