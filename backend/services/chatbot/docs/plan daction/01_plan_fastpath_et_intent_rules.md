# Plan d'Action 01 — Refonte `understanding/fastPath/` & Intégration des Règles Déclaratives (`Schema 1.0.0`)

## 1. Objectif
Unifier la détection rapide déterministe au sein de **`backend/services/chatbot/understanding/fastPath/`** (sans créer de dossier `rules/` redondant) en combinant :
1. **Passe 1A (Exact Lookup `O(1)` — 0.01 ms)** : Table de hachage pour les mots courts, salutations et clics de puces.
2. **Passe 1B (Compiled Pattern Rules `schemaVersion: "1.0.0"` — < 0.4 ms)** : Expressions régulières multilingues pré-compilées (FR, EN, AR, Derja/Arabizi), triées par `priority DESC` puis `confidence DESC`.

---

## 2. Arborescence Cible de `understanding/fastPath/`

```text
understanding/fastPath/
├── catalogs/
│   ├── fr/
│   │   ├── common.json
│   │   ├── discovery.json
│   │   └── partner.json
│   ├── en/
│   │   └── common.json
│   ├── ar/
│   │   └── common.json
│   ├── derja/
│   │   └── common.json
│   ├── rules/
│   │   └── intentRules.v1.json                            <-- Catalogue déclaratif SchemaVersion 1.0.0
│   └── supportedIntentContract.json                       <-- Contrat d'intégrité des intentions
├── loaders/
│   └── fastPathCatalog.loader.js                          <-- Charge Map O(1) + pré-compile RegExp
└── chatFastPathMatcher.service.js                         <-- Exécuteur 2 passes + extraction de contraintes
```

---

## 3. Étapes d'Implémentation

### Étape 1.1 : Créer `understanding/fastPath/catalogs/rules/intentRules.v1.json`
Y déposer le schéma `1.0.0` contenant les règles actives :
- `tf-place-discovery-cafes-001` (`domain: "PLACE_DISCOVERY"`, `intent: "search_places"`, `subIntent: "cafes"`, `priority: 10`, `confidence: 0.99`)
- `tf-place-discovery-restaurants-001` (`subIntent: "restaurants"`, `priority: 10`, `confidence: 0.99`)
- `tf-place-discovery-lounges-001` (`subIntent: "lounges"`, `priority: 10`, `confidence: 0.98`)
- `tf-outing-planning-friends-001` (`domain: "OUTING_PLANNING"`, `subIntent: "with_friends"`, `priority: 10`, `confidence: 0.99`)
- `tf-budget-max-001` (`domain: "BUDGET_AND_DEALS"`, `subIntent: "maximum_budget"`, `priority: 20`, `confidence: 0.99`)
- `tf-location-nearby-001` (`domain: "LOCATION_AND_NAVIGATION"`, `subIntent: "near_current_location"`, `priority: 20`, `confidence: 0.99`)
- `tf-atmosphere-quiet-001` (`domain: "ATMOSPHERE_AND_PREFERENCES"`, `subIntent: "quiet"`, `priority: 10`, `confidence: 0.98`)
- `tf-availability-open-now-001` (`domain: "AVAILABILITY_AND_HOURS"`, `subIntent: "open_now"`, `priority: 20`, `confidence: 0.99`)
- `tf-contact-whatsapp-001` (`domain: "CONTACT_AND_RESERVATION"`, `subIntent: "whatsapp"`, `priority: 20`, `confidence: 0.99`)
- `tf-personalized-recommendation-001` (`domain: "PERSONALIZED_RECOMMENDATION"`, `subIntent: "personalized"`, `priority: 10`, `confidence: 0.98`)
- `tf-chat-greeting-001` (`domain: "CHAT_AND_ASSISTANCE"`, `subIntent: "hello"`, `priority: 5`, `confidence: 0.99`)

### Étape 1.2 : Étendre `understanding/fastPath/loaders/fastPathCatalog.loader.js`
1. Lire `rules/intentRules.v1.json`.
2. Filtrer `rule.status === "active"`.
3. Compiler chaque entrée de `rule.patterns[i]` avec `new RegExp(pattern, rule.patternFlags?.[i] || "i")`.
4. Trier le tableau `compiledRules` par `(b.priority - a.priority) || (b.confidence - a.confidence)`.
5. Mettre en cache dans `cachedFastPath = Object.freeze({ supportedIntents, exactLookup, compiledRules })`.

### Étape 1.3 : Étendre `understanding/fastPath/chatFastPathMatcher.service.js`
1. Exécuter la Passe 1A (`exactLookup.get(candidate)`).
2. Si non trouvé en Passe 1A, évaluer `compiledRules` sur `[originalText, normalizedText]`.
3. Collecter toutes les règles déclenchées sur le tour :
   - Mapper vers l'intention canonique (`DISCOVER_ACTIVITIES`, `ASK_CONTACT_OR_SOCIAL`, `ASK_OPENING_HOURS`, `GREETING`).
   - Agréger les facettes de contraintes (`category`, `group`, `budgetLevel`, `maxBudget`, `nearMe`, `amenities`, `situation`).
   - Retourner `ruleMetadata` avec les détails de la règle principale.

