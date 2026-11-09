import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const explorerCatalog = JSON.parse(
  readFileSync(join(__dirname, "catalogs", "explorerHelpTopics.json"), "utf8")
);
const partnerCatalog = JSON.parse(
  readFileSync(join(__dirname, "catalogs", "partnerHelpTopics.json"), "utf8")
);
const deepLinkContract = JSON.parse(
  readFileSync(join(__dirname, "catalogs", "deepLinkActions.contract.json"), "utf8")
);

export const APP_HELP_TOPICS = Object.freeze({
  HELP_GENERAL: ["search", "interactive_map", "favorites", "filters", "profile"],
  PARTNER_MANAGE_ACTIVITY: ["create_activity", "manage_hours", "promotions", "analytics"],
  PARTNER_HOURS_HELP: ["manage_hours"],
  PARTNER_PROMOTION_HELP: ["promotions"],
});

export const getHelpTopics = (intent) => APP_HELP_TOPICS[intent] || APP_HELP_TOPICS.HELP_GENERAL;

/**
 * Récupère le catalogue approprié selon le rôle (explorer ou partner).
 */
function getCatalog(role = "explorer") {
  return role === "partner" ? partnerCatalog.topics : explorerCatalog.topics;
}

/**
 * Résout une rubrique d'aide dans la langue demandée avec ses boutons d'action conformes au contrat.
 *
 * @param {Object} options
 * @param {string} options.topicId Identifiant du topic (ex: "search", "interactive_map", "create_activity")
 * @param {string} [options.role="explorer"] Rôle utilisateur : "explorer" | "partner"
 * @param {string} [options.lang="fr"] Langue : "fr" | "ar" | "derja" | "en"
 * @returns {{ topicId: string, title: string, description: string, actionButton: Object|null }|null}
 */
export function resolveAppHelpTopic({ topicId, role = "explorer", lang = "fr" } = {}) {
  const catalog = getCatalog(role);
  const entry = catalog[topicId];
  if (!entry) return null;

  const loc = entry[lang] || entry.fr || {};
  const actionButton = entry.action
    ? {
        label: loc.actionLabel || "Ouvrir",
        actionType: entry.action,
        params: entry.actionParams || {},
      }
    : null;

  return {
    topicId,
    title: loc.title || "",
    description: loc.description || "",
    actionButton,
  };
}

/**
 * Liste l'ensemble des rubriques disponibles pour un rôle donné.
 */
export function listHelpTopics({ role = "explorer", lang = "fr" } = {}) {
  const catalog = getCatalog(role);
  return Object.keys(catalog).map((topicId) =>
    resolveAppHelpTopic({ topicId, role, lang })
  );
}

/**
 * Valide qu'une action correspond aux contrats deep link déclarés.
 */
export function validateDeepLinkAction(actionType, params = {}) {
  const contract = deepLinkContract.actions?.[actionType];
  if (!contract) return { valid: false, reason: "unknown_action_type" };

  if (contract.requiredParams) {
    for (const req of contract.requiredParams) {
      if (params[req] === undefined || params[req] === null) {
        return { valid: false, reason: `missing_required_param_${req}` };
      }
    }
  }

  if (actionType === "OPEN_TAB" && params.tab && !contract.allowedTabs.includes(params.tab)) {
    return { valid: false, reason: "disallowed_tab" };
  }

  return { valid: true };
}
