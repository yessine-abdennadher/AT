import { loadFastPathCatalogs } from "./loaders/fastPathCatalog.loader.js";

function stripDiacritics(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const BUDGET_AMOUNT_REGEX = /(\d+(?:[.,]\d+)?)\s*(?:dt|tnd|dinars?|دينار|دنانير)/i;

function extractMaxBudget(texts) {
  for (const text of texts) {
    const m = BUDGET_AMOUNT_REGEX.exec(text || "");
    if (m) {
      const value = Number(m[1].replace(",", "."));
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return null;
}

const wordCount = (text = "") => String(text).trim().split(/\s+/).filter(Boolean).length;

/**
 * Passe 1B : règles déclaratives Schema 1.0.0 (RegExp pré-compilées, triées par priority DESC puis confidence DESC).
 * Retourne toutes les règles déclenchées + les contraintes agrégées.
 */
function matchCompiledRules({ originalText, normalizedText, compiledRules }) {
  const texts = [originalText, normalizedText].filter(Boolean);
  const hits = [];

  for (const rule of compiledRules) {
    const matched = texts.some((text) => rule.regexes.some((rx) => rx.test(text)));
    if (matched) hits.push(rule);
  }
  if (!hits.length) return null;

  const constraints = { amenities: [] };
  for (const rule of hits) {
    const c = rule.constraints || {};
    if (c.category && !constraints.category) constraints.category = c.category;
    if (c.group && !constraints.group) constraints.group = c.group;
    if (c.budgetLevel && !constraints.budgetLevel) constraints.budgetLevel = c.budgetLevel;
    if (c.nearMe) constraints.nearMe = true;
    if (c.situation && !constraints.situation) constraints.situation = c.situation;
    if (c.amenities?.length) constraints.amenities.push(...c.amenities);
    if (rule.extractor === "maxBudget") {
      const maxBudget = extractMaxBudget(texts);
      if (maxBudget !== null) constraints.maxBudget = maxBudget;
    }
  }
  constraints.amenities = [...new Set(constraints.amenities)];

  const primary = hits[0];
  const words = wordCount(originalText || normalizedText);
  const terminal = primary.terminal && (primary.maxWords === null || words <= primary.maxWords);

  return {
    primary,
    hits,
    constraints,
    terminal,
    ruleMetadata: {
      ruleId: primary.id,
      domain: primary.domain,
      intent: primary.intent,
      subIntent: primary.subIntent,
      category: primary.category,
      subcategory: primary.subcategory,
      matchedRuleIds: hits.map((r) => r.id),
    },
  };
}

export function matchFastPath({ normalizedText = "", originalText = "" } = {}) {
  const { exactLookup, compiledRules } = loadFastPathCatalogs();
  const candidates = [stripDiacritics(normalizedText), stripDiacritics(originalText)].filter(Boolean);

  // Passe 1A : Exact Lookup O(1)
  for (const candidate of candidates) {
    const hit = exactLookup.get(candidate);
    if (hit) {
      return {
        matched: true,
        intent: hit.intent,
        lang: hit.lang,
        confidence: 0.99,
        source: "fastPath",
        matchedPhrase: hit.matchedPhrase,
      };
    }
  }

  // Passe 1B : règles déclaratives Schema 1.0.0
  const ruleResult = matchCompiledRules({ originalText, normalizedText, compiledRules });
  if (ruleResult) {
    const { primary, constraints, terminal, ruleMetadata } = ruleResult;
    return {
      // `matched` ne court-circuite les couches suivantes que pour les règles terminales
      // (ex. contact WhatsApp, salutation courte). Les règles de découverte enrichissent
      // seulement les contraintes pour ne pas casser la détection multi-étapes.
      matched: terminal,
      intent: terminal ? primary.canonicalIntent : null,
      confidence: terminal ? primary.confidence : 0,
      source: "fastPath_rule",
      matchedPhrase: null,
      ruleMatched: true,
      ruleIntent: primary.canonicalIntent,
      ruleConfidence: primary.confidence,
      ruleMetadata,
      ruleConstraints: constraints,
    };
  }

  return {
    matched: false,
    intent: null,
    confidence: 0,
    source: "fastPath",
    matchedPhrase: null,
  };
}
