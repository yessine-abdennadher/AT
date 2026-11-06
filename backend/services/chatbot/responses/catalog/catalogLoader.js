import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG_DIR = dirname(fileURLToPath(import.meta.url));
let cache = null;

/**
 * Charge tous les pools `catalog/<lang>/*.json` : { lang: { INTENT_KEY: [{id,text}] } }.
 */
export function loadResponseCatalog() {
  if (cache) return cache;
  const catalog = {};
  for (const lang of readdirSync(CATALOG_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
    catalog[lang] = {};
    for (const file of readdirSync(join(CATALOG_DIR, lang)).filter((f) => f.endsWith(".json"))) {
      const pool = JSON.parse(readFileSync(join(CATALOG_DIR, lang, file), "utf8"));
      for (const [key, variants] of Object.entries(pool)) {
        catalog[lang][key] = [...(catalog[lang][key] || []), ...variants];
      }
    }
  }
  cache = catalog;
  return catalog;
}

export const getStaticVariants = (lang, intentKey) => loadResponseCatalog()[lang]?.[intentKey] || [];

