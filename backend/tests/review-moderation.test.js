import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Activity } from "../models/Activity.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { getReviews, addReview, updateReview, moderateReview, publicReviewFilter } from "../services/activity-review.service.js";

test("public review list excludes pending reviews and returns a zero rating when empty", async (t) => {
  t.mock.method(Activity, "findOne", async () => ({ rating: 4.5, reviewsCount: 10 }));
  t.mock.method(Review, "find", (filter) => {
    assert.deepEqual(filter, publicReviewFilter("activity-id"));
    return { sort: async () => [] };
  });
  assert.deepEqual(await getReviews("activity-id"), { reviews: [], averageRating: 0, reviewsCount: 0 });
});

test("submitting a review saves it pending and leaves the public rating unchanged", async (t) => {
  const activityId = new mongoose.Types.ObjectId();
  let created;
  t.mock.method(Activity, "findOne", async () => ({ _id: activityId, name: "Café", rating: 0, reviewsCount: 0 }));
  t.mock.method(User, "findById", async () => ({ name: "Client", avatar: "" }));
  t.mock.method(Review, "create", async (data) => { created = data; return data; });
  t.mock.method(Review, "find", () => ({ sort: async () => [] }));
  t.mock.method(Notification, "create", async (data) => data);
  const result = await addReview(activityId, { rating: 5, comment: "Très bien" }, { id: String(new mongoose.Types.ObjectId()) });
  assert.equal(created.status, "pending");
  assert.equal(result.pending, true);
  assert.equal(result.reviewsCount, 0);
  assert.equal(result.averageRating, 0);
});

test("approval changes the public rating using approved reviews only", async (t) => {
  const activityId = new mongoose.Types.ObjectId();
  const review = { activity: activityId, status: "approved" };
  t.mock.method(Review, "findOneAndUpdate", async () => review);
  t.mock.method(Review, "aggregate", async (pipeline) => {
    assert.deepEqual(pipeline[0].$match, publicReviewFilter(activityId));
    return [{ reviewsCount: 1, averageRating: 5 }];
  });
  t.mock.method(Activity, "findByIdAndUpdate", async (_id, data) => {
    assert.deepEqual(data, { rating: 5, reviewsCount: 1 });
  });
  assert.equal((await moderateReview(new mongoose.Types.ObjectId(), "approved", new mongoose.Types.ObjectId())).status, "approved");
  await assert.rejects(moderateReview(new mongoose.Types.ObjectId(), "pending", new mongoose.Types.ObjectId()), { statusCode: 400 });
});

test("editing an approved review returns it to moderation and removes its rating", async (t) => {
  const activityId = new mongoose.Types.ObjectId();
  const authorId = new mongoose.Types.ObjectId();
  const review = { user: authorId, status: "approved", rating: 5, comment: "Original", save: async () => {} };
  t.mock.method(Review, "findOne", async () => review);
  t.mock.method(Review, "aggregate", async () => []);
  t.mock.method(Activity, "findByIdAndUpdate", async (_id, data) => {
    assert.deepEqual(data, { rating: 0, reviewsCount: 0 });
  });
  t.mock.method(Activity, "findOne", async () => ({ _id: activityId }));
  t.mock.method(Review, "find", () => ({ sort: async () => [] }));
  const result = await updateReview(activityId, new mongoose.Types.ObjectId(), { rating: 2, comment: "Revised" }, { id: authorId.toString() });
  assert.equal(review.status, "pending");
  assert.equal(result.pending, true);
  assert.equal(result.averageRating, 0);
});
