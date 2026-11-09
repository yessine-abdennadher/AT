import { stripDiacritics, includesAny, includesWord } from "../../shared/textUtils.js";

export const CATEGORY_KEYWORDS = Object.freeze({
  cafe: [
    "cafe",
    "cafes",
    "coffee",
    "salon de the",
    "cappuccino",
    "9ahwa",
    "9hawi",
    "qahwa",
    "kahwa",
    "قهوة",
    "قهوه",
    "قهاوي",
    "مقهى",
    "مقهي",
    "مقاهي",
    "كابتشينو",
    "صالون شاي",
  ],
  restaurant: [
    "restaurant",
    "restaurants",
    "resto",
    "restos",
    "manger",
    "eat",
    "lunch",
    "dinner",
    "seafood",
    "fruits de mer",
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
    "مطاعم",
    "ماكلة",
    "ماكله",
    "ناكل",
    "نتغدى",
    "نتغدي",
    "نتعشى",
    "نتعشي",
    "فواكه البحر",
    "مأكولات بحرية",
    "ماكولات بحريه",
    "بيتزا",
    "poisson",
    "حوت",
  ],
  fast_food: ["fast food", "fastfood", "sandwitch", "sandwich", "chawarma", "mlewi", "kafteji", "lablebi", "شاورما", "كفتيجي", "لبلابي"],
  plage: ["plage", "beach", "mer", "sea", "piscine", "شاطئ", "بحر", "للبحر", "غروب", "sunset"],
  parc: ["parc", "jardin", "nature", "balade", "randonnee", "pique-nique", "pique nique", "picnic", "walk", "حديقة", "حديقه", "طبيعة", "طبيعه", "نزهة", "نزهه", "بيكنيك", "دورة في الهواء", "دوره في الهواء"],
  gaming: ["gaming", "jeux", "jeu video", "playstation", "escape game", "billard", "bowling", "بولينغ", "العاب", "ألعاب"],
  sport: [
    "sport",
    "sports",
    "sportive",
    "sportives",
    "gym",
    "foot",
    "padel",
    "tennis",
    "fitness",
    "karting",
    "velo",
    "cycling",
    "adrenaline",
    "رياضة",
    "رياضه",
    "رياضي",
    "رياضيه",
    "سبور",
    "كارتينغ",
    "بولينغ",
    "بيسكلات",
    "دراجات",
    "ادرينالين",
    "أدرينالين",
  ],
  culture: ["musee", "culture", "cinema", "theatre", "exposition", "concert", "سينما", "مسرح"],
  "bien-etre": ["spa", "hammam", "massage", "yoga", "detente"],
  nightclub: ["nightclub", "discotheque", "boite de nuit", "club"],
  couple: ["couple", "romantique", "romantic", "date", "en amoureux", "diner romantique", "كبل", "رومانسي", "رومانسيه", "ثنائي"],
  outdoor: ["outdoor", "plein air", "en exterieur", "exterieur", "hwe ndhif", "hwe", "هواء طلق", "الهواء الطلق", "لبرا", "البرّا", "برا", "nature", "طبيعة", "طبيعه", "plage", "b7ar", "بحر", "شاطئ"],
  fun: ["fun", "divertissement", "loisirs & fun", "jaw & loisirs", "gaming & fun", "loisirs", "jaw", "faddit", "9la9t", "activite", "amusante", "adventure", "adventurous", "ترفيه", "تفرهيد", "نتفرهد", "نتفرهدو", "ألعاب وترفيه", "العاب وترفيه", "ألعاب", "العاب", "تشويق", "إثارة", "اثاره"],
  friends: ["amis", "entre amis", "potes", "friends", "cousins", "lamma", "لمة", "لمه", "قهوة لمة", "9ahwa lamma", "café lamma", "cafe lamma", "صحابي", "صحاب", "اصدقائي", "الاصدقاء"],
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
