const tails = new Map();

/**
 * Verrou de tour par session : sérialise les messages concurrents.
 */
export async function withTurnLock(sessionId, task) {
  const previous = tails.get(sessionId) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const tail = previous.then(() => gate);
  tails.set(sessionId, tail);
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (tails.get(sessionId) === tail) tails.delete(sessionId);
  }
}

