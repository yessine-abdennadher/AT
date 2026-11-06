/**
 * Anti-hallucination : les numéros (8+ chiffres) cités doivent provenir des fiches fournies.
 */
export function hallucinationGuard(text, activities = []) {
  const allowed = new Set(
    activities.flatMap((a) => [a.phone, a.whatsapp]).filter(Boolean).map((n) => String(n).replace(/[^0-9]/g, ""))
  );
  let flagged = false;
  const cleaned = text.replace(/\+?\d[\d\s.-]{6,}\d/g, (match) => {
    const digits = match.replace(/[^0-9]/g, "");
    if (digits.length >= 8 && !allowed.has(digits)) { flagged = true; return "[numéro indisponible]"; }
    return match;
  });
  return { text: cleaned, flagged };
}

