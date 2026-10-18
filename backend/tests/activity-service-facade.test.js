import test from "node:test";
import assert from "node:assert/strict";
import * as activityService from "../services/activity.service.js";

test("activity service facade preserves every controller-facing method", () => {
  const publicMethods = [
    "getAllActivities", "getActivityById", "createActivity", "updateActivity", "deleteActivity",
    "getRecommendations", "getRecommendationWindow", "getStableSurpriseScore", "buildRecommendationQuery",
    "toggleActivityFavorite", "getReviews", "addReview", "updateReview", "deleteReview", "reactToReview",
    "buildReactionTogglePipeline", "MAX_REACTIONS_PER_REVIEW", "getActivitiesByCreator", "updatePowerMode",
    "recordPowerReport", "updateActivityPromotion", "addActivityEvent",
  ];

  for (const method of publicMethods) assert.ok(method in activityService, `export ${method} missing`);
});
