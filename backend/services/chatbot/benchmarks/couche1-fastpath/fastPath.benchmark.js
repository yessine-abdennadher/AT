import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeChatText } from "../../understanding/normalization/chatTextNormalizer.service.js";
import { matchFastPath } from "../../understanding/fastPath/chatFastPathMatcher.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "fastPathExactHits.dataset.json"), "utf8"));

export async function runFastPathBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  for (const item of dataset) {
    const norm = normalizeChatText(item.input);
    const hit = matchFastPath(norm);
    const matchOk = hit.matched === item.expectedMatched;
    const intentOk = !item.expectedIntent || hit.intent === item.expectedIntent;
    if (matchOk && intentOk) {
      passed += 1;
    } else {
      failures.push({ input: item.input, expected: item.expectedIntent, got: hit.intent, matched: hit.matched });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 1 - FastPath (0 ms)",
    passed,
    total: dataset.length,
    accuracy: Number(((passed / dataset.length) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    avgLatencyPerQueryMs: Number((durationMs / dataset.length).toFixed(3)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runFastPathBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

