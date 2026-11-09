/**
 * chatOutingPlanGuidance.service.js
 *
 * Table de décision PURE pour piloter un programme de sortie multi-étapes à partir
 * de l'acte de dialogue (`dialogueAct`) produit par la couche `understanding/`.
 * Zéro RegExp, zéro mot-clé : la compréhension du texte reste dans `understanding/`.
 *
 * Décisions possibles :
 *  - RESUME_PLAN    : reprendre un plan en pause
 *  - NEXT_STEP      : passer à l'étape suivante du plan actif
 *  - CHANGE_STEP    : l'utilisateur affine / change les critères d'une étape
 *  - INTERRUPT_PLAN : question incidente (détail d'établissement) -> mise en pause
 *  - NONE           : aucune action de plan (le tour est traité normalement)
 *
 * `RESET` est volontairement absent : la réinitialisation globale (qui efface aussi les critères)
 * est gérée par le flux `RESET_SEARCH` de l'orchestrateur.
 */
export const PLAN_GUIDANCE_TABLE = Object.freeze({
  paused: Object.freeze({
    AFFIRMATION: "RESUME_PLAN",
  }),
  in_progress: Object.freeze({
    AFFIRMATION: "NEXT_STEP",
    REFINEMENT: "CHANGE_STEP",
    DETAIL_QUESTION: "INTERRUPT_PLAN",
  }),
});

/**
 * @param {Object} options
 * @param {{status?: string}|null} options.plan Plan de sortie en mémoire
 * @param {string} options.dialogueAct Acte de dialogue du tour courant
 * @returns {{ decision: string, reason: string }}
 */
export function resolvePlanGuidance({ plan, dialogueAct } = {}) {
  const status = plan?.status;
  const row = status ? PLAN_GUIDANCE_TABLE[status] : null;
  const decision = row?.[dialogueAct];
  if (!decision) return { decision: "NONE", reason: "no_guidance_for_dialogue_act" };
  return { decision, reason: `dialogue_act_${String(dialogueAct).toLowerCase()}` };
}

