import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeChatText } from "../../understanding/normalization/chatTextNormalizer.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const noisy = JSON.parse(readFileSync(join(dir, "datasets", "noisyInputs.dataset.json"), "utf8"));
const arabizi = JSON.parse(readFileSync(join(dir, "datasets", "arabiziTunisian.dataset.json"), "utf8"));

export async function runNormalizationBenchmark() {
  const start = performance.now();
  let passed = 0;
  let total = noisy.length + arabizi.length;
  const failures = [];

  for (const item of noisy) {
    const res = normalizeChatText(item.input);
    const textOk = res.normalizedText.includes(item.expected);
    const cityOk = !item.mustContainCity || res.detectedCities.includes(item.mustContainCity);
    if (textOk && cityOk) {
      passed += 1;
    } else {
      failures.push({ input: item.input, expected: item.expected, got: res.normalizedText });
    }
  }

  for (const item of arabizi) {
    const res = normalizeChatText(item.input);
    const tokensOk = item.expectedTokens.every((t) => res.normalizedText.includes(t));
    const cityOk = !item.expectedCity || res.detectedCities.includes(item.expectedCity);
    if (tokensOk && cityOk) {
      passed += 1;
    } else {
      failures.push({ input: item.input, expectedTokens: item.expectedTokens, got: res.normalizedText });
    }
  }

  const durationMs = performance.now() - start;
  return {
    layer: "Couche 0 - Normalisation & Arabizi",
    passed,
    total,
    accuracy: Number(((passed / total) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runNormalizationBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

