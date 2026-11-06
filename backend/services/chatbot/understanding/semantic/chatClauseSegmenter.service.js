import { stripDiacritics } from "../../shared/textUtils.js";

const SPLIT_REGEX = /\s+(?:puis|ensuite|et apres|apres ca|apres|then)\s+|[;,.]+/u;

/**
 * Découpe une requête multi-intentions en clauses ("un cafe puis un restaurant").
 */
export function segmentClauses(rawText = "") {
  return stripDiacritics(rawText)
    .split(SPLIT_REGEX)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

