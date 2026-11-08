# Plan d'Action 02 — Séparation de `semantic/`, `llm/` et `arbiter/` dans `understanding/`

## 1. Objectif
Séparer les 3 responsabilités actuellement mélangées dans `understanding/semantic/` afin de respecter le principe de responsabilité unique (SRP) :
1. **`understanding/semantic/` (Étape 3)** : Uniquement la recherche sémantique vectorielle locale par Embeddings MiniLM / TF-IDF cosinus (0 réseau, < 10 ms).
2. **`understanding/llm/` (Étape 4)** : Uniquement le classifieur d'intention LLM distant (Gemini Flash / Groq) utilisé en dernier recours si les étapes 1 à 3 ont échoué.
3. **`understanding/arbiter/` (Étape 5)** : L'arbitre souverain (`chatUnderstandingArbiter.service.js`) et le contrat canonique (`turnUnderstanding.contract.js`) qui orchestrent et arbitrent entre toutes les étapes (`1 -> 2 -> 3 -> 4`).

---

## 2. Arborescence Cible

```text
understanding/
│
├── semantic/                                              <-- ÉTAPE 3 : RECHERCHE SÉMANTIQUE LOCALE (MINILM — 0 RÉSEAU)
│   ├── config/
│   │   └── semanticThresholds.config.js                   (Seuils cosinus 0.58/0.75, marges d'ambiguïté, topK)
│   ├── corpus/
│   │   ├── explorer/                                      (placeDiscovery.json, outingPlanning.json, details.json)
│   │   ├── partner/                                       (partnerManagement.json)
│   │   └── semanticIntentCorpus.json                      (Corpus consolidé)
│   ├── loaders/
│   │   └── semanticCorpus.loader.js                       (Chargement & pré-calcul des embeddings MiniLM en mémoire)
│   ├── chatClauseSegmenter.service.js                     (Découpage en propositions pour requêtes multi-étapes)
│   ├── chatMiniLmEmbedder.service.js                      (Moteur d'embeddings local ONNX / MiniLM)
│   └── chatSemanticIntentMatcher.service.js               (Calcul pur de similarité cosinus & marge inter-intentions)
│
├── llm/                                                   <-- ÉTAPE 4 : FALLBACK LLM EXTERNE ISOLÉ (GEMINI FLASH / GROQ)
│   ├── config/
│   │   └── llmClassifier.config.js                        (Timeout strict 2500 ms, température 0.0, circuit-breaker)
│   ├── prompts/
│   │   └── intentClassificationPrompt.builder.js          (Prompt système fermé : classification JSON pure, 0 rédaction)
│   ├── providers/
│   │   ├── geminiFlashClassifier.provider.js              (Adaptateur primaire Gemini 2.5 Flash)
│   │   └── groqLlamaClassifier.provider.js                (Adaptateur secondaire de secours Groq Llama 3.3)
│   ├── validators/
│   │   └── llmIntentOutput.validator.js                   (Validation stricte contre supportedIntentContract.json)
│   └── chatLlmIntentClassifier.service.js                 (Façade d'orchestration LLM)
│
└── arbiter/                                               <-- ÉTAPE 5 : ARBITRE SOUVERAIN MULTI-COUCHES & CONTRAT CANONIQUE
    ├── contracts/
    │   ├── turnUnderstanding.contract.js                  (Contrat immuable final `turnUnderstanding`)
    │   └── understandingDecisionTrace.schema.js           (Trace d'auditabilité de la décision)
    ├── policies/
    │   ├── pendingQuestionResolution.policy.js            (Résolution prioritaire sur ville / catégorie / budget attendu)
    │   └── languageContinuity.policy.js                   (Maintien de la langue active Derja/AR/FR sur réponses courtes)
    └── chatUnderstandingArbiter.service.js                (Arbitre final : FastPath [1] -> Classification [2] -> MiniLM [3] -> LLM [4])
```

---

## 3. Étapes de Migration Sans Régression

1. **Créer `understanding/llm/`** :
   - Déplacer la logique de `chatLlmIntentClassifier.service.js` vers `understanding/llm/chatLlmIntentClassifier.service.js`.
   - Découper le prompt dans `prompts/intentClassificationPrompt.builder.js` et le validateur dans `validators/llmIntentOutput.validator.js`.
2. **Créer `understanding/arbiter/`** :
   - Déplacer `turnUnderstanding.contract.js` vers `understanding/arbiter/contracts/turnUnderstanding.contract.js`.
   - Déplacer `chatUnderstandingArbiter.service.js` vers `understanding/arbiter/chatUnderstandingArbiter.service.js`.
3. **Mettre à jour les imports dans `conversations/chatMainGateway.service.js`** :
   - Importer `classifyIntentWithLlm` depuis `../understanding/llm/chatLlmIntentClassifier.service.js`.
   - Importer `arbitrateUnderstanding` depuis `../understanding/arbiter/chatUnderstandingArbiter.service.js`.
4. **Conserver des ré-exports temporaires dans `understanding/semantic/`** si des scripts tiers les importent, puis vérifier avec `node backend/services/chatbot/benchmarks/runAllBenchmarks.js`.

