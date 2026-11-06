import { loadFastPathCatalogs } from "./loaders/fastPathCatalog.loader.js";

function stripDiacritics(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchFastPath({ normalizedText = "", originalText = "" } = {}) {
  const { exactLookup } = loadFastPathCatalogs();
  const candidates = [stripDiacritics(normalizedText), stripDiacritics(originalText)].filter(Boolean);

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

  return {
    matched: false,
    intent: null,
    confidence: 0,
    source: "fastPath",
    matchedPhrase: null,
  };
}

