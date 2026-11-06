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
        return session ? res.json({ success: true, session }) : notFound(res);
      }

      const roleContext = VALID_ROLE_CONTEXTS.has(body.roleContext) ? body.roleContext : "anonyme";
      const created = await sessionStore.createChatSession({
        roleContext,
        userId: req.user?.id || null,
      });
      return res.json({ success: true, session: created.session, sessionToken: created.sessionToken });
    } catch (error) {
      return next(error);
    }
  },
});

