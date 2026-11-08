import { runNormalizationBenchmark } from "./couche0-normalization/normalization.benchmark.js";
import { runFastPathBenchmark } from "./couche1-fastpath/fastPath.benchmark.js";
import { runClassificationBenchmark } from "./couche2-classification/classification.benchmark.js";
import { runSemanticBenchmark } from "./couche3-semantic/semanticMatcher.benchmark.js";
import { runMemoryBenchmark } from "./couche4-memory/memoryIntegrity.benchmark.js";
import { runResponsesBenchmark } from "./couche5-responses/responses.benchmark.js";
import { runArchitectureCheck } from "./architectureCheck.js";

async function runAll() {
  console.log("\n========================================================");
  console.log("   TFARHIDA AI / KHARJABOT — BENCHMARK GLOBAL COMPLET   ");
  console.log("========================================================\n");

  const started = performance.now();
  const results = [
    await runArchitectureCheck(),
    await runNormalizationBenchmark(),
    await runFastPathBenchmark(),
    await runClassificationBenchmark(),
    await runSemanticBenchmark(),
    await runMemoryBenchmark(),
    await runResponsesBenchmark(),
  ];

  const totalPassed = results.reduce((acc, r) => acc + r.passed, 0);
  const totalCases = results.reduce((acc, r) => acc + r.total, 0);
  const totalDurationMs = performance.now() - started;

  console.table(
    results.map((r) => ({
      Couche: r.layer,
      "Succès": `${r.passed}/${r.total}`,
      Précision: `${r.accuracy}%`,
      Durée: `${r.durationMs} ms`,
      Statut: r.passed === r.total ? "OK" : "ÉCHEC",
    }))
  );

  console.log(`\nRapport Global : ${totalPassed}/${totalCases} tests validés (${((totalPassed / totalCases) * 100).toFixed(1)}%) en ${totalDurationMs.toFixed(1)} ms.`);

  const hasFailures = results.some((r) => r.failures.length > 0);
  if (hasFailures) {
    console.error("\nDétail des échecs constatés :");
    results.filter((r) => r.failures.length > 0).forEach((r) => {
      console.error(`\n[${r.layer}] :`, JSON.stringify(r.failures, null, 2));
    });
    process.exitCode = 1;
  } else {
    console.log("\n100% des benchmarks de toutes les couches sont validés avec succès !");
    process.exitCode = 0;
  }
}

runAll();
