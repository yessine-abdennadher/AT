import { getSessionToken, hasValidCapability, notFound } from "./chatController.shared.js";

export const createChatHistoryController = ({ sessionStore }) => ({
  getHistory: async (req, res, next) => {
    try {
      const { sessionId } = req.params || {};
      const sessionToken = getSessionToken(req);
      if (!hasValidCapability(sessionId, sessionToken)) return notFound(res);
      const session = await sessionStore.getChatSession(sessionId, sessionToken);
      if (!session) return notFound(res);
      return res.json({ success: true, messages: session.messages });
    } catch (error) {
      return next(error);
    }
  },
});

