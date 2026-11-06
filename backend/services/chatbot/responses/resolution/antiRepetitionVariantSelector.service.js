import { canInterpolate } from "./variableInterpolator.service.js";

/**
 * Choisit une variante utilisable, en privilégiant celles non servies récemment.
 */
export function selectVariant({ variants, vars, recentVariantIds = [], rng = Math.random }) {
  const usable = variants.filter((v) => canInterpolate(v.text, vars));
  if (!usable.length) return null;
  const unseen = usable.filter((v) => !recentVariantIds.includes(v.id));
  if (unseen.length) return unseen[Math.floor(rng() * unseen.length)];
  const lastSeen = (v) => recentVariantIds.lastIndexOf(v.id);
  return [...usable].sort((a, b) => lastSeen(a) - lastSeen(b))[0];
}

