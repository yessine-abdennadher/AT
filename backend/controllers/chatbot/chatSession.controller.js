import {
  VALID_ROLE_CONTEXTS,
  getSessionToken,
  hasValidCapability,
  notFound,
} from "./chatController.shared.js";

export const createChatSessionController = ({ sessionStore }) => ({
  getOrCreateSession: async (req, res, next) => {
    try {
      const body = req.body || {};
      if (body.sessionId !== undefined) {
        const sessionToken = getSessionToken(req);
        if (!hasValidCapability(body.sessionId, sessionToken)) return notFound(res);
        const session = await sessionStore.getChatSession(body.sessionId, sessionToken);
        if (!session) return notFound(res);
        const latestMsg = session.messages?.[session.messages.length - 1];
        return res.json({
          success: true,
          session,
          suggestions: latestMsg?.suggestions || [],
        });
      }

      const roleContext = VALID_ROLE_CONTEXTS.has(body.roleContext) ? body.roleContext : "anonyme";
      const language = ["fr", "ar", "en", "derja"].includes(body.language) ? body.language : "fr";
      const created = await sessionStore.createChatSession({
        roleContext,
        userId: req.user?.id || null,
        language,
        hasGps: Boolean(body.hasGps),
      });
      const initialMsg = created.session?.messages?.[created.session.messages.length - 1];
      return res.json({
        success: true,
        session: created.session,
        sessionToken: created.sessionToken,
        suggestions: initialMsg?.suggestions || [],
      });
    } catch (error) {
      return next(error);
    }
  },
});

