import { dynamicResponseStore } from "./dynamicResponseStore.service.js";

export const EXPANSION_THRESHOLD = 3;
const counters = new Map();

/**
 * Compteur global d'utilisation par couple (intent, langue).
 */
export function recordPoolUse(intentKey, lang) {
  const k = `${intentKey}:${lang}`;
  const next = (counters.get(k) || 0) + 1;
  counters.set(k, next);
  return next;
}

/**
 * Règle d'expansion : dès 3 utilisations, puis tous les 3 usages tant que le pool dynamique n'est pas plein.
 */
export function shouldExpandPool(usageCount, intentKey, lang) {
  return usageCount >= EXPANSION_THRESHOLD
    && usageCount % EXPANSION_THRESHOLD === 0
    && dynamicResponseStore.get(intentKey, lang).length < dynamicResponseStore.limit;
}

export const resetUsageCounters = () => counters.clear();

