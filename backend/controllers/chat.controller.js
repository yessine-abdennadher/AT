import {
  appendChatExchange,
  createChatSession,
  getChatSession,
} from "../services/chatSession.service.js";

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MESSAGE_LIMIT = 1000;
const VALID_ROLE_CONTEXTS = new Set(["rh", "manager", "collaborateur", "anonyme"]);

const getSessionToken = (req) =>
  req.get?.("X-Chat-Session-Token") || req.headers?.["x-chat-session-token"] || "";

const notFound = (res) => res.status(404).json({
  success: false,
  message: "Session de chat non trouvée.",
});

const createBotReply = (text, roleContext) => {
  let botReplyText = "Merci pour votre message. Je peux vous aider à découvrir une activité adaptée à vos envies.";
  let suggestions = ["Voir plus d'informations", "Poser une autre question"];

  if (text.toLowerCase().includes("rh") || roleContext === "rh") {
    botReplyText = "En tant qu'expert RH ActivityTN, voici des informations sur les activités disponibles.";
    suggestions = ["Consulter les activités", "Découvrir les restaurants"];
  } else if (text.toLowerCase().includes("santé") || text.toLowerCase().includes("stress")) {
    botReplyText = "Souhaitez-vous découvrir une activité de détente ou de plein air ?";
    suggestions = ["Activités de plein air", "Sorties détente"];
  }

  return { sender: "bot", text: botReplyText, suggestions };
};

export const createChatController = ({
  sessionStore = { createChatSession, appendChatExchange, getChatSession },
} = {}) => ({
  getOrCreateSession: async (req, res, next) => {
    try {
      const body = req.body || {};
      if (body.sessionId !== undefined) {
        const sessionId = body.sessionId;
        const sessionToken = getSessionToken(req);
        if (!SESSION_ID_PATTERN.test(sessionId || "") || !SESSION_TOKEN_PATTERN.test(sessionToken)) {
          return notFound(res);
        }
        const session = await sessionStore.getChatSession(sessionId, sessionToken);
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

  sendMessage: async (req, res, next) => {
    try {
      const { sessionId, text } = req.body || {};
      const sessionToken = getSessionToken(req);
      if (!SESSION_ID_PATTERN.test(sessionId || "") || !SESSION_TOKEN_PATTERN.test(sessionToken)) {
        return notFound(res);
      }
      if (typeof text !== "string" || !text.trim() || text.trim().length > MESSAGE_LIMIT) {
        return res.status(400).json({
          success: false,
          message: `Le message doit contenir entre 1 et ${MESSAGE_LIMIT} caractères.`,
        });
      }

      const session = await sessionStore.getChatSession(sessionId, sessionToken);
      if (!session) return notFound(res);

      const updatedSession = await sessionStore.appendChatExchange({
        sessionId,
        sessionToken,
        userText: text.trim(),
        botMessage: createBotReply(text.trim(), session.roleContext || "anonyme"),
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

  getHistory: async (req, res, next) => {
    try {
      const { sessionId } = req.params || {};
      const sessionToken = getSessionToken(req);
      if (!SESSION_ID_PATTERN.test(sessionId || "") || !SESSION_TOKEN_PATTERN.test(sessionToken)) {
        return notFound(res);
      }
      const session = await sessionStore.getChatSession(sessionId, sessionToken);
      if (!session) return notFound(res);
      return res.json({ success: true, messages: session.messages });
    } catch (error) {
      return next(error);
    }
  },
});

const chatController = createChatController();
export const getOrCreateSession = chatController.getOrCreateSession;
export const sendMessage = chatController.sendMessage;
export const getHistory = chatController.getHistory;
