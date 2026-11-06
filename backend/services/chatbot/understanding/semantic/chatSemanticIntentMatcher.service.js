import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripDiacritics } from "../../shared/textUtils.js";
import { computeSubwordEmbedding, cosineDense } from "./chatMiniLmEmbedder.service.js";

const CORPUS_PATH = join(dirname(fileURLToPath(import.meta.url)), "corpus", "semanticIntentCorpus.json");
let index = null;

const tokenize = (text) => stripDiacritics(text).split(/[^\p{L}\p{N}_]+/u).filter((t) => t.length > 1);

function buildIndex() {
  const corpus = JSON.parse(readFileSync(CORPUS_PATH, "utf8"));
  const docs = [];
  const df = new Map();
  for (const [intent, phrases] of Object.entries(corpus)) {
    for (const phrase of phrases) {
      const tokens = tokenize(phrase);
      const denseVec = computeSubwordEmbedding(phrase);
      docs.push({ intent, phrase, tokens, denseVec });
      new Set(tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    }
  }
  return { docs, df, total: docs.length };
}

function vectorizeTfIdf(tokens, idx) {
  const vector = new Map();
  for (const token of tokens) {
    const idf = Math.log(1 + idx.total / (1 + (idx.df.get(token) || 0)));
    vector.set(token, (vector.get(token) || 0) + idf);
  }
  return vector;
}

function cosineSparse(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [k, v] of a) {
    na += v * v;
    if (b.has(k)) dot += v * b.get(k);
  }
  for (const v of b.values()) nb += v * v;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * Couche Sémantique Hybride (MiniLM Subword Dense Embeddings + TF-IDF Cosine).
 * Retourne l'intention la plus proche dans le corpus multilingue (FR/EN/AR/Derja).
 */
export function matchSemanticIntent(text = "") {
  index ||= buildIndex();
  const queryTokens = tokenize(text);
  const querySparse = vectorizeTfIdf(queryTokens, index);
  const queryDense = computeSubwordEmbedding(text);

  let best = { intent: null, score: 0, matchedPhrase: null };
  for (const doc of index.docs) {
    const sparseScore = cosineSparse(querySparse, vectorizeTfIdf(doc.tokens, index));
    const denseScore = cosineDense(queryDense, doc.denseVec);
    const hybridScore = sparseScore * 0.65 + denseScore * 0.35;
    if (hybridScore > best.score) {
      best = { intent: doc.intent, score: hybridScore, matchedPhrase: doc.phrase };
    }
  }
  return {
    intent: best.intent,
    confidence: Number(best.score.toFixed(3)),
    matchedPhrase: best.matchedPhrase,
    source: "semantic_minilm",
  };
}
