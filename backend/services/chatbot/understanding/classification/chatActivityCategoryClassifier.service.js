import { stripDiacritics, includesAny, includesWord } from "../../shared/textUtils.js";

export const CATEGORY_KEYWORDS = Object.freeze({
  cafe: ["cafe", "coffee", "salon de the", "cappuccino", "9ahwa", "qahwa", "kahwa", "قهوة", "قهوه", "مقهى", "صالون شاي"],
  restaurant: [
    "restaurant",
    "resto",
    "manger",
    "dejeuner",
    "diner",
    "pizza",
    "brunch",
    "sushi",
    "grill",
    "nfter",
    "noftor",
    "neftir",
    "ftour",
    "3cha",
    "cha",
    "عشاء",
    "عشا",
    "غداء",
    "مطعم",
    "ماكلة",
    "ماكله",
    "poisson",
    "حوت",
  ],
  fast_food: ["fast food", "fastfood", "sandwitch", "sandwich", "chawarma", "mlewi", "kafteji", "lablebi", "شاورما", "كفتيجي", "لبلابي"],
  plage: ["plage", "beach", "mer", "piscine", "شاطئ", "بحر"],
  parc: ["parc", "jardin", "nature", "balade", "randonnee", "حديقة", "حديقه"],
  gaming: ["gaming", "jeux", "jeu video", "playstation", "escape game", "billard", "bowling", "العاب", "ألعاب"],
  sport: ["sport", "gym", "foot", "padel", "tennis", "fitness", "رياضة", "رياضه"],
  culture: ["musee", "culture", "cinema", "theatre", "exposition", "concert", "سينما", "مسرح"],
  "bien-etre": ["spa", "hammam", "massage", "yoga", "detente"],
  couple: ["couple", "romantique", "date", "en amoureux", "diner romantique", "كبل", "رومانسي"],
  outdoor: ["outdoor", "plein air", "hwe ndhif", "hwe", "هواء طلق", "nature", "طبيعة", "plage", "b7ar", "بحر", "شاطئ"],
  fun: ["fun", "divertissement", "loisirs & fun", "jaw & loisirs", "gaming & fun", "loisirs", "jaw", "faddit", "9la9t", "activite", "ترفيه", "تفرهيد", "ألعاب وترفيه", "العاب وترفيه", "ألعاب", "العاب"],
  friends: ["amis", "entre amis", "potes", "friends", "lamma", "لمة", "لمه", "قهوة لمة", "9ahwa lamma", "café lamma", "cafe lamma"],
});

export function classifyCategories(rawText = "") {
  const text = stripDiacritics(rawText);
  const found = [];
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let first = -1;
    for (const word of words) {
      const match = new RegExp(`(^|[^\\p{L}\\p{N}])${stripDiacritics(word)}($|[^\\p{L}\\p{N}])`, "u").exec(text);
      if (match && (first === -1 || match.index < first)) first = match.index;
    }
    if (first !== -1) found.push({ category, position: first });
  }
  return found.sort((a, b) => a.position - b.position).map((item) => item.category);
}

export { includesAny, includesWord };

