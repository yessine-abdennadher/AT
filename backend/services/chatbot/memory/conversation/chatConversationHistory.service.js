const MAX_TURNS = 40;

export function appendTurn(state, turn) {
  const history = [...(state.history || []), { timestamp: new Date().toISOString(), ...turn }];
  return { ...state, history: history.slice(-MAX_TURNS) };
}

export const lastTurn = (state) => state.history?.[state.history.length - 1] || null;

