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
    const rc = hit.ruleConstraints || {};
    const ruleOk = !item.expectedRuleId || hit.ruleMetadata?.matchedRuleIds?.includes(item.expectedRuleId);
    const catOk = !item.expectedCategory || rc.category === item.expectedCategory;
    const amenOk = !item.expectedAmenity || rc.amenities?.includes(item.expectedAmenity);
    const groupOk = !item.expectedGroup || rc.group === item.expectedGroup;
    const budgetOk = item.expectedMaxBudget === undefined || rc.maxBudget === item.expectedMaxBudget;
    const nearOk = item.expectedNearMe === undefined || rc.nearMe === item.expectedNearMe;
    const sitOk = !item.expectedSituation || rc.situation === item.expectedSituation;
    if (matchOk && intentOk && ruleOk && catOk && amenOk && groupOk && budgetOk && nearOk && sitOk) {
      passed += 1;
    } else {
      failures.push({ input: item.input, expected: item, got: { intent: hit.intent, matched: hit.matched, rule: hit.ruleMetadata, constraints: hit.ruleConstraints } });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 1 - FastPath (Exact O(1) + Règles Schema 1.0.0)",
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

