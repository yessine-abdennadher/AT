import { stripDiacritics, includesAny } from "../../shared/textUtils.js";

const VIBES = Object.freeze({
  famille: ["famille", "enfants", "enfant", "family", "kids"],
  amis: ["amis", "entre amis", "copains", "friends", "bande"],
  couple: ["couple", "romantique", "date", "en amoureux"],
  calme: ["calme", "tranquille", "paisible", "quiet"],
  festif: ["festif", "ambiance", "fete", "animation", "musique"],
  travail: ["travailler", "travail", "reviser", "etudier", "work"],
});

export function classifyVibe(rawText = "") {
  const text = stripDiacritics(rawText);
  const vibes = Object.entries(VIBES)
    .filter(([, words]) => includesAny(text, words))
    .map(([vibe]) => vibe);
  return vibes;
}

