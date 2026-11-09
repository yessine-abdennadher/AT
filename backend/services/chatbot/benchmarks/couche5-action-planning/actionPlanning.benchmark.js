import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOutingPlanGraph, validateOutingPlanGraph } from "../../capabilities/actionPlanning/chatOutingPlanGraph.service.js";
import { resolvePlanGuidance } from "../../capabilities/actionPlanning/chatOutingPlanGuidance.service.js";
import { executeOutingPlan } from "../../capabilities/actionPlanning/chatOutingPlanExecutor.service.js";

const dir = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(readFileSync(join(dir, "datasets", "multiStepOuting.dataset.json"), "utf8"));

export async function runActionPlanningBenchmark() {
  const start = performance.now();
  let passed = 0;
  const failures = [];

  // Mock repository pour le test d'exécution
  const mockActivities = [
    { _id: "act-cafe-1", title: "Café des Délices", category: "cafe", address: { city: "Tunis" }, price: 10 },
    { _id: "act-resto-1", title: "Restaurant Le Pirate", category: "restaurant", address: { city: "Tunis" }, price: 40 },
    { _id: "act-lounge-1", title: "Lounge Marina", category: "lounge", address: { city: "Tunis" }, price: 60 },
  ];

  const mockRepository = {
    find: async (query = {}, limit = 40) => {
      let filtered = mockActivities;
      if (query.category) {
        filtered = filtered.filter((a) => a.category === query.category);
      }
      if (query._id && query._id.$nin) {
        const excludeSet = new Set(query._id.$nin.map(String));
        filtered = filtered.filter((a) => !excludeSet.has(String(a._id)));
      }
      return filtered.slice(0, limit);
    },
    count: async () => mockActivities.length,
  };

  for (const item of dataset) {
    if (item.categories && item.expectedStepsCount) {
      // Test de génération de DAG et validation acyclique
      const steps = buildOutingPlanGraph(item.categories);
      const validation = validateOutingPlanGraph({ steps });
      const ok = steps.length === item.expectedStepsCount && validation.valid === item.expectValidDag;
      if (ok) {
        passed += 1;
      } else {
        failures.push({ id: item.id, reason: "dag_steps_mismatch", steps, validation });
      }
    } else if (item.dialogueAct && item.expectedDecision) {
      // Test de guidage sans regex
      const plan = { status: item.planStatus };
      const guidance = resolvePlanGuidance({ plan, dialogueAct: item.dialogueAct });
      if (guidance.decision === item.expectedDecision) {
        passed += 1;
      } else {
        failures.push({ id: item.id, expected: item.expectedDecision, got: guidance.decision, guidance });
      }
    } else if (item.expectNonDuplicateActivities) {
      // Test d'exécution séquentielle sans doublon
      const steps = buildOutingPlanGraph(item.categories);
      const executed = await executeOutingPlan({
        repository: mockRepository,
        steps,
        constraints: { city: item.city },
        userCoords: { lat: 36.8, lng: 10.18 },
      });

      const pickedIds = executed.map((s) => s.activityId).filter(Boolean);
      const uniqueIds = new Set(pickedIds);
      const allDone = executed.every((s) => s.status === "done" && s.activity !== null);

      if (allDone && uniqueIds.size === pickedIds.length && pickedIds.length === item.categories.length) {
        passed += 1;
      } else {
        failures.push({ id: item.id, executed, reason: "duplicate_or_missing_activities" });
      }
    }
  }

  // Test supplémentaire : Détection de cycle dans le DAG
  const cyclicSteps = [
    { id: "step_1", dependencies: ["step_2"] },
    { id: "step_2", dependencies: ["step_1"] },
  ];
  const cycleCheck = validateOutingPlanGraph({ steps: cyclicSteps });
  if (!cycleCheck.valid && cycleCheck.reason === "cycle_detected") {
    passed += 1;
  } else {
    failures.push({ id: "cycle-detection-test", expected: "cycle_detected", got: cycleCheck });
  }

  const total = dataset.length + 1;
  const durationMs = performance.now() - start;

  return {
    layer: "Couche 5b - Planification d'Actions & Sorties Multi-Étapes (DAG)",
    passed,
    total,
    accuracy: Number(((passed / total) * 100).toFixed(1)),
    durationMs: Number(durationMs.toFixed(2)),
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runActionPlanningBenchmark();
  console.log(JSON.stringify(res, null, 2));
}
