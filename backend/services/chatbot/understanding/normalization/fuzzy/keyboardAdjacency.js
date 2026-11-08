/**
 * Matrice d'adjacence physique des touches de clavier (AZERTY et QWERTY).
 * Permet de réduire le coût d'une erreur de frappe quand le doigt glisse sur la touche d'à côté.
 */

export const KEYBOARD_ADJACENCY_AZERTY = Object.freeze({
  a: new Set(["z", "q"]),
  z: new Set(["a", "e", "s", "q"]),
  e: new Set(["z", "r", "s", "d"]),
  r: new Set(["e", "t", "d", "f"]),
  t: new Set(["r", "y", "f", "g"]),
  y: new Set(["t", "u", "g", "h"]),
  u: new Set(["y", "i", "h", "j"]),
  i: new Set(["u", "o", "j", "k"]),
  o: new Set(["i", "p", "k", "l"]),
  p: new Set(["o", "l", "m"]),
  q: new Set(["a", "z", "s", "w"]),
  s: new Set(["q", "d", "z", "e", "w", "x", "a"]),
  d: new Set(["s", "f", "e", "r", "x", "c"]),
  f: new Set(["d", "g", "r", "t", "c", "v"]),
  g: new Set(["f", "h", "t", "y", "v", "b"]),
  h: new Set(["g", "j", "y", "u", "b", "n"]),
  j: new Set(["h", "k", "u", "i", "n"]),
  k: new Set(["j", "l", "i", "o"]),
  l: new Set(["k", "m", "o", "p"]),
  m: new Set(["l", "p"]),
  w: new Set(["q", "s", "x"]),
  x: new Set(["w", "c", "s", "d"]),
  c: new Set(["x", "v", "d", "f"]),
  v: new Set(["c", "b", "f", "g"]),
  b: new Set(["v", "n", "g", "h"]),
  n: new Set(["b", "h", "j"]),
});

export const KEYBOARD_ADJACENCY_QWERTY = Object.freeze({
  q: new Set(["w", "a", "s"]),
  w: new Set(["q", "e", "a", "s", "d"]),
  e: new Set(["w", "r", "s", "d", "f"]),
  r: new Set(["e", "t", "d", "f", "g"]),
  t: new Set(["r", "y", "f", "g", "h"]),
  y: new Set(["t", "u", "g", "h", "j"]),
  u: new Set(["y", "i", "h", "j", "k"]),
  i: new Set(["u", "o", "j", "k", "l"]),
  o: new Set(["i", "p", "k", "l"]),
  p: new Set(["o", "l"]),
  a: new Set(["q", "w", "s", "z"]),
  s: new Set(["a", "d", "w", "e", "z", "x"]),
  d: new Set(["s", "f", "e", "r", "x", "c"]),
  f: new Set(["d", "g", "r", "t", "c", "v"]),
  g: new Set(["f", "h", "t", "y", "v", "b"]),
  h: new Set(["g", "j", "y", "u", "b", "n"]),
  j: new Set(["h", "k", "u", "i", "n", "m"]),
  k: new Set(["j", "l", "i", "o", "m"]),
  l: new Set(["k", "o", "p"]),
  z: new Set(["a", "s", "x"]),
  x: new Set(["z", "s", "d", "c"]),
  c: new Set(["x", "d", "f", "v"]),
  v: new Set(["c", "f", "g", "b"]),
  b: new Set(["v", "g", "h", "n"]),
  n: new Set(["b", "h", "j", "m"]),
  m: new Set(["n", "j", "k"]),
});

export function areKeysAdjacent(charA, charB) {
  const a = String(charA || "").toLowerCase();
  const b = String(charB || "").toLowerCase();
  if (!a || !b || a === b) return false;
  return Boolean(
    KEYBOARD_ADJACENCY_AZERTY[a]?.has(b) ||
    KEYBOARD_ADJACENCY_QWERTY[a]?.has(b)
  );
}

