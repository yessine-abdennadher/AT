import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getStaticVariants } from "../../responses/catalog/catalogLoader.js";
import { resolveResponse } from "../../responses/resolution/responseResolver.service.js";
import { dynamicResponseStore } from "../../responses/dynamicPool/dynamicResponseStore.service.js";
import { resetUsageCounters } from "../../responses/dynamicPool/responseUsageTracker.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "variantRotationAndExpansion.dataset.json"), "utf8"));

export async function runResponsesBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  for (const item of dataset) {
    const statics = getStaticVariants(item.lang, item.intentKey);
    if (statics.length >= item.minStaticVariants) {
      passed += 1;
    } else {
      failures.push({ intent: item.intentKey, lang: item.lang, expected: item.minStaticVariants, got: statics.length });
    }
  }

  dynamicResponseStore.clear();
  resetUsageCounters();
  let expansionTriggered = 0;
  const testExpander = async (args) => {
    expansionTriggered += 1;
    const { expandResponsePool } = await import("../../responses/dynamicPool/llmVariantGenerator.service.js");
    return expandResponsePool({ ...args, env: {} });
  };

  const seenVariants = new Set();
  for (let i = 0; i < 3; i += 1) {
    const r = resolveResponse({ intentKey: "GREETING", lang: "fr", recentVariantIds: [...seenVariants], expander: testExpander });
    if (r?.variantId) seenVariants.add(r.variantId);
  }
  await new Promise((resolve) => setTimeout(resolve, 25));

  const rotationOk = seenVariants.size >= 2;
  const expansionOk = expansionTriggered >= 1 && dynamicResponseStore.get("GREETING", "fr").length >= 1;

  if (rotationOk && expansionOk) {
    passed += 2;
  } else {
    failures.push({ rotationOk, expansionOk, expansionTriggered, dynamicPoolSize: dynamicResponseStore.get("GREETING", "fr").length });
  }

  const total = dataset.length + 2;
  const durationMs = performance.now() - start;
  return {
    layer: "Couche 5 - Réponses Multi-Variantes & Expansion LLM après 3 Usages",
    passed,
    total,
    accuracy: Number(((passed / total) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runResponsesBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

