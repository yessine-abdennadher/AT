import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeChatText } from "../../understanding/normalization/chatTextNormalizer.service.js";
import { classifyTurn } from "../../understanding/classification/chatClassification.facade.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "intentAndConstraints.dataset.json"), "utf8"));

export async function runClassificationBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  for (const item of dataset) {
    const norm = normalizeChatText(item.input);
    const cl = classifyTurn({ normalized: norm });

    const catOk = !item.expectedCategory || cl.constraints.category === item.expectedCategory;
    const cityOk = !item.expectedCity || cl.constraints.city === item.expectedCity;
    const amenOk = !item.expectedAmenity || cl.constraints.amenities.includes(item.expectedAmenity);
    const exclOk = !item.expectedExcludedAmenity || cl.constraints.excluded?.amenities?.includes(item.expectedExcludedAmenity);
    const actOk = !item.expectedAct || cl.dialogueAct === item.expectedAct;
    const detailOk = !item.expectedDetailIntent || cl.detailIntent === item.expectedDetailIntent;

    if (catOk && cityOk && amenOk && exclOk && actOk && detailOk) {
      passed += 1;
    } else {
      failures.push({ input: item.input, got: cl, expected: item });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 2 - Classification & Contraintes",
    passed,
    total: dataset.length,
    accuracy: Number(((passed / dataset.length) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runClassificationBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

