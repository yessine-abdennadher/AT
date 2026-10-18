import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { buildReactionTogglePipeline, MAX_REACTIONS_PER_REVIEW } from "../services/activity.service.js";

test("reaction updates are a single atomic aggregation update with a fixed capacity", () => {
  const pipeline = buildReactionTogglePipeline({ userId: new mongoose.Types.ObjectId(), type: "love", now: new Date() });
  assert.equal(MAX_REACTIONS_PER_REVIEW, 50);
  assert.equal(pipeline.length, 1);
  assert.ok(pipeline[0].$set.reactions.$let);
});

test("invalid reaction types use the documented like fallback", () => {
  const pipeline = buildReactionTogglePipeline({ userId: new mongoose.Types.ObjectId(), type: "unknown", now: new Date() });
  assert.deepEqual(pipeline[0].$set.reactions.$let.vars.newReaction.type, "like");
});
