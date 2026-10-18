import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPublicActivityFilter,
  buildPublicActivityQuery,
  buildActivityCreationData,
  buildActivityUpdateData,
} from "../services/activity.service.js";
import { buildRecommendationQuery } from "../services/activity-recommendation.service.js";

test("public listing filters always include approved activities and preserve user filters", () => {
  const query = buildPublicActivityFilter({ city: "Tunis", category: "restaurant" });
  assert.equal(query.isApproved, true);
  assert.equal(query.city.$regex, "Tunis");
  assert.equal(query.category, "restaurant");
});

test("public detail query only matches approved activities", () => {
  assert.deepEqual(buildPublicActivityQuery("activity-id"), { _id: "activity-id", isApproved: true });
});

test("all activity creation starts pending, regardless of role or request data", () => {
  const clientPayload = { name: "Lieu", isApproved: true };
  assert.equal(buildActivityCreationData(clientPayload, "partner-id", "partner").isApproved, false);
  assert.equal(buildActivityCreationData({ ...clientPayload, isApproved: true }, "admin-id", "admin").isApproved, false);
});

test("generic activity updates discard approval and ownership fields", () => {
  assert.deepEqual(buildActivityUpdateData({ name: "Nouvelle fiche", isApproved: true, createdBy: "attacker" }), {
    name: "Nouvelle fiche",
  });
});

test("recommendation candidate query always excludes unapproved activities", () => {
  assert.equal(buildRecommendationQuery({ category: "restaurant" }).isApproved, true);
});
