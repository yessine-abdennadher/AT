import { stripDiacritics } from "../../shared/textUtils.js";
import { normalizeArabicText } from "../../understanding/normalization/arabicMorphology.service.js";

/**
 * Motifs de prompt injection, contournement de consignes et extraction système (#34, #39).
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /ignore\s+toutes\s+tes\s+instructions/i,
  /repete\s+exactement\s+toutes\s+les\s+informations\s+internes/i,
  /informations\s+internes\s+de\s+ton\s+systeme/i,
  /system\s+prompt/i,
  /reveal\s+(your\s+)?(hidden\s+)?instructions/i,
  /you\s+are\s+now\s+(an?\s+)?unrestricted/i,
  /act\s+as\s+dan/i,
  /jailbreak/i,
  /bypass\s+safety/i,
  /give\s+me\s+the\s+admin\s+password/i,
  /sql\s+injection/i,
  /<script>/i,
];

/**
 * Motifs de fabrication d'informations fictives (#24, #31, #34, #40).
 */
const FABRICATION_PATTERNS = [
  /invente[- ]moi\s+\d*\s*etablissements/i,
  /fake\s+address\s+and\s+pretend/i,
  /give\s+me\s+a\s+fake\s+address/i,
  /ما\s+عندكش\s+معلومات\s+عليه/u,
  /موش\s+موجوده\s+في\s+التطبيق/u,
  /موش\s+موجودة\s+في\s+التطبيق/u,
];

/**
 * Motifs d'atteinte à la vie privée des propriétaires ou des clients (#30, #33, #36).
 */
const PRIVACY_VIOLATION_PATTERNS = [
  /numero\s+personnel\s+du\s+proprietaire/i,
  /معلومات\s+سريه\s+علي\s+اصحاب/u,
  /معلومات\s+سرية\s+على\s+أصحاب/u,
  /شكون\s+موجود\s+توا\s+في\s+القهوه/u,
  /شكون\s+موجود\s+توّا\s+في\s+القهوة/u,
];

/**
 * Motifs de limites opérationnelles / omniscience (#28, #29, #32, #35).
 */
const EPISTEMIC_LIMIT_PATTERNS = [
  /pretend\s+you\s+have\s+access\s+to\s+every\s+restaurant/i,
  /check\s+all\s+of\s+them/i,
  /reserve[- ]moi\s+une\s+table\s*,?\s*mais\s+ne\s+contacte\s+pas/i,
  /مازالت\s+ما\s+تحلتش/u,
];

/**
 * Motifs de contenus strictement hors-périmètre ou illégaux / malveillants.
 */
const HARMFUL_PATTERNS = [
  /\b(hack|pirater|cracker|ddos|exploit)\b/i,
  /\b(drogue|cocaine|heroine|arme|explosif|bomb)\b/i,
  /\b(suicide|automutilation)\b/i,
];

const SAFE_FALLBACK_TEXTS = Object.freeze({
  fr: "Je suis l'assistant Tfarhida dédié uniquement aux sorties, cafés, restaurants et activités vérifiés en Tunisie. Je ne peux ni inventer d'adresses, ni divulguer de données privées ou internes.",
  derja: "Ena l'assistant mte3 Tfarhida lil kharjet w les activités vérifiés fi Tounes. Ma najjemch na5tara3 blayes walla na3ti ma3loumet serriya.",
  ar: "أنا المساعد الذكي لتفرهيدة الخاص بالخروجات والأنشطة الموثقة فقط. لا يمكنني اختراع عناوين غير موجودة أو تقديم معلومات خاصة أو سرية.",
  en: "I am the Tfarhida assistant dedicated strictly to verified outings and activities in Tunisia. I cannot invent fake places, access external private databases, or share private information.",
});

const DEFAULT_SUGGESTIONS = Object.freeze({
  fr: ["Cafés sympas", "Restaurants à Sfax", "Idée de sortie"],
  derja: ["9ahwa behya", "Resto fi Sfax", "Kharja raye9a"],
  ar: ["مقاهي هادئة", "مطاعم في صفاقس", "فكرة خرجة"],
  en: ["Nice cafes", "Restaurants in Sfax", "Outing idea"],
});

/**
 * Modérateur d'entrée en amont (0 appel LLM, ultra-rapide < 1ms).
 * Vérifie l'innocuité et la conformité au domaine Tfarhida (loisirs, sorties, tourisme en Tunisie).
 *
 * @param {string} text Texte brut de l'utilisateur
 * @param {string} [lang="fr"] Langue détectée
 * @returns {{ isSafe: boolean, flag: string|null, fallbackText?: string, suggestions?: string[] }}
 */
export function evaluateChatSafety(text = "", lang = "fr") {
  if (typeof text !== "string" || !text.trim()) {
    return { isSafe: true, flag: null };
  }

  const clean = stripDiacritics(text);
  const cleanAr = normalizeArabicText(text);
  const selectedLang = SAFE_FALLBACK_TEXTS[lang] ? lang : /[\u0600-\u06FF]/.test(text) ? "ar" : "fr";

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text) || pattern.test(clean)) {
      return {
        isSafe: false,
        flag: "prompt_injection_attempt",
        fallbackText: SAFE_FALLBACK_TEXTS[selectedLang],
        suggestions: DEFAULT_SUGGESTIONS[selectedLang],
      };
    }
  }

  for (const pattern of FABRICATION_PATTERNS) {
    if (pattern.test(text) || pattern.test(clean) || pattern.test(cleanAr)) {
      return {
        isSafe: false,
        flag: "refuse_fabrication",
        fallbackText: SAFE_FALLBACK_TEXTS[selectedLang],
        suggestions: DEFAULT_SUGGESTIONS[selectedLang],
      };
    }
  }

  for (const pattern of PRIVACY_VIOLATION_PATTERNS) {
    if (pattern.test(text) || pattern.test(clean) || pattern.test(cleanAr)) {
      return {
        isSafe: false,
        flag: "privacy_protection",
        fallbackText: SAFE_FALLBACK_TEXTS[selectedLang],
        suggestions: DEFAULT_SUGGESTIONS[selectedLang],
      };
    }
  }

  for (const pattern of EPISTEMIC_LIMIT_PATTERNS) {
    if (pattern.test(text) || pattern.test(clean) || pattern.test(cleanAr)) {
      return {
        isSafe: false,
        flag: "epistemic_honesty",
        fallbackText: SAFE_FALLBACK_TEXTS[selectedLang],
        suggestions: DEFAULT_SUGGESTIONS[selectedLang],
      };
    }
  }

  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isSafe: false,
        flag: "harmful_or_off_scope",
        fallbackText: SAFE_FALLBACK_TEXTS[selectedLang],
        suggestions: DEFAULT_SUGGESTIONS[selectedLang],
      };
    }
  }

  return { isSafe: true, flag: null };
}
