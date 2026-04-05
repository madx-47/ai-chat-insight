/**
 * Types / schema documentation for the AI Chat Insight System.
 * JavaScript doesn't enforce these at runtime, but they serve as the
 * canonical reference for every object shape used in this project.
 *
 * ChatRecord — one line from a .jsonl session file
 * @typedef {{
 *   uuid: string,
 *   parentUuid: string|null,
 *   sessionId: string,
 *   timestamp: string,           // ISO-8601
 *   type: 'user'|'assistant'|'system'|'tool_result',
 *   cwd?: string,
 *   version?: string,
 *   gitBranch?: string,
 *
 *   // type === 'user' | 'tool_result'
 *   message?: {
 *     role: string,
 *     parts: Array<{text?:string, functionResponse?:object}>
 *   },
 *
 *   // type === 'assistant'
 *   model?: string,
 *   // message.parts may also contain { functionCall, thought }
 *
 *   // type === 'system'
 *   subtype?: string,
 *   systemPayload?: object,
 *
 *   // type === 'tool_result'
 *   toolCallResult?: {
 *     callId: string,
 *     status: 'success'|'error',
 *     resultDisplay: string|object
 *   }
 * }} ChatRecord
 *
 * SessionMeta — computed locally, no LLM
 * @typedef {{
 *   session_id: string,
 *   record_count: number,
 *   start_time: string,
 *   end_time: string,
 *   duration_minutes: number,
 *   message_count: number,
 *   tool_calls: string[]           // unique tool names used
 * }} SessionMeta
 *
 * SessionFacets — LLM output for one session
 * @typedef {{
 *   session_id: string,
 *   underlying_goal: string,
 *   goal_categories: Record<string,number>,
 *   outcome: 'fully_achieved'|'mostly_achieved'|'partially_achieved'|'not_achieved'|'unclear_from_transcript',
 *   user_satisfaction_counts: Record<string,number>,
 *   ai_helpfulness: 'unhelpful'|'slightly_helpful'|'moderately_helpful'|'very_helpful'|'essential',
 *   session_type: 'single_task'|'multi_task'|'iterative_refinement'|'exploration'|'quick_question',
 *   friction_counts: Record<string,number>,
 *   friction_detail: string,
 *   primary_success: 'none'|'fast_accurate_search'|'correct_code_edits'|'good_explanations'|'proactive_help'|'multi_file_changes'|'good_debugging',
 *   brief_summary: string
 * }} SessionFacets
 *
 * AggregatedData — rolled up from all facets
 * @typedef {{
 *   satisfactionAgg: Record<string,number>,
 *   frictionAgg: Record<string,number>,
 *   primarySuccessAgg: Record<string,number>,
 *   outcomesAgg: Record<string,number>,
 *   goalsAgg: Record<string,number>
 * }} AggregatedData
 *
 * MetricsData — pure stats, no LLM
 * @typedef {{
 *   totalSessions: number,
 *   totalMessages: number,
 *   totalHours: number,
 *   heatmap: Record<string,number>,
 *   activeHours: Record<string,number>,
 *   currentStreak: number,
 *   longestStreak: number,
 *   longestWorkDuration: number,
 *   longestWorkDate: string|null,
 *   topTools: Array<[string,number]>,
 *   totalLinesAdded: number,
 *   totalLinesRemoved: number,
 *   totalFiles: number
 * }} MetricsData
 *
 * InsightData — final output written to insight.json
 * @typedef {{
 *   generatedAt: string,
 *   sourceFile: string,
 *   metrics: MetricsData,
 *   sessions: SessionMeta[],
 *   facets: SessionFacets[],
 *   aggregated: AggregatedData,
 *   qualitative: null
 * }} InsightData
 */

// Enums used as validation references
export const OUTCOME_VALUES = [
  'fully_achieved',
  'mostly_achieved',
  'partially_achieved',
  'not_achieved',
  'unclear_from_transcript',
];

export const AI_HELPFULNESS_VALUES = [
  'unhelpful',
  'slightly_helpful',
  'moderately_helpful',
  'very_helpful',
  'essential',
];

export const SESSION_TYPE_VALUES = [
  'single_task',
  'multi_task',
  'iterative_refinement',
  'exploration',
  'quick_question',
];

export const PRIMARY_SUCCESS_VALUES = [
  'none',
  'fast_accurate_search',
  'correct_code_edits',
  'good_explanations',
  'proactive_help',
  'multi_file_changes',
  'good_debugging',
];

// JSON schema passed to Claude for structured output
export const SESSION_FACETS_SCHEMA = {
  type: 'object',
  properties: {
    underlying_goal: {
      type: 'string',
      description: 'What the user fundamentally wanted to achieve in this session',
    },
    goal_categories: {
      type: 'object',
      description: 'Free-form category labels mapped to occurrence counts, e.g. {"debugging": 2, "learning": 1}',
      additionalProperties: { type: 'number' },
    },
    outcome: {
      type: 'string',
      enum: OUTCOME_VALUES,
    },
    user_satisfaction_counts: {
      type: 'object',
      description: 'Signals of user satisfaction, e.g. {"satisfied": 2, "frustrated": 1}',
      additionalProperties: { type: 'number' },
    },
    ai_helpfulness: {
      type: 'string',
      enum: AI_HELPFULNESS_VALUES,
    },
    session_type: {
      type: 'string',
      enum: SESSION_TYPE_VALUES,
    },
    friction_counts: {
      type: 'object',
      description: 'Friction patterns and how often they appeared, e.g. {"misunderstood_intent": 1}. Use "none" if no friction.',
      additionalProperties: { type: 'number' },
    },
    friction_detail: {
      type: 'string',
      description: 'One sentence describing the main friction point, or empty string if none',
    },
    primary_success: {
      type: 'string',
      enum: PRIMARY_SUCCESS_VALUES,
    },
    brief_summary: {
      type: 'string',
      description: 'One sentence: what the user wanted and whether they got it',
    },
  },
  required: [
    'underlying_goal',
    'goal_categories',
    'outcome',
    'user_satisfaction_counts',
    'ai_helpfulness',
    'session_type',
    'friction_counts',
    'friction_detail',
    'primary_success',
    'brief_summary',
  ],
};
