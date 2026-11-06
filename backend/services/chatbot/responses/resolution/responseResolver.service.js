import { getStaticVariants } from "../catalog/catalogLoader.js";
import { dynamicResponseStore } from "../dynamicPool/dynamicResponseStore.service.js";
import { recordPoolUse, shouldExpandPool } from "../dynamicPool/responseUsageTracker.service.js";
import { expandResponsePool } from "../dynamicPool/llmVariantGenerator.service.js";
import { selectVariant } from "./antiRepetitionVariantSelector.service.js";
import { interpolate } from "./variableInterpolator.service.js";

function poolFor(intentKey, lang) {
  const stat = getStaticVariants(lang, intentKey);
  return { stat, all: [...stat, ...dynamicResponseStore.get(intentKey, lang)] };
}

/**
 * Résout un texte : choisit la variante, interpole, compte l'usage et déclenche
 * (en arrière-plan) l'expansion du pool dès 3 utilisations.
 */
export function resolveResponse({ intentKey, lang = "fr", vars = {}, recentVariantIds = [], rng, expander = expandResponsePool }) {
  let usedLang = lang;
  let pool = poolFor(intentKey, usedLang);
  if (!pool.all.length) { usedLang = "fr"; pool = poolFor(intentKey, usedLang); }

  const variant = selectVariant({ variants: pool.all, vars, recentVariantIds, rng });
  if (!variant) return null;

  const usageCount = recordPoolUse(intentKey, usedLang);
  if (shouldExpandPool(usageCount, intentKey, usedLang)) {
    void expander({ intentKey, lang: usedLang, staticVariants: pool.stat });
  }
  return { text: interpolate(variant.text, vars), variantId: variant.id, intentKey, lang: usedLang, usageCount };
}

