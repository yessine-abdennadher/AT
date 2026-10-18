import { createHash } from "node:crypto";
import { RateLimitCounter } from "../models/RateLimitCounter.js";

export const hashRateLimitKey = (key) =>
  createHash("sha256").update(String(key)).digest("hex");

export const createRateLimitStore = ({ Counter = RateLimitCounter } = {}) =>
  async ({ key, windowMs, now = Date.now() }) => {
    if (!key || !Number.isFinite(windowMs) || windowMs <= 0 || !Number.isFinite(now)) {
      throw new TypeError("Une clé, une fenêtre positive et un instant valide sont requis.");
    }

    const windowStartMs = Math.floor(now / windowMs) * windowMs;
    const windowStart = new Date(windowStartMs);
    const resetAt = windowStartMs + windowMs;
    const filter = { key: hashRateLimitKey(key), windowStart };
    const update = {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(resetAt + windowMs) },
    };

    let counter;
    try {
      counter = await Counter.findOneAndUpdate(filter, update, {
        upsert: true,
        new: true,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      counter = await Counter.findOneAndUpdate(
        filter,
        { $inc: { count: 1 } },
        { new: true, upsert: false }
      );
      if (!counter) throw error;
    }

    return { count: counter.count, resetAt };
  };

export const incrementRateLimitCounter = createRateLimitStore();
