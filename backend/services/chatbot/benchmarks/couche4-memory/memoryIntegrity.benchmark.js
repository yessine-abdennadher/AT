import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deepMergeConstraints } from "../../memory/persistence/chatSessionStatePersistence.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "multiTurnDeepMerge.dataset.json"), "utf8"));

export async function runMemoryBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  for (const item of dataset) {
    const afterTurn1 = deepMergeConstraints(null, item.turn1);
    const afterTurn2 = deepMergeConstraints(afterTurn1, item.turn2);

    const exp = item.expectedAfterTurn2;
    const cityOk = afterTurn2.city === exp.city;
    const catOk = afterTurn2.category === exp.category;
    const amenOk = exp.amenities.every((a) => afterTurn2.amenities.includes(a));
    const exclOk = !exp.excludedAmenities || exp.excludedAmenities.every((a) => afterTurn2.excluded?.amenities?.includes(a));

    if (cityOk && catOk && amenOk && exclOk) {
      passed += 1;
    } else {
      failures.push({ expected: exp, got: afterTurn2 });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 4 - Mémoire & Deep Merge Multi-Tours",
    passed,
    total: dataset.length,
    accuracy: Number(((passed / dataset.length) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runMemoryBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

