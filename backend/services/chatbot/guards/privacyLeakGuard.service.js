const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET = /\b(?:sessionTokenHash|password|passwordHash|token)\b\s*[:=]\s*\S+/gi;

/**
 * Masque les données privées qui ne doivent jamais apparaître dans une réponse.
 */
export function privacyLeakGuard(text) {
  let flagged = false;
  const cleaned = text
    .replace(EMAIL, () => { flagged = true; return "[email masqué]"; })
    .replace(SECRET, () => { flagged = true; return "[donnée masquée]"; });
  return { text: cleaned, flagged };
}

