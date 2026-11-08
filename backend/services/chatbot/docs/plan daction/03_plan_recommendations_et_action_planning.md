# Plan d'Action 03 — Amélioration de `capabilities/recommendations/` & `actionPlanning/`

## 1. Objectif
Exploiter pleinement les nouvelles contraintes extraites par le moteur de règles (`maxBudget`, `nearMe`, `group`, `situation`, `amenities`) au sein du moteur de recommandation MongoDB et du planificateur de sorties multi-étapes (DAG).

---

## 2. Actions sur `capabilities/recommendations/`

### 2.1 `activityQueryBuilder.service.js`
1. **Support de `maxBudget` (Montant numérique en DT)** :
   - Lorsqu'une règle comme `tf-budget-max-001` extrait `maxBudget: 20` (ex: *"budget max 20 dt"*), ajouter au filtre MongoDB :
     ```js
     if (Number.isFinite(constraints.maxBudget)) {
       query.price = { $lte: constraints.maxBudget };
     }
     ```
2. **Support de `nearMe` (Proximité GPS)** :
   - Lorsqu'une règle comme `tf-location-nearby-001` active `nearMe: true` (*"près de moi"*, *"7dheya"*), prioriser le tri par distance Haversine autour de `userContext.coords` (rayon de 5 km par défaut).

### 2.2 `activityRanker.service.js`
1. Accorder un bonus de score (`+15 points`) lorsque le type de groupe (`constraints.group === "friends" | "couple" | "family"`) correspond aux tags d'audience de l'établissement.
2. Accorder un bonus de disponibilité immédiate lorsque `constraints.situation === "open_now"` et que l'établissement est actuellement ouvert selon ses horaires hebdomadaires.

---

## 3. Actions sur `capabilities/actionPlanning/`

1. Ajouter `chatOutingPlanGuidance.service.js` (table de décision pure consommant `dialogueAct` — 0 Regex) pour gérer les transitions du plan multi-étapes (`PAUSE`, `RESUME`, `NEXT_STEP`, `CHANGE_STEP`).
2. Ajouter un benchmark dédié `benchmarks/couche5-action-planning/actionPlanning.benchmark.js` validant les parcours combinés (ex: *"Un café puis un restaurant à La Marsa"*).

