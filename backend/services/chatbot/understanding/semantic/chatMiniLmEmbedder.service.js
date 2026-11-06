import { stripDiacritics } from "../../shared/textUtils.js";

const DEFAULT_MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const VECTOR_DIM = 128;

let extractorPromise = null;
let onnxUnavailable = false;

/**
 * Tente de charger le pipeline ONNX `@huggingface/transformers` (MiniLM multilingue)
 * s'il est installé et activé. Sinon bascule sans erreur sur l'embedder vectoriel
 * déterministe par n-grammes de caractères + mots (0 dépendance externe, < 1 ms).
 */
async function loadMiniLmPipeline(env = process.env) {
  if (onnxUnavailable || env.CHATBOT_DISABLE_ONNX === "1") return null;
  if (extractorPromise) return extractorPromise;

  extractorPromise = (async () => {
    try {
      const transformers = await import("@huggingface/transformers");
      const modelId = env.CHATBOT_MINILM_MODEL || DEFAULT_MODEL_ID;
      return await transformers.pipeline("feature-extraction", modelId, { quantized: true });
    } catch {
      onnxUnavailable = true;
      return null;
    }
  })();

  return extractorPromise;
}

function fnv1aHash(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Embedder subword/char-ngram (architecture de hachage type FastText/MiniLM léger)
 * produisant un vecteur dense normalisé L2 de dimension fixe.
 */
export function computeSubwordEmbedding(rawText = "") {
  const vec = new Float32Array(VECTOR_DIM);
  const cleaned = stripDiacritics(rawText);
  if (!cleaned) return vec;

  const words = cleaned.split(/[^\p{L}\p{N}_]+/u).filter(Boolean);
  for (const word of words) {
    const wordIdx = fnv1aHash(`w:${word}`) % VECTOR_DIM;
    vec[wordIdx] += 2.0;

    const padded = `<${word}>`;
    for (let n = 3; n <= 4; n += 1) {
      for (let i = 0; i <= padded.length - n; i += 1) {
        const ngram = padded.slice(i, i + n);
        const idx = fnv1aHash(ngram) % VECTOR_DIM;
        vec[idx] += 0.75;
      }
    }
  }

  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i += 1) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i += 1) vec[i] /= norm;
  }
  return vec;
}

export function cosineDense(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

export async function embedTextMiniLm(text = "", env = process.env) {
  const pipe = await loadMiniLmPipeline(env);
  if (pipe) {
    try {
      const output = await pipe(text, { pooling: "mean", normalize: true });
      if (output?.data) return Float32Array.from(output.data);
    } catch {
      onnxUnavailable = true;
    }
  }
  return computeSubwordEmbedding(text);
}
