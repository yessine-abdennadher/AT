import { loadNormalizationCatalogs } from "./loaders/normalizationCatalog.loader.js";
import { normalizeArabicText, stripArabicProclitics } from "./arabicMorphology.service.js";
import { weightedDamerauLevenshtein } from "./fuzzy/weightedDamerauLevenshtein.js";

const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/;
const ARABIZI_TOKEN_REGEX = /\b([a-z]*[235789][a-z0-9]*|aslema|slm|salem|sbe7|sbah|lebas|labes|3aychek|aaychek|ya3tik|sa7a|saha|nheb|n7eb|nlawej|nchouf|kharja|5arja|nokhrej|nokhrjou|nkharej|netfarhed|kahwa|9ahwa|9ahoua|mekla|ftour|3cha|net3acha|mahloul|ma7loul|msaker|msakker|wa9tech|waktech|waqt|wa9t|rkhis|r5is|ghali|ghaliya|blassa|blasa|blayes|behia|behya|mzyena|mezyana|barcha|chwaya|choufi|fama|famma|famech|chnowa|chnoua|win|wine|chkoun|kifech|kifeh|brabi|brabbi|aychek|haka|tawa|taw|twa|njm|najem|najjem|n5rej|no5rej|nekhrej|nekherj|o5ra|okhra|m3a|mte3|noumrou|noumro|b7ar|bhar|m7ayer|suggestli)\b/i;
const ENGLISH_HINT_REGEX = /\b(hello|hi|where|what|which|looking|for|coffee|cheap|cheapest|open|hours|menu|recommend|suggest|give|find|place|places|near|family|prefer|usually|today|want|only|have|can|does|is|are|there|best|top|compare|pick|surprise|based|outing|outings|activity|activities|friends|girlfriend|partner|quiet|nice|good|eat|seafood|budget|dinars|tnd|free|karting|bowling|cycling|sport|outdoor|beach|sunset|picnic|nature|photos|music|peaceful|lively|classy|crowded|sunday|late|promotions|deals|discount|student|wifi|parking|manager|book|table|bored|raining|hot|something|thanks|perfect|pretend|fake|forget)\b/i;

function collapseRepeatedChars(text) {
  return text.replace(/(.)\1{2,}/gu, "$1");
}

export function detectLanguage(rawText = "") {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) return "fr";
  if (ARABIC_SCRIPT_REGEX.test(trimmed)) return "ar";
  if (ARABIZI_TOKEN_REGEX.test(trimmed)) return "derja";
  if (
    ENGLISH_HINT_REGEX.test(trimmed) &&
    !/\b(je|tu|il|elle|on|nous|vous|un|une|des|les|dans|avec|pour|bonjour|salut|quel|quelle|quels|quelles|est-ce|où|mais|pas|plus|moins|très|trop)\b/i.test(trimmed)
  ) {
    return "en";
  }
  return "fr";
}

export function detectAradarja(normalizedArabicText = "", catalogs = null) {
  if (!ARABIC_SCRIPT_REGEX.test(normalizedArabicText)) return false;
  const cats = catalogs || loadNormalizationCatalogs();
  const aradarjaDict = cats.aradarja || { tokens: {}, phrases: {} };
  const tokens = normalizedArabicText.split(/\s+/);
  for (const t of tokens) {
    if (aradarjaDict.tokens && aradarjaDict.tokens[t]) return true;
  }
  for (const phrase of Object.keys(aradarjaDict.phrases || {})) {
    if (normalizedArabicText.includes(phrase)) return true;
  }
  return false;
}

export function normalizeChatText(rawText = "") {
  const catalogs = loadNormalizationCatalogs();
  const originalText = String(rawText || "").trim();
  const detectedLanguage = detectLanguage(originalText);

  let text = originalText;

  // Prétraitement de la morphologie arabe (MSA & Aradarja) si texte contenant des caractères arabes
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

    // Correction floue pondérée par l'adjacence du clavier (uniquement sur tokens latins)
    if (token.length >= 4 && !ARABIC_SCRIPT_REGEX.test(token) && !catalogs.fr.whitelist.has(token)) {
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

  const isAradarja = detectAradarja(normalizedText, catalogs);

  const cleanOriginal = normalizeArabicText(originalText)
    .toLowerCase()
    .replace(/[^\p{Script=Arabic}\p{L}\p{N}\s\-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const detectedCities = [];
  const sortedCityAliases = Object.entries(catalogs.geo.citiesAliases).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonicalCity] of sortedCityAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
    if (regex.test(normalizedText) || regex.test(cleanOriginal)) {
      if (!detectedCities.includes(canonicalCity)) {
        detectedCities.push(canonicalCity);
      }
    }
  }

  const neighborhoodMatches = [];
  if (catalogs.geo.sfaxNeighborhoods) {
    for (const entry of Object.values(catalogs.geo.sfaxNeighborhoods)) {
      let bestPos = -1;
      for (const alias of entry.aliases || []) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "i");
        const m1 = regex.exec(normalizedText);
        const m2 = regex.exec(cleanOriginal);
        const pos = m1 ? m1.index : (m2 ? m2.index : -1);
        if (pos !== -1 && (bestPos === -1 || pos < bestPos)) {
          bestPos = pos;
        }
      }
      if (bestPos !== -1) {
        neighborhoodMatches.push({ canonical: entry.canonical, pos: bestPos });
        if (!detectedCities.includes("Sfax")) {
          detectedCities.push("Sfax");
        }
      }
    }
  }
  const detectedNeighborhoods = neighborhoodMatches
    .sort((a, b) => a.pos - b.pos)
    .map((m) => m.canonical);

  return {
    originalText,
    normalizedText,
    tokens: normalizedText ? normalizedText.split(" ") : [],
    detectedLanguage,
    isAradarja,
    detectedCities,
    detectedNeighborhoods,
    appliedCorrections,
  };
}
