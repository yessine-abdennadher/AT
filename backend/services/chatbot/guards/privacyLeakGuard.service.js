const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SECRET = /\b(?:sessionTokenHash|password|passwordHash|apiKey|api_key|secret|bearer|authorization|token)\b\s*[:=]\s*\S+/gi;
const JWT = /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+/g;
const MONGO_URI = /mongodb(?:\+srv)?:\/\/[^\s]+/gi;

/**
 * Masque systématiquement les données privées, tokens JWT, clés d'API et identifiants sensibles.
 *
 * @param {string} text Texte de sortie du chatbot
 * @returns {{ text: string, flagged: boolean }}
 */
export function privacyLeakGuard(text) {
  if (typeof text !== "string") return { text: "", flagged: false };

  let flagged = false;
  const cleaned = text
    .replace(JWT, () => {
      flagged = true;
      return "[token masqué]";
    })
    .replace(MONGO_URI, () => {
      flagged = true;
      return "[uri masquée]";
    })
    .replace(EMAIL, () => {
      flagged = true;
      return "[email masqué]";
    })
    .replace(SECRET, () => {
      flagged = true;
      return "[donnée masquée]";
    });

  return { text: cleaned, flagged };
}
