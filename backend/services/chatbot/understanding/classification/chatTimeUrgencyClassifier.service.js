import { stripDiacritics, includesAny } from "../../shared/textUtils.js";

export function classifyTimeUrgency(rawText = "") {
  const text = stripDiacritics(rawText);
  if (includesAny(text, ["maintenant", "tout de suite", "now", "tawa", "en ce moment", "ouvert"])) return "now";
  if (includesAny(text, ["ce soir", "tonight", "ce soir la"])) return "tonight";
  if (includesAny(text, ["week end", "weekend", "week-end", "samedi", "dimanche"])) return "weekend";
  if (includesAny(text, ["demain", "tomorrow"])) return "tomorrow";
  return null;
}

