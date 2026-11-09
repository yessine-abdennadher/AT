import { loadFastPathCatalogs } from "../fastPath/loaders/fastPathCatalog.loader.js";
import { LLM_CLASSIFIER_CONFIG } from "./config/llmClassifier.config.js";
import { buildClassifierPrompt } from "./prompts/intentClassificationPrompt.builder.js";
import { callGeminiClassifier } from "./providers/geminiFlashClassifier.provider.js";
import { callGroqClassifier } from "./providers/groqLlamaClassifier.provider.js";
import { sanitizeClassifiedPayload } from "./validators/llmIntentOutput.validator.js";

/**
 * Classifieur d'intention LLM (Étape 4 — dernier recours isolé).
 * Gemini Flash en priorité pour la Derja tunisienne, Groq Llama en secours.
 * Ne génère JAMAIS la réponse finale au client : retourne uniquement l'intent et les contraintes.
 */
export async function classifyIntentWithLlm({
  text = "",
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = LLM_CLASSIFIER_CONFIG.DEFAULT_TIMEOUT_MS,
} = {}) {
  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  const groqKey = env.GROQ_API_KEY;
  if ((!geminiKey && !groqKey) || !fetchImpl || !String(text).trim()) {
    return null;
  }

  const { supportedIntents } = loadFastPathCatalogs();
  const prompt = buildClassifierPrompt(text, [...supportedIntents]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let raw = null;
    if (geminiKey) {
      const model = env.CHATBOT_GEMINI_INTENT_MODEL || LLM_CLASSIFIER_CONFIG.DEFAULT_GEMINI_MODEL;
      raw = await callGeminiClassifier({ prompt, apiKey: geminiKey, model, fetchImpl, signal: controller.signal }).catch(() => null);
    }
    if (!raw && groqKey) {
      const model = env.CHATBOT_GROQ_INTENT_MODEL || LLM_CLASSIFIER_CONFIG.DEFAULT_GROQ_MODEL;
      raw = await callGroqClassifier({ prompt, apiKey: groqKey, model, fetchImpl, signal: controller.signal }).catch(() => null);
    }
    return sanitizeClassifiedPayload(raw, supportedIntents);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
