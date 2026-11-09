import { loadFastPathCatalogs } from "../fastPath/loaders/fastPathCatalog.loader.js";
import { KNOWN_CATEGORIES } from "../constraints/chatOutingConstraints.service.js";

const VALID_AMENITIES = new Set(["wifi", "climatisation", "terrasse", "power_backup", "vue_mer", "parking"]);
const VALID_BUDGETS = new Set(["low", "high"]);

function buildClassifierPrompt(userText, allowedIntents) {
  return [
    "Tu es le classifieur d'intentions NLU de KharjaBot (Tfarhida Tunisie).",
    "IMPORTANT : Tu ne dois JAMAIS répondre à l'utilisateur ni rédiger de phrase. Tu dois UNIQUEMENT extraire l'intention (intent) et les critères au format JSON strict.",
    "Comprends le Français, l'Arabe, l'Anglais et la Derja Tunisienne (Tounsi / Arabizi : 9ahwa=cafe, mekla=restaurant, kharja=sortie, wa9tech/mahloul=ASK_OPENING_HOURS, soum/menu=ASK_MENU_OR_PRICE, blassa/win=ASK_LOCATION_OR_MAPS, noumrou=ASK_CONTACT_OR_SOCIAL, rkhis=budget low).",
    `Intentions autorisées : ${allowedIntents.join(", ")}, UNKNOWN.`,
    `Catégories autorisées : ${KNOWN_CATEGORIES.join(", ")}, null.`,
    "Équipements autorisés : wifi, climatisation, terrasse, power_backup, vue_mer, parking.",
    `Message utilisateur : "${String(userText).slice(0, 300)}"`,
    'Réponds uniquement avec ce JSON : {"intent":"...","city":null,"category":null,"budgetLevel":null,"amenities":[]}',
  ].join("\n");
}

function sanitizeClassifiedPayload(raw, allowedIntentsSet) {
  if (!raw || typeof raw !== "object") return null;
  const intent = typeof raw.intent === "string" && allowedIntentsSet.has(raw.intent) ? raw.intent : "UNKNOWN";
  const category = typeof raw.category === "string" && KNOWN_CATEGORIES.includes(raw.category) ? raw.category : null;
  const city = typeof raw.city === "string" && raw.city.trim().length > 1 ? raw.city.trim() : null;
  const budgetLevel = VALID_BUDGETS.has(raw.budgetLevel) ? raw.budgetLevel : null;
  const amenities = Array.isArray(raw.amenities)
    ? raw.amenities.filter((a) => VALID_AMENITIES.has(a))
    : [];

  return {
    intent,
    confidence: intent !== "UNKNOWN" ? 0.84 : 0.2,
    source: "llm_intent_classifier",
    constraints: {
      city,
      cities: city ? [city] : [],
      category,
      categories: category ? [category] : [],
      budgetLevel,
      amenities,
      excluded: { amenities: [], categories: [] },
    },
  };
}

async function callGeminiClassifier({ prompt, apiKey, model, fetchImpl, signal }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? JSON.parse(text) : null;
}

async function callGroqClassifier({ prompt, apiKey, model, fetchImpl, signal }) {
  const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  return text ? JSON.parse(text) : null;
}

/**
 * Classifieur d'intention LLM (Gemini 2.5 Flash en priorité pour la Derja Tounsia,
 * Groq llama-3.3-70b-versatile en secours).
 * Ne génère JAMAIS la réponse finale au client : retourne uniquement l'intent et les contraintes.
 */
export async function classifyIntentWithLlm({
  text = "",
  env = process.env,
  fetchImpl = globalThis.fetch,
  timeoutMs = 2500,
} = {}) {
  const geminiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  const groqKey = env.GROQ_API_KEY;
  if ((!geminiKey && !groqKey) || !fetchImpl || !String(text).trim()) {
    return null;
  }

  const { supportedIntents } = loadFastPathCatalogs();
  const allowedIntents = [...supportedIntents];
  const prompt = buildClassifierPrompt(text, allowedIntents);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let raw = null;
    if (geminiKey) {
      const model = env.CHATBOT_GEMINI_INTENT_MODEL || "gemini-2.5-flash";
      raw = await callGeminiClassifier({ prompt, apiKey: geminiKey, model, fetchImpl, signal: controller.signal }).catch(() => null);
    }
    if (!raw && groqKey) {
      const model = env.CHATBOT_GROQ_INTENT_MODEL || "llama-3.3-70b-versatile";
      raw = await callGroqClassifier({ prompt, apiKey: groqKey, model, fetchImpl, signal: controller.signal }).catch(() => null);
    }
    return sanitizeClassifiedPayload(raw, supportedIntents);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
