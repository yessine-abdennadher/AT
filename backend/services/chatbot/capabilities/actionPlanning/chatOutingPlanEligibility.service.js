import { isOutingPlanActive } from "./chatOutingPlanMemory.service.js";
import { resolvePlanGuidance } from "./chatOutingPlanGuidance.service.js";
import { stripDiacritics, includesAny } from "../../shared/textUtils.js";

const RESUME_KEYWORDS = [
  "reprendre",
  "continuer",
  "continue",
  "suite",
  "reprendre le programme",
  "kamel",
  "kamel el programme",
  "kamel el kharja",
  "واصل",
  "كمل البرنامج",
  "البرنامج",
];

const CANCEL_PLAN_KEYWORDS = [
  "annuler le programme",
  "laisse tomber la sortie",
  "arreter le programme",
  "batel",
  "batal",
  "fok alina mel programme",
  "الغاء البرنامج",
];

/**
 * Évalue l'éligibilité du tour par rapport au plan de sortie actif ou en pause.
 *
 * @param {Object} options
 * @param {Object} options.plan Le plan de sortie en mémoire
 * @param {string} options.userText Texte normalisé de l'utilisateur
 * @param {string} options.intent Intention courante
 * @param {string} [options.dialogueAct] Acte de dialogue courant (consommé par la table de guidage)
 * @returns {{ decision: "RESUME_PLAN" | "CANCEL_PLAN" | "INTERRUPT_PLAN" | "NEXT_STEP" | "CHANGE_STEP" | "CONTINUE" | "NONE", reason: string }}
 */
export function evaluateOutingPlanEligibility({ plan, userText = "", intent = "", dialogueAct = "" } = {}) {
  if (!isOutingPlanActive(plan)) {
    return { decision: "NONE", reason: "no_active_plan" };
  }

  const clean = stripDiacritics(userText);

  if (includesAny(clean, CANCEL_PLAN_KEYWORDS)) {
    return { decision: "CANCEL_PLAN", reason: "user_requested_cancel" };
  }

  if (plan.status === "paused" && includesAny(clean, RESUME_KEYWORDS)) {
    return { decision: "RESUME_PLAN", reason: "user_requested_resume" };
  }

  // Si une question de détail est posée alors qu'un plan est actif
  if (intent.startsWith("ASK_") && plan.status !== "paused") {
    return { decision: "INTERRUPT_PLAN", reason: "detail_question_on_step" };
  }

  // Table de décision pure basée sur l'acte de dialogue (0 mot-clé)
  const guidance = resolvePlanGuidance({ plan, dialogueAct });
  if (guidance.decision !== "NONE") return guidance;

  return { decision: "CONTINUE", reason: "in_plan_flow" };
}
