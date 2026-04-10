/**
 * TemplateRenderer — equivalent to Qwen's TemplateRenderer.ts
 * Normalizes our insight.json shape and produces a self-contained HTML string.
 */

/**
 * Normalize our insight.json into the flat shape the HTML template expects.
 * Maps nested `metrics.*` and `aggregated.*` to top-level keys, and
 * remaps snake_case qualitative keys to camelCase.
 */
function normalizeInsightData(data) {
  const m = data.metrics || {};
  const agg = data.aggregated || {};
  const q = data.qualitative || null;

  // Remap qualitative keys snake_case → camelCase
  let qualitative = null;
  if (q) {
    qualitative = {
      impressiveWorkflows: q.impressive_workflows ?? null,
      projectAreas: q.project_areas ?? null,
      futureOpportunities: q.future_opportunities ?? null,
      frictionPoints: q.friction_points ?? null,
      memorableMoment: q.memorable_moment ?? null,
      improvements: q.improvements ?? null,
      interactionStyle: q.interaction_style ?? null,
      atAGlance: q.at_a_glance ?? null,
    };
  }

  // topTools: our metrics stores it as array of [name, count]. Keep that.
  const topTools = m.topTools || [];
  // Convert array of tuples to object for charts
  const topToolsObj = Array.isArray(topTools)
    ? Object.fromEntries(topTools)
    : topTools;

  return {
    generatedAt: data.generatedAt,
    // Flat metrics
    totalSessions: m.totalSessions ?? 0,
    totalMessages: m.totalMessages ?? 0,
    totalHours: m.totalHours ?? 0,
    heatmap: m.heatmap ?? {},
    activeHours: m.activeHours ?? {},
    currentStreak: m.currentStreak ?? 0,
    longestStreak: m.longestStreak ?? 0,
    longestWorkDate: m.longestWorkDate ?? null,
    longestWorkDuration: m.longestWorkDuration ?? 0,
    topTools: topToolsObj,
    totalLinesAdded: m.totalLinesAdded ?? 0,
    totalLinesRemoved: m.totalLinesRemoved ?? 0,
    totalFiles: m.totalFiles ?? 0,
    // Aggregated (flat)
    satisfaction: agg.satisfactionAgg ?? {},
    friction: agg.frictionAgg ?? {},
    primarySuccess: agg.primarySuccessAgg ?? {},
    outcomes: agg.outcomesAgg ?? {},
    topGoals: agg.goalsAgg ?? {},
    // Per-session data (with type-safe array guards)
    facets: Array.isArray(data.facets) ? data.facets : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    // Qualitative
    qualitative,
  };
}

export class TemplateRenderer {
  /**
   * renderInsightHTML(insightData)
   * Equivalent to Qwen's TemplateRenderer.renderInsightHTML().
   * Takes our raw insight.json object and returns the full HTML string.
   */
  async renderInsightHTML(insightData) {
    const normalized = normalizeInsightData(insightData);
    const { getInsightCSS, getInsightJS } = await import('./insight-template.js');

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Chat Insights</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      ${getInsightCSS()}
    </style>
  </head>
  <body>
    <div class="min-h-screen" id="container">
      <div class="mx-auto max-w-6xl px-6 py-10">
        <div id="react-root"></div>
      </div>
    </div>

    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

    <script>
      window.INSIGHT_DATA = ${JSON.stringify(normalized)};
    </script>

    <script>
      ${getInsightJS()}
    </script>
  </body>
</html>`;
  }
}