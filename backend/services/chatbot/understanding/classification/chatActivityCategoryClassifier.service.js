import { stripDiacritics, includesAny, includesWord } from "../../shared/textUtils.js";

export const CATEGORY_KEYWORDS = Object.freeze({
  cafe: ["cafe", "coffee", "salon de the", "cappuccino"],
  restaurant: ["restaurant", "manger", "dejeuner", "diner", "pizza", "brunch", "sushi", "grill"],
  plage: ["plage", "beach", "mer", "piscine"],
  parc: ["parc", "jardin", "nature", "balade", "randonnee"],
  gaming: ["gaming", "jeux", "jeu video", "playstation", "escape game", "billard", "bowling"],
  sport: ["sport", "gym", "foot", "padel", "tennis", "fitness"],
  culture: ["musee", "culture", "cinema", "theatre", "exposition", "concert"],
  "bien-etre": ["spa", "hammam", "massage", "yoga", "detente"],
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

