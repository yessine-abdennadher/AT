import test from "node:test";
import assert from "node:assert/strict";
import { buildRecommendationQuery, getRecommendationWindow, getStableSurpriseScore } from "../services/activity.service.js";

test("recommendation filters are translated to bounded candidate query clauses", () => {
  const query = buildRecommendationQuery({ category: "food", city: "Sfax.*", budgetMax: 40, situation: "open_now" });
  assert.deepEqual(query.city, { $regex: "Sfax\\.\\*", $options: "i" });
  assert.deepEqual(query.$and[0].$or, [
    { category: "food" },
    { price: { $lte: 40 } },
    { isOpenNow: { $ne: false } },
  ]);
});

test("surprise-me scores are repeatable for the same activity", () => {
  assert.equal(getStableSurpriseScore("activity-42"), getStableSurpriseScore("activity-42"));
  assert.ok(getStableSurpriseScore("activity-42") >= 0 && getStableSurpriseScore("activity-42") <= 4);
});

test("recommendation pagination is clamped and candidate retrieval is capped at ten pages", () => {
  assert.deepEqual(getRecommendationWindow({ page: -2, limit: 1000 }), { page: 1, limit: 100, candidateLimit: 1000 });
  assert.deepEqual(getRecommendationWindow({ page: 2, limit: 5 }), { page: 2, limit: 5, candidateLimit: 50 });
});
