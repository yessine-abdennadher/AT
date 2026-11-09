/**
 * Expressions ou données réservées exclusivement aux rôles Partenaire et Administrateur.
 */
const RESTRICTED_PARTNER_PATTERNS = [
  /\bcommission_rate\b/i,
  /\bpartner_margin\b/i,
  /\bsubscription_tier\b/i,
  /\badmin_dashboard\b/i,
  /\bpartner_internal_id\b/i,
  /\bca_chiffre_affaires\b/i,
  /\brevenu_net\b/i,
];

/**
 * Garantit l'isolation stricte des rôles : un utilisateur Explorateur ne doit
 * jamais recevoir de métriques ou secrets d'administration / partenariat.
 *
 * @param {string} text
 * @param {string} [role="explorer"] Rôle du demandeur ("explorer" | "partner" | "admin")
 * @returns {{ text: string, flagged: boolean }}
 */
export function roleIsolationGuard(text, role = "explorer") {
  if (typeof text !== "string") return { text: "", flagged: false };
  if (role === "admin" || role === "partner") {
    return { text, flagged: false };
  }

  let flagged = false;
  let cleaned = text;

  for (const pattern of RESTRICTED_PARTNER_PATTERNS) {
    if (pattern.test(cleaned)) {
      flagged = true;
      cleaned = cleaned.replace(pattern, "[information restreinte]");
    }
  }

  return { text: cleaned, flagged };
}

