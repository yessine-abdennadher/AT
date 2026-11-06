import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOGS_DIR = join(__dirname, "..", "catalogs");

let cachedCatalogs = null;

function readJson(relativePath) {
  const fullPath = join(CATALOGS_DIR, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf8"));
}

export function loadNormalizationCatalogs() {
  if (cachedCatalogs) {
    return cachedCatalogs;
  }

  cachedCatalogs = Object.freeze({
    fr: {
      typos: readJson("fr/typoDictionary.json"),
      phraseAliases: readJson("fr/phraseAliases.json"),
      whitelist: new Set(readJson("fr/domainKeywordsWhitelist.json")),
    },
    en: {
      typos: readJson("en/typoDictionary.json"),
    },
    arabizi: {
      dictionary: readJson("arabizi/tunisianDerjaDictionary.json"),
    },
    geo: {
      citiesAliases: readJson("geo/tunisiaCitiesAliases.json"),
    },
    shared: {
      immutableTokens: new Set(readJson("shared/immutableTokens.json")),
    },
  });

  return cachedCatalogs;
}

