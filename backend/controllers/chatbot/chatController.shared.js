export const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const MESSAGE_LIMIT = 1000;
export const VALID_ROLE_CONTEXTS = new Set(["rh", "manager", "collaborateur", "anonyme"]);

export const getSessionToken = (req) =>
  req.get?.("X-Chat-Session-Token") || req.headers?.["x-chat-session-token"] || "";

export const notFound = (res) => res.status(404).json({
  success: false,
  message: "Session de chat non trouvée.",
});

export const hasValidCapability = (sessionId, sessionToken) =>
  SESSION_ID_PATTERN.test(sessionId || "") && SESSION_TOKEN_PATTERN.test(sessionToken || "");

