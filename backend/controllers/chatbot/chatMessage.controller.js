import {
  MESSAGE_LIMIT,
  getSessionToken,
  hasValidCapability,
  notFound,
} from "./chatController.shared.js";
import { createLegacyBotReply } from "./legacyBotReply.js";

/**
 * @param replyProvider async ({ text, session, sessionId }) => botMessage
 */
export const createChatMessageController = ({ sessionStore, replyProvider = createLegacyBotReply }) => ({
  sendMessage: async (req, res, next) => {
    try {
      const { sessionId, text } = req.body || {};
      const sessionToken = getSessionToken(req);
      if (!hasValidCapability(sessionId, sessionToken)) return notFound(res);
      if (typeof text !== "string" || !text.trim() || text.trim().length > MESSAGE_LIMIT) {
        return res.status(400).json({
          success: false,
          message: `Le message doit contenir entre 1 et ${MESSAGE_LIMIT} caractères.`,
        });
      }

      const session = await sessionStore.getChatSession(sessionId, sessionToken);
      if (!session) return notFound(res);

      const userText = text.trim();
      const botMessage = await replyProvider({ text: userText, session, sessionId });
      const updatedSession = await sessionStore.appendChatExchange({
        sessionId,
        sessionToken,
        userText,
        botMessage,
      });
      if (!updatedSession) return notFound(res);

      return res.json({
        success: true,
        session: updatedSession,
        reply: updatedSession.messages[updatedSession.messages.length - 1],
      });
    } catch (error) {
      return next(error);
    }
  },
});

