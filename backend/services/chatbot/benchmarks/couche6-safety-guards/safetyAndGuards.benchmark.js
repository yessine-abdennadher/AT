import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateChatSafety } from "../../capabilities/safety/chatSafety.service.js";
import { privacyLeakGuard } from "../../guards/privacyLeakGuard.service.js";
import { roleIsolationGuard } from "../../guards/roleIsolationGuard.service.js";
import { hallucinationGuard } from "../../guards/hallucinationGuard.service.js";
import { resolveAppHelpTopic, validateDeepLinkAction } from "../../capabilities/appHelp/appNavigationGuide.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "safetyAndGuards.dataset.json"), "utf8"));

export async function runSafetyAndGuardsBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  for (const item of dataset) {
    if (item.type === "safety") {
      const res = evaluateChatSafety(item.text, "fr");
      const ok = res.isSafe === item.expectedSafe && res.flag === item.expectedFlag;
      if (ok) {
        passed += 1;
      } else {
        failures.push({ id: item.id, expected: item.expectedSafe, got: res });
      }
    } else if (item.type === "privacy") {
      const res = privacyLeakGuard(item.text);
      if (res.flagged && res.text.includes(item.expectedMasked)) {
        passed += 1;
      } else {
        failures.push({ id: item.id, expected: item.expectedMasked, got: res });
      }
    } else if (item.type === "role_isolation") {
      const res = roleIsolationGuard(item.text, item.role);
      if (res.flagged && res.text.includes(item.expectedMasked)) {
        passed += 1;
      } else {
        failures.push({ id: item.id, expected: item.expectedMasked, got: res });
      }
    } else if (item.type === "hallucination") {
      const res = hallucinationGuard(item.text, item.activities);
      if (item.expectedMasked) {
        if (res.flagged && res.text.includes(item.expectedMasked)) {
          passed += 1;
        } else {
          failures.push({ id: item.id, expected: item.expectedMasked, got: res });
        }
      } else if (item.expectedKeep) {
        if (!res.flagged && res.text.includes(item.expectedKeep)) {
          passed += 1;
        } else {
          failures.push({ id: item.id, expected: item.expectedKeep, got: res });
        }
      }
    } else if (item.type === "help") {
      const topic = resolveAppHelpTopic({ topicId: item.topicId, role: item.role, lang: "fr" });
      const actionValidation = validateDeepLinkAction(
        topic?.actionButton?.actionType,
        topic?.actionButton?.params
      );
      const ok =
        topic?.actionButton?.actionType === item.expectedActionType &&
        topic?.actionButton?.params?.tab === item.expectedTab &&
        actionValidation.valid;
      if (ok) {
        passed += 1;
      } else {
        failures.push({ id: item.id, topic, actionValidation });
      }
    }
  }

  const total = dataset.length;
  const durationMs = performance.now() - start;

  return {
    layer: "Couche 6 - App Help, Modération Sécurité (0 LLM) & Garde-Fous",
    passed,
    total,
    accuracy: Number(((passed / total) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runSafetyAndGuardsBenchmark();
  console.log(JSON.stringify(res, null, 2));
}

