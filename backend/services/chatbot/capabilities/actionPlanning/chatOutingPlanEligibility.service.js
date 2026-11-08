import { isOutingPlanActive } from "./chatOutingPlanMemory.service.js";
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
 * @returns {{ decision: "RESUME_PLAN" | "CANCEL_PLAN" | "INTERRUPT_PLAN" | "CONTINUE" | "NONE", reason: string }}
 */
export function evaluateOutingPlanEligibility({ plan, userText = "", intent = "" } = {}) {
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

  return { decision: "CONTINUE", reason: "in_plan_flow" };
}
