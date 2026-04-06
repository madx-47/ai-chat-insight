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

  const addCounts = (target, source = {}) => {
    for (const [key, count] of Object.entries(source)) {
      target[key] = (target[key] || 0) + count;
    }
  };

  const increment = (target, key) => {
    target[key] = (target[key] || 0) + 1;
  };

  for (const facet of facets) {
    addCounts(satisfactionAgg, facet.user_satisfaction_counts);
    addCounts(frictionAgg, facet.friction_counts);

    // Primary success (skip 'none')
    if (facet.primary_success && facet.primary_success !== 'none') {
      increment(primarySuccessAgg, facet.primary_success);
    }

    // Outcomes
    if (facet.outcome) {
      increment(outcomesAgg, facet.outcome);
    }

    addCounts(goalsAgg, facet.goal_categories);
  }

  return {
    satisfactionAgg,
    frictionAgg,
    primarySuccessAgg,
    outcomesAgg,
    goalsAgg,
  };
}
