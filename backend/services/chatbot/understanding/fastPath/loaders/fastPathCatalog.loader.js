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

export function loadFastPathCatalogs() {
  if (cachedFastPath) return cachedFastPath;

  const supportedIntents = new Set(readJson("supportedIntentContract.json"));
  const frMerged = {
    ...readJson("fr/common.json"),
    ...readJson("fr/discovery.json"),
    ...readJson("fr/partner.json"),
  };
  const arMerged = readJson("ar/common.json");
  const enMerged = readJson("en/common.json");
  const derjaMerged = readJson("derja/common.json");

  const exactLookup = new Map();

  const registerCatalog = (catalog, lang) => {
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

  registerCatalog(frMerged, "fr");
  registerCatalog(arMerged, "ar");
  registerCatalog(enMerged, "en");
  registerCatalog(derjaMerged, "derja");

  cachedFastPath = Object.freeze({
    supportedIntents,
    exactLookup,
  });

  return cachedFastPath;
}

