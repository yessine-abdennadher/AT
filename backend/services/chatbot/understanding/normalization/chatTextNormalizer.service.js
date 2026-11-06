import { loadNormalizationCatalogs } from "./loaders/normalizationCatalog.loader.js";

const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF]/;
const ARABIZI_TOKEN_REGEX = /\b([a-z]*[235789][a-z0-9]*|aslema|slm|salem|sbe7|sbah|lebas|labes|3aychek|aaychek|ya3tik|sa7a|saha|nheb|n7eb|nlawej|nchouf|kharja|5arja|nokhrej|nokhrjou|kahwa|9ahwa|9ahoua|mekla|ftour|3cha|mahloul|ma7loul|msaker|msakker|wa9tech|waktech|waqt|wa9t|rkhis|r5is|ghali|blassa|blasa|blayes|behia|behya|mzyena|mezyana|barcha|chwaya|choufi|fama|famma|famech|chnowa|chnoua|win|wine|chkoun|kifech|kifeh|brabi|brabbi|aychek|haka|tawa|taw|m3a|mte3|noumrou|noumro|b7ar|bhar)\b/i;
const ENGLISH_HINT_REGEX = /\b(hello|hi|where|looking|for|coffee|cheap|open|hours|menu|recommend|place|near|family)\b/i;

function collapseRepeatedChars(text) {
  return text.replace(/(.)\1{2,}/gu, "$1");
}

function damerauLevenshtein(a, b) {
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 2) return 99;

  const dp = Array.from({ length: lenA + 1 }, () => new Array(lenB + 1).fill(0));
  for (let i = 0; i <= lenA; i += 1) dp[i][0] = i;
  for (let j = 0; j <= lenB; j += 1) dp[0][j] = j;

  for (let i = 1; i <= lenA; i += 1) {
    for (let j = 1; j <= lenB; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[lenA][lenB];
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

  let text = originalText
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’`]/g, " ")
    .replace(/[^\p{L}\p{N}\s\-€$]/gu, " ");

  text = collapseRepeatedChars(text).replace(/\s+/g, " ").trim();

  const appliedCorrections = [];
  const rawTokens = text ? text.split(" ") : [];

  const normalizedTokens = rawTokens.map((token) => {
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

    if (token.length >= 5 && !catalogs.fr.whitelist.has(token)) {
      for (const keyword of catalogs.fr.whitelist) {
        if (Math.abs(keyword.length - token.length) <= 1 && damerauLevenshtein(token, keyword) === 1) {
          appliedCorrections.push({ from: token, to: keyword, type: "fuzzy_domain" });
          return keyword;
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

  return {
    originalText,
    normalizedText,
    tokens: normalizedText ? normalizedText.split(" ") : [],
    detectedLanguage,
    detectedCities,
    appliedCorrections,
  };
}

