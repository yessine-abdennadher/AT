import { createChatSessionController } from "./chatSession.controller.js";
import { createChatMessageController } from "./chatMessage.controller.js";
import { createChatHistoryController } from "./chatHistory.controller.js";

export const createChatbotControllers = ({ sessionStore, replyProvider }) => ({
  ...createChatSessionController({ sessionStore }),
  ...createChatMessageController({ sessionStore, replyProvider }),
  ...createChatHistoryController({ sessionStore }),
});

