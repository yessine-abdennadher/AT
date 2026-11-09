import { normalizeChatText } from "../understanding/normalization/chatTextNormalizer.service.js";
import { matchFastPath } from "../understanding/fastPath/chatFastPathMatcher.service.js";
import { classifyTurn } from "../understanding/classification/chatClassification.facade.js";
import { matchSemanticIntent } from "../understanding/semantic/chatSemanticIntentMatcher.service.js";
import { classifyIntentWithLlm } from "../understanding/semantic/chatLlmIntentClassifier.service.js";
import { SEMANTIC_THRESHOLDS } from "../understanding/semantic/config/semanticThresholds.config.js";
import { arbitrateUnderstanding } from "../understanding/semantic/chatUnderstandingArbiter.service.js";
import { createInitialState, normalizeState } from "../memory/conversation/chatWorkflowStateSchema.service.js";
import { projectMemoryFrame } from "../memory/conversation/chatMemoryFrameProjector.service.js";
import { appendTurn } from "../memory/conversation/chatConversationHistory.service.js";
import { recordResponseUsage } from "../memory/recommendations/chatResponseUsageMemory.service.js";
import { createInMemoryStateStore } from "../memory/persistence/chatSessionStatePersistence.service.js";
import { withTurnLock } from "../memory/persistence/chatSessionTurnLock.service.js";
import { createMongoActivityRepository } from "../capabilities/recommendations/activityRepository.mongo.js";
import { validateChatResponseDto } from "../responses/validation/chatResponseDtoValidator.service.js";
import { outputGuard } from "../guards/outputGuard.service.js";
import { runExplorerTurn } from "./explorer/chatExplorerOrchestrator.service.js";

// Les intentions partenaire sont redirigées vers l'aide générale (chatbot dédié aux utilisateurs/explorateurs).
const PARTNER_INTENTS = new Set(["PARTNER_MANAGE_ACTIVITY", "PARTNER_HOURS_HELP", "PARTNER_PROMOTION_HELP"]);

/**
 * Point d'entrée unique du chatbot :
 * TurnLock -> Memory -> Understanding (FastPath -> Classification -> MiniLM -> Gemini/Groq Intent Classifier)
 * -> Explorer Orchestrator -> Controlled Responses Pool -> Guards -> DTO.
 */
export function createChatMainGateway({
  repository = createMongoActivityRepository(),
  stateStore = createInMemoryStateStore(),
  llmIntentClassifier = classifyIntentWithLlm,
  compose = {},
} = {}) {
  const processTurn = async ({ sessionId, text, userContext = {} }) => {
    const state = normalizeState(await stateStore.get(sessionId)) || createInitialState();
    const memory = projectMemoryFrame(state);

    const normalized = normalizeChatText(text);
    const fastPath = matchFastPath(normalized);
    const classification = classifyTurn({ normalized, memory });
    const semantic = matchSemanticIntent(normalized.normalizedText);

    const needsLlmIntent =
      !fastPath.matched &&
      !fastPath.ruleMatched &&
      !classification.detailIntent &&
      !classification.hasConstraints &&
      classification.dialogueAct !== "RESET" &&
      (!semantic.intent || semantic.confidence < SEMANTIC_THRESHOLDS.MEDIUM_CONFIDENCE);

    const llmClassification = needsLlmIntent
      ? await llmIntentClassifier({ text: normalized.originalText || text })
      : null;

    let understanding = arbitrateUnderstanding({
      normalized,
      fastPath,
      classification,
      semantic,
      llmClassification,
      memory,
    });
    if (PARTNER_INTENTS.has(understanding.intent)) {
      understanding = { ...understanding, intent: "HELP_GENERAL" };
    }

    // Détection des puces rapides "Toutes les sorties" et "Autre zone"
    const normLower = (normalized.normalizedText || "").toLowerCase();
    const isShowAllChip =
      normLower.includes("toutes les sorties") ||
      normLower.includes("kol el kharjet") ||
      normLower.includes("كل الانشطة") ||
      normLower.includes("كل الأنشطة") ||
      normLower.includes("all outings");

    const isOtherZoneChip =
      normLower.includes("autre zone") ||
      normLower.includes("zone o5ra") ||
      normLower.includes("منطقة اخرى") ||
      normLower.includes("منطقة أخرى") ||
      normLower.includes("other area");

    if (isShowAllChip) {
      understanding = {
        ...understanding,
        intent: "DISCOVER_ACTIVITIES",
        constraints: {
          ...understanding.constraints,
          category: null,
          categories: [],
          budgetLevel: null,
          situation: null,
          group: null,
          mood: null,
          neighborhood: null,
          neighborhoods: [],
        },
      };
    } else if (isOtherZoneChip) {
      understanding = {
        ...understanding,
        intent: "RESET_SEARCH",
        constraints: {
          ...understanding.constraints,
          neighborhood: null,
          neighborhoods: [],
        },
      };
    }

    // Si la ville n'a pas été explicitement mentionnée mais que l'utilisateur a une contrainte (catégorie/quartier) ou une ville connue
    if (
      !understanding.constraints?.city &&
      (userContext.userCity || understanding.constraints?.neighborhood || understanding.constraints?.categories?.length)
    ) {
      const activeCity = userContext.userCity || state.activeConstraints?.city || (understanding.constraints?.neighborhood ? "Sfax" : null);
      if (activeCity) {
        understanding = {
          ...understanding,
          constraints: { ...understanding.constraints, city: activeCity },
        };
      }
    }

    const result = await runExplorerTurn({
      understanding,
      state,
      repository,
      compose,
      hasGps: Boolean(userContext.hasGps),
    });
    const { resolution, message } = result.composed;

    let next = recordResponseUsage(result.state, {
      intentKey: resolution.intentKey,
      lang: resolution.lang,
      variantId: resolution.variantId,
    });
    next = { ...next, preferredLanguage: understanding.language };
    next = appendTurn(next, {
      userText: text.slice(0, 300),
      intent: understanding.intent,
      source: understanding.source,
      status: next.status,
    });
    await stateStore.set(sessionId, next);

    const guarded = outputGuard(message, { activities: result.grounding });
    return validateChatResponseDto(guarded);
  };

  return {
    handleTurn: ({ sessionId, text, userContext = {} }) =>
      withTurnLock(sessionId, () => processTurn({ sessionId, text, userContext })),
  };
}

let defaultGateway = null;

/** Fournisseur de réponses prêt à l'emploi pour `chatMessage.controller`. */
export const chatbotReplyProvider = async ({ text, sessionId, userContext = {} }) => {
  defaultGateway ||= createChatMainGateway();
  return defaultGateway.handleTurn({ sessionId, text, userContext });
};
