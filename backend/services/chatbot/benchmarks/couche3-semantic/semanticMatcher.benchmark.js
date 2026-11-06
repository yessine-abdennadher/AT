import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeChatText } from "../../understanding/normalization/chatTextNormalizer.service.js";
import { matchSemanticIntent } from "../../understanding/semantic/chatSemanticIntentMatcher.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "semanticCorpusHoldout.dataset.json"), "utf8"));

export async function runSemanticBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  for (const item of dataset) {
    const norm = normalizeChatText(item.input);
    const sem = matchSemanticIntent(norm.normalizedText);

    const intentOk = sem.intent === item.expectedIntent;
    const confOk = sem.confidence >= item.minConfidence;

    if (intentOk && confOk) {
      passed += 1;
    } else {
      failures.push({ input: item.input, expected: item.expectedIntent, got: sem.intent, confidence: sem.confidence });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 3 - Recherche Sémantique MiniLM",
    passed,
    total: dataset.length,
    accuracy: Number(((passed / dataset.length) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runSemanticBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

