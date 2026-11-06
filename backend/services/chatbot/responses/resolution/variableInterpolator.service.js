const PLACEHOLDER_REGEX = /\{(\w+)\}/g;

export const placeholdersOf = (text = "") => [...new Set([...String(text).matchAll(PLACEHOLDER_REGEX)].map((m) => m[1]))];

export const canInterpolate = (text, vars = {}) =>
  placeholdersOf(text).every((p) => vars[p] !== undefined && vars[p] !== null && String(vars[p]).trim() !== "");

export const interpolate = (text, vars = {}) =>
  String(text).replace(PLACEHOLDER_REGEX, (_, name) => (vars[name] === undefined || vars[name] === null ? `{${name}}` : String(vars[name])));

