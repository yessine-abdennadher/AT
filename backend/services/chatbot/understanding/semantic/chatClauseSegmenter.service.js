import { stripDiacritics } from "../../shared/textUtils.js";

/**
 * Connecteurs séquentiels multi-langues pour découper les requêtes complexes :
 * - Français : puis, ensuite, et après, après ça, d'abord, et plus tard, plus tard
 * - Derja (Arabizi) : w mba3ed, w mba3d, mba3ed, mba3d, men ba3d, men ba3ed, w men ba3d, w ba3dha, w ba3d, ba3dha, w mba3edha
 * - Arabe : ومن بعد, و من بعد, ثم, و بعدها, و بعد, من بعد, و مبعد
 * - Anglais : then, and then, after that, afterwards, later on, next
 * - Ponctuation / Symboles : ;, \n, |, ->, =>, +
 */
const SPLIT_REGEX = /\s+(?:puis|ensuite|et apres|apres ca|apres|d'abord|et plus tard|plus tard|then|and then|after that|afterwards|later on|next|w mba3ed|w mba3d|w mba3edha|mba3ed|mba3d|men ba3d|men ba3ed|w men ba3d|w ba3dha|w ba3d|ba3dha|ومن بعد|و من بعد|ثم|و بعدها|و بعد|من بعد|و مبعد)\s+|[;,|\n\r]+|\s*(?:->|=>|\+)\s*/iu;

const SEQUENTIAL_REGEX = /(?:\b(?:puis|ensuite|et apres|apres|then|and then|after that|w mba3ed|w mba3d|mba3ed|mba3d|men ba3d|ba3dha)\b|ومن بعد|و من بعد|ثم|و بعدها|->|=>)/iu;

/**
 * Découpe une requête multi-intentions / multi-étapes en clauses :
 * Exemple : "un cafe a chihia puis un resto a gremda" -> ["un cafe a chihia", "un resto a gremda"]
 * Exemple : "9ahwa behia w mba3ed resto r5is" -> ["9ahwa behia", "resto r5is"]
 * Exemple : "قهوة في الشيحية ومن بعد عشاء في قرمدة" -> ["قهوة في الشيحية", "عشاء في قرمدة"]
 */
export function segmentClauses(rawText = "") {
  if (!rawText || typeof rawText !== "string") return [];
  return stripDiacritics(rawText)
    .split(SPLIT_REGEX)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

/**
 * Indique si le texte contient explicitement une liaison séquentielle d'étapes.
 */
export function hasSequentialConnector(rawText = "") {
  if (!rawText || typeof rawText !== "string") return false;
  return SEQUENTIAL_REGEX.test(stripDiacritics(rawText));
}
