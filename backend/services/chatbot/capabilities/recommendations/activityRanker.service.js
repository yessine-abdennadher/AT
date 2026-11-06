const toMinutes = (hhmm) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export function isOpenNow(activity, now = new Date()) {
  const open = toMinutes(activity.openingTime);
  const close = toMinutes(activity.closingTime);
  if (open === null || close === null) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  return open <= close ? current >= open && current < close : current >= open || current < close;
}

export function scoreActivity(activity, constraints = {}, { now = new Date() } = {}) {
  let score = Number(activity.rating) || 0;
  if (activity.promotion) score += 0.6;
  const amenities = (activity.amenities || []).map((a) => String(a).toLowerCase());
  for (const wanted of constraints.amenities || []) {
    if (amenities.some((a) => a.includes(wanted.replace("_", " ")))) score += 0.5;
  }
  if (constraints.urgency === "now" && isOpenNow(activity, now) === false) score -= 3;
  const price = Number(activity.price);
  if (Number.isFinite(price) && price > 0) {
    if (constraints.budgetLevel === "low") score += price <= 30 ? 0.8 : -0.4;
    if (constraints.budgetLevel === "high") score += price >= 80 ? 0.5 : 0;
  }
  return score;
}

export function rankActivities(activities, constraints, options) {
  return [...activities]
    .map((activity) => ({ activity, score: scoreActivity(activity, constraints, options) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.activity);
}

