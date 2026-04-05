/**
 * prepareCommonData
 *
 * Builds the shared context block that is appended to every qualitative
 * prompt. Mirrors Qwen's DataProcessor.prepareCommonPromptData() exactly.
 *
 * Structure:
 *   DATA: { aggregated stats as JSON }
 *   SESSION SUMMARIES: bullet list of brief_summary per facet
 *   FRICTION DETAILS: bullet list of friction_detail per facet (non-empty only)
 *   USER INSTRUCTIONS TO AI: placeholder
 *
 * @param {object} metrics    - MetricsData from generateMetrics()
 * @param {object[]} facets   - SessionFacets[] from analyzeAllSessions()
 * @returns {string}
 */
export function prepareCommonData(metrics, facets) {
  // ── Re-aggregate from facets (same as Qwen) ──────────────────────────────
  const goalsAgg = {};
  const outcomesAgg = {};
  const satisfactionAgg = {};
  const frictionAgg = {};
  const successAgg = {};

  for (const facet of facets) {
    // goals
    for (const [k, v] of Object.entries(facet.goal_categories || {})) {
      goalsAgg[k] = (goalsAgg[k] || 0) + v;
    }
    // outcomes
    if (facet.outcome) {
      outcomesAgg[facet.outcome] = (outcomesAgg[facet.outcome] || 0) + 1;
    }
    // satisfaction
    for (const [k, v] of Object.entries(facet.user_satisfaction_counts || {})) {
      satisfactionAgg[k] = (satisfactionAgg[k] || 0) + v;
    }
    // friction
    for (const [k, v] of Object.entries(facet.friction_counts || {})) {
      frictionAgg[k] = (frictionAgg[k] || 0) + v;
    }
    // primary success
    if (facet.primary_success && facet.primary_success !== 'none') {
      successAgg[facet.primary_success] = (successAgg[facet.primary_success] || 0) + 1;
    }
  }

  // Top 8 goals sorted by count
  const topGoals = Object.entries(goalsAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // ── Build DATA object ────────────────────────────────────────────────────
  const heatmapKeys = Object.keys(metrics.heatmap).sort();
  const dataObj = {
    sessions: metrics.totalSessions,
    analyzed: facets.length,
    date_range: {
      start: heatmapKeys[0] || 'N/A',
      end: heatmapKeys[heatmapKeys.length - 1] || 'N/A',
    },
    messages: metrics.totalMessages,
    hours: metrics.totalHours,
    top_tools: metrics.topTools,
    top_goals: topGoals,
    outcomes: outcomesAgg,
    satisfaction: satisfactionAgg,
    friction: frictionAgg,
    success: successAgg,
  };

  // ── Session summaries ────────────────────────────────────────────────────
  const sessionSummaries = facets
    .map((f) => `- ${f.brief_summary}`)
    .join('\n');

  // ── Friction details (non-empty only) ────────────────────────────────────
  const frictionDetails = facets
    .filter((f) => f.friction_detail && f.friction_detail.trim().length > 0)
    .map((f) => `- ${f.friction_detail}`)
    .join('\n');

  return `DATA:
${JSON.stringify(dataObj, null, 2)}

SESSION SUMMARIES:
${sessionSummaries || '- No sessions analyzed'}

FRICTION DETAILS:
${frictionDetails || '- No friction reported'}

USER INSTRUCTIONS TO AI:
None captured`;
}
