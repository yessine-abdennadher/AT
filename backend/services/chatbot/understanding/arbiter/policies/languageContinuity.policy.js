const EXPLICIT_FRENCH_REGEX = /\b(je|nous|vous|pour|dans|avec|une|des|les|est-ce|bonjour|bonsoir|merci beaucoup|salut|svp)\b/i;

/**
 * Politique de continuité linguistique.
 * Si l'utilisateur parlait déjà en derja/arabe et envoie un mot court (ex. "horaires", "menu", "oui"),
 * on conserve sa langue de conversation pour répondre dans la même langue.
 */
export function resolveLanguage({ fastPath, normalized, memory = {} }) {
  let resolvedLanguage = fastPath?.matched && fastPath.lang ? fastPath.lang : normalized.detectedLanguage;

  if (resolvedLanguage === "fr" && memory.preferredLanguage && memory.preferredLanguage !== "fr") {
    if (!EXPLICIT_FRENCH_REGEX.test(normalized.originalText || "")) {
      resolvedLanguage = memory.preferredLanguage;
    }
  }

  return resolvedLanguage;
}

