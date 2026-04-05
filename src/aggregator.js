/**
 * aggregateFacets — Layer 3 of the pipeline.
 * Pure math over SessionFacets[]. No LLM calls.
 * Produces AggregatedData for use in the dashboard and (later) qualitative LLM layer.
 *
 * @param {object[]} facets - array of SessionFacets
 * @returns {import('./types.js').AggregatedData}
 */
export function aggregateFacets(facets) {
  const satisfactionAgg = {};
  const frictionAgg = {};
  const primarySuccessAgg = {};
  const outcomesAgg = {};
  const goalsAgg = {};

  for (const facet of facets) {
    // Satisfaction
    for (const [key, count] of Object.entries(facet.user_satisfaction_counts || {})) {
      satisfactionAgg[key] = (satisfactionAgg[key] || 0) + count;
    }

    // Friction
    for (const [key, count] of Object.entries(facet.friction_counts || {})) {
      frictionAgg[key] = (frictionAgg[key] || 0) + count;
    }

    // Primary success (skip 'none')
    if (facet.primary_success && facet.primary_success !== 'none') {
      primarySuccessAgg[facet.primary_success] =
        (primarySuccessAgg[facet.primary_success] || 0) + 1;
    }

    // Outcomes
    if (facet.outcome) {
      outcomesAgg[facet.outcome] = (outcomesAgg[facet.outcome] || 0) + 1;
    }

    // Goals
    for (const [key, count] of Object.entries(facet.goal_categories || {})) {
      goalsAgg[key] = (goalsAgg[key] || 0) + count;
    }
  }

  return {
    satisfactionAgg,
    frictionAgg,
    primarySuccessAgg,
    outcomesAgg,
    goalsAgg,
  };
}
