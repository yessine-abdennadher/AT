const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06FF]/u;
const ARABIC_DIACRITICS_PATTERN = /[\u064B-\u065F\u0670\u06D6-\u06ED]/gu;

// Mots et prépositions protégés (ne jamais tronquer la racine)
const ARABIC_PROTECTED_TOKENS = new Set([
  "لا", "لم", "لن", "ما", "ليس", "غير", "بدون", "في", "من", "عن", "مع", "علي", "الي", "هو", "هي", "انا", "انت",
  "فريق", "فكرة", "فرصة", "فهم", "فترة", "فحص", "فرد", "فورا",
  "وظيفة", "وجبة", "وقت", "وضع", "وزن", "وعي", "وفاء", "وطن", "وحدة", "وجود", "وصول", "ولاية",
  "لبنان", "لندن", "لطيف", "لذيذ", "لذيذه", "لازم", "لعبه", "لعب"
]);

const EXPLICIT_L_PREFIX_STRIP = new Map([
  ["لصفاقس", "صفاقس"],
  ["لتونس", "تونس"],
  ["لمطعم", "مطعم"],
  ["لقهوه", "قهوه"],
  ["لبلاصه", "بلاصه"],
  ["لطريق", "طريق"],
]);

/**
 * Normalisation standard pour le texte en caractères arabes (MSA & Aradarja) :
 * - Séparation des jonctions Arabe/Latin collées (ex: "وclimatisation" -> "و climatisation")
 * - Tatweel (ـ) & Tashkeel (harakat)
 * - Pliage des Alefs (أ / إ / آ / ٱ -> ا)
 * - Ta marbouta vers Ha pour claviers mobiles informels (ة -> ه)
 * - Alif maqsoura vers Ya (ى -> ي)
 * - Minuscules sur les segments latins en cas de code-switching
 */
export function normalizeArabicText(value = "") {
  const text = String(value || "");
  if (!ARABIC_SCRIPT_PATTERN.test(text)) return text.trim();

  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/([\u0600-\u06FF])([a-z0-9])/giu, "$1 $2")
    .replace(/([a-z0-9])([\u0600-\u06FF])/giu, "$1 $2")
    .replace(/\u0640/gu, "") // suppression tatweel
    .replace(ARABIC_DIACRITICS_PATTERN, "") // suppression voyelles courtes
    .replace(/[أإآٱ]/gu, "ا") // pliage des alefs
    .replace(/ة/gu, "ه") // ta marbouta
    .replace(/ى/gu, "ي") // alif maqsoura
    .replace(/[ـ\u200E\u200F\u202A-\u202E]/gu, " ")
    .replace(/[^\p{Script=Arabic}\p{L}\p{N}'’\s\-]/gu, " ")
    .replace(/(.)\1{2,}/gu, "$1") // réduction des répétitions excessives (3+ -> 1)
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Dépouillement sécurisé des proclitiques arabes et Aradarja (Safe Proclitics Stripping) :
 * - Retire 'وال', 'فال', 'بال', 'كال' (ex: 'والمطاعم' -> 'مطاعم', 'بالبيسكلات' -> 'بيسكلات')
 * - Retire 'لل' (ex: 'للبحر' -> 'بحر', 'للوسط' -> 'وسط')
 * - Retire l'article 'ال' (ex: 'المطعم' -> 'مطعم', 'المرسى' -> 'مرسى')
 * - Ne touche jamais aux racines protégées ('وقت', 'فكرة', etc.)
 */
export function stripArabicProclitics(word = "") {
  const token = String(word || "").trim();
  if (EXPLICIT_L_PREFIX_STRIP.has(token)) {
    return EXPLICIT_L_PREFIX_STRIP.get(token);
  }
  if (token.length < 4 || ARABIC_PROTECTED_TOKENS.has(token)) {
    return token;
  }

  // 1. Dépouillement de 'وال', 'فال', 'بال', 'كال'
  if ((token.startsWith("وال") || token.startsWith("فال") || token.startsWith("بال") || token.startsWith("كال")) && token.length >= 6) {
    const candidate = token.slice(3);
    if (candidate.length >= 3 && !ARABIC_PROTECTED_TOKENS.has(candidate)) {
      return candidate;
    }
  }

  // 2. Dépouillement de 'لل' (ex: للبحر -> بحر, للوسط -> وسط)
  if (token.startsWith("لل") && token.length >= 5) {
    const candidate = token.slice(2);
    if (candidate.length >= 3 && !ARABIC_PROTECTED_TOKENS.has(candidate)) {
      return candidate;
    }
  }

  // 3. Dépouillement de l'article 'ال'
  if (token.startsWith("ال") && token.length >= 5) {
    const candidate = token.slice(2);
    if (candidate.length >= 3 && !ARABIC_PROTECTED_TOKENS.has(token)) {
      return candidate;
    }
  }

  return token;
}
