const MAX_DYNAMIC_PER_POOL = 9;
const pools = new Map();
const key = (intentKey, lang) => `${intentKey}:${lang}`;

export const dynamicResponseStore = {
  get: (intentKey, lang) => pools.get(key(intentKey, lang)) || [],
  add(intentKey, lang, variants) {
    const current = pools.get(key(intentKey, lang)) || [];
    const known = new Set(current.map((v) => v.text));
    const fresh = variants.filter((v) => !known.has(v.text));
    pools.set(key(intentKey, lang), [...current, ...fresh].slice(-MAX_DYNAMIC_PER_POOL));
    return fresh;
  },
  clear: () => pools.clear(),
  limit: MAX_DYNAMIC_PER_POOL,
};

