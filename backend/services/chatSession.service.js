import { randomUUID } from "node:crypto";
import { ChatSession } from "../models/ChatSession.js";

const MAX_MESSAGES_PER_SESSION = 200;

export const createChatSessionStore = ({ ChatSessionModel = ChatSession } = {}) => ({
  createChatSession: async ({ roleContext = "anonyme", userId = null } = {}) =>
    ChatSessionModel.create({
      sessionId: randomUUID(),
      userId,
      roleContext,
      messages: [
        {
          sender: "bot",
          text: "Bonjour ! Je suis votre assistant ActivityTN. Comment puis-je vous aider ?",
          suggestions: ["Trouver une activité", "Voir les restaurants"],
        },
      ],
    }),

  appendChatExchange: async ({ sessionId, userText, botMessage }) =>
    ChatSessionModel.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            $each: [
              { sender: "user", text: userText },
              botMessage,
            ],
            $slice: -MAX_MESSAGES_PER_SESSION,
          },
        },
      },
      { new: true, runValidators: true }
    ),

  getChatSession: (sessionId) => ChatSessionModel.findOne({ sessionId }),
});

const chatSessionStore = createChatSessionStore();

export const createChatSession = (...args) => chatSessionStore.createChatSession(...args);
export const appendChatExchange = (...args) => chatSessionStore.appendChatExchange(...args);
export const getChatSession = (...args) => chatSessionStore.getChatSession(...args);
