import { stripDiacritics, includesAny } from "../../shared/textUtils.js";

const VIBES = Object.freeze({
  famille: ["famille", "enfants", "enfant", "family", "kids", "عائلة", "عائلي", "3ayli", "familial", "family friendly"],
  amis: [
    "amis",
    "entre amis",
    "copains",
    "friends",
    "bande",
    "avec mes amis",
    "s7abi",
    "shabi",
    "potes",
    "entre potes",
    "صحابي",
    "أصحابي",
    "lamma",
    "لمة",
    "لمه",
    "قهوة لمة",
    "café lamma",
    "cafe lamma",
    "9ahwa lamma",
  ],
  couple: [
    "couple",
    "romantique",
    "date",
    "en amoureux",
    "en couple",
    "dîner romantique",
    "diner romantique",
    "عشاء رومانسي",
    "romantic dinner",
    "s7bti",
    "sahbti",
    "copine",
    "rajli",
    "marti",
    "كبل",
    "صاحبتي",
    "رومانسي",
  ],
  calme: ["calme", "tranquille", "paisible", "quiet", "هدوء", "رايق", "cadre calme", "مكان هادئ", "مكان هادي", "quiet setting"],
  festif: ["festif", "ambiance", "fete", "animation", "musique", "جو", "سهريات"],
  travail: ["travailler", "travail", "reviser", "etudier", "work", "خدمة", "قراية"],
  ennui: [
    "ennui",
    "changer air",
    "faddit",
    "fadda",
    "9la9t",
    "9l9t",
    "9la9",
    "mala fadda",
    "قلق",
    "فديت",
  ],
  froid: ["meteo froid", "froid", "berd", "berda", "bard", "barid", "بارد"],
});

export function classifyVibe(rawText = "") {
  const text = stripDiacritics(rawText);
  const vibes = Object.entries(VIBES)
    .filter(([, words]) => includesAny(text, words))
    .map(([vibe]) => vibe);
  return vibes;
}

