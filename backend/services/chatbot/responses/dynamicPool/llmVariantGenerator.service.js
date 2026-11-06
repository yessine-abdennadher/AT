import { createHash } from "node:crypto";
import { placeholdersOf } from "../resolution/variableInterpolator.service.js";
import { dynamicResponseStore } from "./dynamicResponseStore.service.js";

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const LANG_NAMES = { fr: "français", en: "English", ar: "arabe tunisien (écriture arabe)", derja: "derja tunisienne en arabizi" };

const MORPH = {
  fr: { leads: ["Bonne nouvelle :", "Voilà pour vous :", "Alors :"], closers: ["N'hésitez pas à préciser.", "Dites-moi si vous voulez affiner."] },
  en: { leads: ["Good news:", "Here you go:", "So:"], closers: ["Feel free to refine.", "Tell me if you want to narrow it down."] },
  ar: { leads: ["خبر باهي:", "هاك:", "إذن:"], closers: ["قلي كان تحب تدقق.", "نجم نحسن البحث كان تحب."] },
  derja: { leads: ["Khabar behi:", "Haw:", "Donc:"], closers: ["9olli kan t7eb tdha99a9.", "Nejjem n7asen el be7th kan t7eb."] },
};

const stableId = (text) => `dyn_${createHash("sha1").update(text).digest("hex").slice(0, 10)}`;

function isValidVariant(text, required) {
  if (typeof text !== "string" || !text.trim() || text.length > 300 || EMOJI_REGEX.test(text)) return false;
  const found = placeholdersOf(text);
  return required.every((p) => found.includes(p)) && found.every((p) => required.includes(p));
}

async function generateWithLlm({ intentKey, lang, existing, required, env, fetchImpl }) {
  const apiKey = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  if (!apiKey || !fetchImpl) return [];
  const model = env.CHATBOT_VARIANT_MODEL || "gemini-2.0-flash";
  const prompt = [
    `Écris 2 nouvelles formulations en ${LANG_NAMES[lang] || "français"} pour l'intention "${intentKey}" d'un chatbot de sorties.`,
    `Mêmes variables obligatoires, recopiées à l'identique : ${required.map((p) => `{${p}}`).join(" ") || "(aucune)"}.`,
    "Pas d'emoji, 1 à 2 phrases courtes, ton chaleureux. Exemples existants :",
    ...existing.map((t) => `- ${t}`),
    "Réponds uniquement par un tableau JSON de 2 chaînes.",
  ].join("\n");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.9 } }) }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const parsed = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function generateCombinatorial({ intentKey, lang, existing }) {
  const table = MORPH[lang] || MORPH.fr;
  const useLead = /^(DISCOVER_|PLAN_|DETAIL_)/.test(intentKey);
  return existing.flatMap((text) => (useLead ? table.leads.map((l) => `${l} ${text}`) : table.closers.map((c) => `${text} ${c}`)));
}

/**
 * Enrichit le pool (intent, lang) : LLM si clé configurée, sinon synthèse combinatoire.
 * Ne bloque jamais le tour (appelé en tâche de fond) et ne lève jamais d'erreur.
 */
export async function expandResponsePool({ intentKey, lang, staticVariants, env = process.env, fetchImpl = globalThis.fetch, store = dynamicResponseStore }) {
  try {
    const existing = [...staticVariants, ...store.get(intentKey, lang)].map((v) => v.text);
    if (!existing.length) return [];
    const required = placeholdersOf(existing[0]);
    let candidates = await generateWithLlm({ intentKey, lang, existing: existing.slice(0, 3), required, env, fetchImpl });
    candidates = candidates.filter((t) => isValidVariant(t, required) && !existing.includes(t));
    if (!candidates.length) {
      candidates = generateCombinatorial({ intentKey, lang, existing: existing.slice(0, 3) }).filter((t) => isValidVariant(t, required) && !existing.includes(t));
    }
    const picked = candidates.slice(0, 2).map((text) => ({ id: stableId(text), text, dynamic: true }));
    return store.add(intentKey, lang, picked);
  } catch {
    return [];
  }
}

