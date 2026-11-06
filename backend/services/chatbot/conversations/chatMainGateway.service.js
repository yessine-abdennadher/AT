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
  const processTurn = async ({ sessionId, text }) => {
    const state = normalizeState(await stateStore.get(sessionId)) || createInitialState();
    const memory = projectMemoryFrame(state);

    const normalized = normalizeChatText(text);
    const fastPath = matchFastPath(normalized);
    const classification = classifyTurn({ normalized, memory });
    const semantic = matchSemanticIntent(normalized.normalizedText);

    const needsLlmIntent =
      !fastPath.matched &&
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

    const result = await runExplorerTurn({ understanding, state, repository, compose });
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
    handleTurn: ({ sessionId, text }) => withTurnLock(sessionId, () => processTurn({ sessionId, text })),
  };
}

let defaultGateway = null;

/** Fournisseur de réponses prêt à l'emploi pour `chatMessage.controller`. */
export const chatbotReplyProvider = async ({ text, sessionId }) => {
  defaultGateway ||= createChatMainGateway();
  return defaultGateway.handleTurn({ sessionId, text });
};
