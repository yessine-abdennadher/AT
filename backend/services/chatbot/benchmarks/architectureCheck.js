import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHATBOT_ROOT = join(__dirname, "..");

function listJsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") files.push(...listJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

const FORBIDDEN_RULES = [
  {
    layer: "understanding/",
    forbiddenImportPatterns: ["/capabilities/", "/conversations/", "/models/Activity"],
    description: "La couche 'understanding' doit être pure et ne jamais dépendre des capabilities ou des conversations.",
  },
  {
    layer: "capabilities/",
    forbiddenImportPatterns: ["/conversations/"],
    description: "La couche 'capabilities' ne doit jamais dépendre des orchestrateurs de conversations.",
  },
  {
    layer: "responses/",
    forbiddenImportPatterns: ["/capabilities/", "/conversations/", "/models/Activity"],
    description: "La couche 'responses' ne doit jamais lire la base de données ou les capacités métier directement.",
  },
  {
    layer: "guards/",
    forbiddenImportPatterns: ["/capabilities/", "/conversations/"],
    description: "Les pare-feux 'guards' doivent rester des fonctions pures et indépendantes.",
  },
];

export async function runArchitectureCheck() {
  const start = performance.now();
  const allFiles = listJsFiles(CHATBOT_ROOT);
  const violations = [];

  for (const filePath of allFiles) {
    const rel = relative(CHATBOT_ROOT, filePath).replace(/\\/g, "/");
    const content = readFileSync(filePath, "utf8");
    const importLines = content.split("\n").filter((line) => /^\s*import\s+.*from\s+['"]/.test(line));

    for (const rule of FORBIDDEN_RULES) {
      if (rel.startsWith(rule.layer)) {
        for (const line of importLines) {
          for (const pattern of rule.forbiddenImportPatterns) {
            if (line.includes(pattern)) {
              violations.push({
                file: rel,
                importLine: line.trim(),
                rule: rule.description,
              });
            }
          }
        }
      }
    }
  }

  const durationMs = performance.now() - start;
  const passed = violations.length === 0 ? 1 : 0;

  return {
    layer: "Contrôle d'Architecture & Frontières d'Imports (ArchitectureGuard)",
    passed,
    total: 1,
    accuracy: passed ? 100 : 0,
    durationMs: Number(durationMs.toFixed(2)),
    failures: violations,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runArchitectureCheck();
  console.log(JSON.stringify(res, null, 2));
}
