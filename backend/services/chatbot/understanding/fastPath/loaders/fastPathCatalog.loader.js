import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOGS_DIR = join(__dirname, "..", "catalogs");

let cachedFastPath = null;

function readJson(relPath) {
  return JSON.parse(readFileSync(join(CATALOGS_DIR, relPath), "utf8"));
}

function stripDiacritics(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Table de correspondance Schema 1.0.0 -> contrat canonique KharjaBot.
 * Clé : `${domain}:${subIntent}`.
 * - canonicalIntent : intention du contrat `supportedIntentContract.json`.
 * - terminal : la règle peut court-circuiter les couches suivantes (sinon elle enrichit seulement les contraintes).
 * - constraints : facettes injectées dans `turnUnderstanding.constraints`.
 */
export const RULE_CANONICAL_MAP = Object.freeze({
  "PLACE_DISCOVERY:cafes": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { category: "cafe" } },
  "PLACE_DISCOVERY:restaurants": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { category: "restaurant" } },
  "PLACE_DISCOVERY:lounges": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { category: "cafe" } },
  "OUTING_PLANNING:with_friends": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { group: "friends" } },
  "BUDGET_AND_DEALS:maximum_budget": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { budgetLevel: "low" }, extractor: "maxBudget" },
  "LOCATION_AND_NAVIGATION:near_current_location": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { nearMe: true } },
  "ATMOSPHERE_AND_PREFERENCES:quiet": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { amenities: ["calme"] } },
  "AVAILABILITY_AND_HOURS:open_now": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: { situation: "open_now" } },
  "CONTACT_AND_RESERVATION:whatsapp": { canonicalIntent: "ASK_CONTACT_OR_SOCIAL", terminal: true, constraints: {} },
  "PERSONALIZED_RECOMMENDATION:personalized": { canonicalIntent: "DISCOVER_ACTIVITIES", constraints: {} },
  "CHAT_AND_ASSISTANCE:hello": { canonicalIntent: "GREETING", terminal: true, maxWords: 4, constraints: {} },
});

function compileRules(rulesDoc, supportedIntents) {
  if (!rulesDoc || rulesDoc.schemaVersion !== "1.0.0" || !Array.isArray(rulesDoc.rules)) return [];

  const compiled = [];
  for (const rule of rulesDoc.rules) {
    if (rule.status !== "active" || !Array.isArray(rule.patterns)) continue;
    const mapping = RULE_CANONICAL_MAP[`${rule.domain}:${rule.subIntent}`];
    if (!mapping || !supportedIntents.has(mapping.canonicalIntent)) continue;

    const regexes = [];
    rule.patterns.forEach((pattern, idx) => {
      try {
        regexes.push(new RegExp(pattern, rule.patternFlags?.[idx] || "i"));
      } catch {
        // Pattern invalide ignoré : ne bloque jamais le chargement du catalogue.
      }
    });
    if (!regexes.length) continue;

    compiled.push(
      Object.freeze({
        id: rule.id,
        domain: rule.domain,
        intent: rule.intent,
        subIntent: rule.subIntent,
        category: rule.category,
        subcategory: rule.subcategory,
        confidence: rule.confidence ?? 0.9,
        priority: rule.priority ?? 0,
        canonicalIntent: mapping.canonicalIntent,
        terminal: Boolean(mapping.terminal),
        maxWords: mapping.maxWords ?? null,
        extractor: mapping.extractor ?? null,
        constraints: mapping.constraints,
        regexes,
      })
    );
  }

  return compiled.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
}

export function loadFastPathCatalogs() {
  if (cachedFastPath) return cachedFastPath;

  const supportedIntents = new Set(readJson("supportedIntentContract.json"));
  const exactLookup = new Map();

  const registerCatalog = (catalog, lang) => {
    if (!catalog) return;
    for (const [intent, phrases] of Object.entries(catalog)) {
      if (!supportedIntents.has(intent)) continue;
      for (const phrase of phrases) {
        const key = stripDiacritics(phrase);
        if (!exactLookup.has(key)) {
          exactLookup.set(key, { intent, lang, matchedPhrase: phrase });
        }
      }
    }
  };

  registerCatalog(readJson("fr/common.json"), "fr");
  registerCatalog(readJson("fr/discovery.json"), "fr");
  registerCatalog(readJson("fr/partner.json"), "fr");
  registerCatalog(readJson("ar/common.json"), "ar");
  registerCatalog(readJson("en/common.json"), "en");
  registerCatalog(readJson("derja/common.json"), "derja");

  const compiledRules = compileRules(readJson("rules/intentRules.v1.json"), supportedIntents);

  cachedFastPath = Object.freeze({
    supportedIntents,
    exactLookup,
    compiledRules,
  });

  return cachedFastPath;
}
