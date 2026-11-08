import { areKeysAdjacent } from "./keyboardAdjacency.js";

const DEFAULT_WEIGHTS = Object.freeze({
  insertion: 1.0,
  deletion: 1.0,
  substitutionStandard: 1.0,
  substitutionAdjacent: 0.5,
  transposition: 0.6,
});

/**
 * Calcule la distance de Damerau-Levenshtein pondérée par l'adjacence des touches de clavier.
 * - Coût 0.5 si substitution d'une touche voisine (ex: 'w' au lieu de 's' ou 'a').
 * - Coût 0.6 si inversion de deux lettres consécutives (transposition).
 */
export function weightedDamerauLevenshtein(strA = "", strB = "", weights = DEFAULT_WEIGHTS) {
  const a = String(strA || "");
  const b = String(strB || "");
  const lenA = a.length;
  const lenB = b.length;

  if (Math.abs(lenA - lenB) > 3) return 99;
  if (a === b) return 0;
  if (lenA === 0) return lenB * weights.insertion;
  if (lenB === 0) return lenA * weights.deletion;

  const dp = Array.from({ length: lenA + 1 }, () => new Float32Array(lenB + 1));
  for (let i = 0; i <= lenA; i += 1) dp[i][0] = i * weights.deletion;
  for (let j = 0; j <= lenB; j += 1) dp[0][j] = j * weights.insertion;

  for (let i = 1; i <= lenA; i += 1) {
    const charA = a[i - 1];
    for (let j = 1; j <= lenB; j += 1) {
      const charB = b[j - 1];

      let subCost = 0;
      if (charA !== charB) {
        subCost = areKeysAdjacent(charA, charB)
          ? weights.substitutionAdjacent
          : weights.substitutionStandard;
      }

      dp[i][j] = Math.min(
        dp[i - 1][j] + weights.deletion,
        dp[i][j - 1] + weights.insertion,
        dp[i - 1][j - 1] + subCost
      );

      // Transposition (inversion de 2 lettres adjacentes)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + weights.transposition);
      }
    }
  }

  return dp[lenA][lenB];
}

