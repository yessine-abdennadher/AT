const SIMPLE_PLACEHOLDER_REGEX = /\{(\w+)\}/g;
const ICU_PLURAL_PREFIX_REGEX = /\{(\w+),\s*plural,\s*/i;

/**
 * Extrait les blocs ICU imbriqués `{varName, plural, one {...} other {...}}`
 * en comptant les accolades ouvrantes et fermantes pour supporter les sous-blocs.
 */
function extractIcuPluralBlocks(text = "") {
  const blocks = [];
  let index = 0;
  const str = String(text || "");

  while (index < str.length) {
    const startIdx = str.indexOf("{", index);
    if (startIdx === -1) break;

    const remaining = str.slice(startIdx);
    const prefixMatch = remaining.match(ICU_PLURAL_PREFIX_REGEX);
    if (prefixMatch && prefixMatch.index === 0) {
      const varName = prefixMatch[1];
      const prefixLen = prefixMatch[0].length;
      let depth = 1;
      let pos = startIdx + prefixLen;
      while (pos < str.length && depth > 0) {
        if (str[pos] === "{") depth += 1;
        else if (str[pos] === "}") depth -= 1;
        pos += 1;
      }
      if (depth === 0) {
        const fullBlock = str.slice(startIdx, pos);
        const branchesContent = str.slice(startIdx + prefixLen, pos - 1).trim();
        blocks.push({
          start: startIdx,
          end: pos,
          fullMatch: fullBlock,
          varName,
          branchesContent,
        });
        index = pos;
        continue;
      }
    }
    index = startIdx + 1;
  }
  return blocks;
}

export function placeholdersOf(text = "") {
  const str = String(text || "");
  const vars = new Set();
  const icuBlocks = extractIcuPluralBlocks(str);

  for (const block of icuBlocks) {
    vars.add(block.varName);
  }

  let textWithoutIcu = str;
  for (const block of icuBlocks) {
    textWithoutIcu = textWithoutIcu.replace(block.fullMatch, " ");
  }

  for (const match of textWithoutIcu.matchAll(SIMPLE_PLACEHOLDER_REGEX)) {
    vars.add(match[1]);
  }

  return [...vars];
}

export function canInterpolate(text = "", vars = {}) {
  return placeholdersOf(text).every(
    (p) => vars[p] !== undefined && vars[p] !== null && String(vars[p]).trim() !== ""
  );
}

function parseIcuPluralBranches(branchesStr) {
  const branches = {};
  const branchRegex = /(=?\w+)\s*\{([^}]*)\}/g;
  for (const match of branchesStr.matchAll(branchRegex)) {
    branches[match[1]] = match[2];
  }
  return branches;
}

function formatIcuPlural(varName, rawValue, branchesStr) {
  const num = Number(rawValue);
  if (!Number.isFinite(num)) return `{${varName}}`;

  const branches = parseIcuPluralBranches(branchesStr);
  let template = branches.other || "";
  if (num === 0 && branches["=0"] !== undefined) {
    template = branches["=0"];
  } else if (num === 1 && (branches.one !== undefined || branches["=1"] !== undefined)) {
    template = branches.one !== undefined ? branches.one : branches["=1"];
  }

  return template.replace(/#/g, String(num));
}

/**
 * Interpole les placeholders simples ({city}, {name}) et les règles plurielles ICU
 * ({count, plural, one {# lieu} other {# lieux}}).
 */
export function interpolate(text = "", vars = {}) {
  let result = String(text || "");

  // 1. Résolution des blocs ICU Plural avec accolades imbriquées
  const icuBlocks = extractIcuPluralBlocks(result);
  for (let i = icuBlocks.length - 1; i >= 0; i -= 1) {
    const block = icuBlocks[i];
    const val = vars[block.varName];
    if (val !== undefined && val !== null) {
      const formatted = formatIcuPlural(block.varName, val, block.branchesContent);
      result = result.slice(0, block.start) + formatted + result.slice(block.end);
    }
  }

  // 2. Résolution des placeholders simples restants
  result = result.replace(SIMPLE_PLACEHOLDER_REGEX, (fullMatch, name) => {
    return vars[name] === undefined || vars[name] === null ? fullMatch : String(vars[name]);
  });

  return result;
}
