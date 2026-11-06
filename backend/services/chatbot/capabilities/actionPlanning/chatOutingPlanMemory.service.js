export const savePlan = (state, steps) => ({
  ...state,
  plan: { steps: steps.map(({ activity, ...rest }) => rest), updatedAt: new Date().toISOString() },
});

export const clearPlan = (state) => ({ ...state, plan: null });

