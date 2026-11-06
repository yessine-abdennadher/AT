const MAX_SHOWN = 60;

export function rememberShownActivities(state, ids = []) {
  const shown = [...new Set([...(state.shownActivityIds || []), ...ids])].slice(-MAX_SHOWN);
  return { ...state, shownActivityIds: shown, lastResultIds: ids };
}

export const filterUnseen = (activities, state) => {
  const seen = new Set(state.shownActivityIds || []);
  return activities.filter((a) => !seen.has(String(a._id ?? a.id)));
};

