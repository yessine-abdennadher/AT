import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ChatSession } from "../models/ChatSession.js";

const MAX_MESSAGES_PER_SESSION = 200;
const hashSessionToken = (token) => createHash("sha256").update(token).digest("hex");

const publicSession = (session) => {
  if (!session) return session;
  const result = typeof session.toObject === "function" ? session.toObject() : { ...session };
  delete result.sessionTokenHash;
  return result;
};

export const createChatSessionStore = ({ ChatSessionModel = ChatSession } = {}) => ({
  createChatSession: async ({ roleContext = "anonyme", userId = null } = {}) => {
    const sessionToken = randomBytes(32).toString("base64url");
    const session = await ChatSessionModel.create({
      sessionId: randomUUID(),
      sessionTokenHash: hashSessionToken(sessionToken),
      userId,
      roleContext,
      messages: [
        {
          sender: "bot",
          text: "Bonjour ! Je suis votre assistant ActivityTN. Comment puis-je vous aider ?",
          suggestions: ["Trouver une activité", "Voir les restaurants"],
        },
      ],
    });
    return { session: publicSession(session), sessionToken };
  },

  appendChatExchange: async ({ sessionId, sessionToken, userText, botMessage }) =>
    ChatSessionModel.findOneAndUpdate(
      { sessionId, sessionTokenHash: hashSessionToken(sessionToken) },
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

  getChatSession: (sessionId, sessionToken) =>
    ChatSessionModel.findOne({ sessionId, sessionTokenHash: hashSessionToken(sessionToken) }),
});

const chatSessionStore = createChatSessionStore();

export const createChatSession = (...args) => chatSessionStore.createChatSession(...args);
export const appendChatExchange = (...args) => chatSessionStore.appendChatExchange(...args);
export const getChatSession = (...args) => chatSessionStore.getChatSession(...args);
