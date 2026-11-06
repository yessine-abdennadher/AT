import {
  appendChatExchange,
  createChatSession,
  getChatSession,
} from "../services/chatSession.service.js";
import { createChatbotControllers } from "./chatbot/index.js";
import { chatbotReplyProvider } from "../services/chatbot/conversations/chatMainGateway.service.js";

/**
 * Façade rétrocompatible : la logique est répartie dans `controllers/chatbot/`
 * (session, message, historique). Les routes continuent d'importer ce module.
 */
export const createChatController = ({
  sessionStore = { createChatSession, appendChatExchange, getChatSession },
  replyProvider = chatbotReplyProvider,
} = {}) => createChatbotControllers({ sessionStore, replyProvider });

const chatController = createChatController();
export const getOrCreateSession = chatController.getOrCreateSession;
export const sendMessage = chatController.sendMessage;
export const getHistory = chatController.getHistory;
