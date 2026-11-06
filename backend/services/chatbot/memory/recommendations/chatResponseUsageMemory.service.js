const MAX_RECENT = 12;
export const usageKey = (intentKey, lang) => `${intentKey}:${lang}`;

export function recordResponseUsage(state, { intentKey, lang, variantId }) {
  const key = usageKey(intentKey, lang);
  const usage = state.responseUsage || { counts: {}, recentVariantIds: [] };
  return {
    ...state,
    responseUsage: {
      counts: { ...usage.counts, [key]: (usage.counts[key] || 0) + 1 },
      recentVariantIds: [...usage.recentVariantIds, variantId].slice(-MAX_RECENT),
    },
  };
}

export const sessionUsageCount = (state, intentKey, lang) => state.responseUsage?.counts?.[usageKey(intentKey, lang)] || 0;

