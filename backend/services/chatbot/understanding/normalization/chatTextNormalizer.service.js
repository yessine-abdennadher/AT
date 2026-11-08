import { loadNormalizationCatalogs } from "./loaders/normalizationCatalog.loader.js";
import { normalizeArabicText, stripArabicProclitics } from "./arabicMorphology.service.js";
import { weightedDamerauLevenshtein } from "./fuzzy/weightedDamerauLevenshtein.js";

const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/;
const ARABIZI_TOKEN_REGEX = /\b([a-z]*[235789][a-z0-9]*|aslema|slm|salem|sbe7|sbah|lebas|labes|3aychek|aaychek|ya3tik|sa7a|saha|nheb|n7eb|nlawej|nchouf|kharja|5arja|nokhrej|nokhrjou|kahwa|9ahwa|9ahoua|mekla|ftour|3cha|mahloul|ma7loul|msaker|msakker|wa9tech|waktech|waqt|wa9t|rkhis|r5is|ghali|blassa|blasa|blayes|behia|behya|mzyena|mezyana|barcha|chwaya|choufi|fama|famma|famech|chnowa|chnoua|win|wine|chkoun|kifech|kifeh|brabi|brabbi|aychek|haka|tawa|taw|m3a|mte3|noumrou|noumro|b7ar|bhar)\b/i;
const ENGLISH_HINT_REGEX = /\b(hello|hi|where|looking|for|coffee|cheap|open|hours|menu|recommend|place|near|family)\b/i;

function collapseRepeatedChars(text) {
  return text.replace(/(.)\1{2,}/gu, "$1");
}

export function detectLanguage(rawText = "") {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) return "fr";
  if (ARABIC_SCRIPT_REGEX.test(trimmed)) return "ar";
  if (ARABIZI_TOKEN_REGEX.test(trimmed)) return "derja";
  if (ENGLISH_HINT_REGEX.test(trimmed) && !/\b(je|un|une|des|les|dans|avec|pour|bonjour|salut)\b/i.test(trimmed)) {
    return "en";
  }
  return "fr";
}

export function normalizeChatText(rawText = "") {
  const catalogs = loadNormalizationCatalogs();
  const originalText = String(rawText || "").trim();
  const detectedLanguage = detectLanguage(originalText);

  let text = originalText;

  // Prétraitement de la morphologie arabe si texte en caractères arabes
  if (detectedLanguage === "ar") {
    text = normalizeArabicText(text);
  } else {
    text = text
      .normalize("NFC")
      .toLowerCase()
      .replace(/['’`]/g, " ")
      .replace(/[^\p{L}\p{N}\s\-€$]/gu, " ");
  }

  text = collapseRepeatedChars(text).replace(/\s+/g, " ").trim();

  const appliedCorrections = [];

  // 1. Remplacement des expressions multi-mots en priorité (ex: "mouch 8ali", "en ws 7abi", "t9s berd")
  for (const [phrase, alias] of Object.entries(catalogs.fr.phraseAliases)) {
    if (text.includes(phrase)) {
      text = text.replaceAll(phrase, alias);
      appliedCorrections.push({ from: phrase, to: alias, type: "phrase_alias_pre" });
    }
  }

  const rawTokens = text ? text.split(" ") : [];

  const normalizedTokens = rawTokens.map((rawToken) => {
    let token = rawToken;

    if (detectedLanguage === "ar") {
      token = stripArabicProclitics(token);
    }

    if (catalogs.shared.immutableTokens.has(token)) {
      return token;
    }
    if (catalogs.arabizi.dictionary[token]) {
      const replacement = catalogs.arabizi.dictionary[token];
      appliedCorrections.push({ from: token, to: replacement, type: "arabizi" });
      return replacement;
    }
    if (catalogs.fr.typos[token]) {
      const replacement = catalogs.fr.typos[token];
      if (replacement !== token) {
        appliedCorrections.push({ from: token, to: replacement, type: "typo_fr" });
      }
      return replacement;
    }
    if (catalogs.en.typos[token]) {
      const replacement = catalogs.en.typos[token];
      appliedCorrections.push({ from: token, to: replacement, type: "typo_en" });
      return replacement;
    }

    // Correction floue pondérée par l'adjacence du clavier
    if (token.length >= 4 && !catalogs.fr.whitelist.has(token)) {
      for (const keyword of catalogs.fr.whitelist) {
        if (Math.abs(keyword.length - token.length) <= 1) {
          const dist = weightedDamerauLevenshtein(token, keyword);
          if (dist <= 1.0) {
            appliedCorrections.push({ from: token, to: keyword, type: "fuzzy_keyboard_domain", dist });
            return keyword;
          }
        }
      }
    }
    return token;
  });

  let normalizedText = normalizedTokens.join(" ").replace(/\s+/g, " ").trim();

  for (const [phrase, alias] of Object.entries(catalogs.fr.phraseAliases)) {
    if (normalizedText.includes(phrase)) {
      normalizedText = normalizedText.replaceAll(phrase, alias);
      appliedCorrections.push({ from: phrase, to: alias, type: "phrase_alias" });
    }
  }

  const detectedCities = [];
  const sortedCityAliases = Object.entries(catalogs.geo.citiesAliases).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonicalCity] of sortedCityAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
    if (regex.test(normalizedText)) {
      if (!detectedCities.includes(canonicalCity)) {
        detectedCities.push(canonicalCity);
      }
    }
  }

  const detectedNeighborhoods = [];
  if (catalogs.geo.sfaxNeighborhoods) {
    for (const entry of Object.values(catalogs.geo.sfaxNeighborhoods)) {
      for (const alias of entry.aliases || []) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
        if (regex.test(normalizedText) || regex.test(originalText)) {
          if (!detectedNeighborhoods.includes(entry.canonical)) {
            detectedNeighborhoods.push(entry.canonical);
          }
          if (!detectedCities.includes("Sfax")) {
            detectedCities.push("Sfax");
          }
          break;
        }
      }
    }
  }

  return {
    originalText,
    normalizedText,
    tokens: normalizedText ? normalizedText.split(" ") : [],
    detectedLanguage,
    detectedCities,
    detectedNeighborhoods,
    appliedCorrections,
  };
}
