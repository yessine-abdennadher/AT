import { ChatSession } from "../models/ChatSession.js";

export const getOrCreateSession = async (req, res, next) => {
  try {
    const { sessionId, roleContext } = req.body;
    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let session = await ChatSession.findOne({ sessionId: currentSessionId });

    if (!session) {
      session = await ChatSession.create({
        sessionId: currentSessionId,
        userId: req.user ? req.user.id : null,
        roleContext: roleContext || req.user?.role || "anonyme",
        messages: [
          {
            sender: "bot",
            text: "Bonjour ! Je suis votre assistant WellbeingPro. Comment puis-je vous aider aujourd'hui ?",
            suggestions: ["Bilan de santé QVCT", "Diagnostic RH", "Conseils bien-être au travail"],
          },
        ],
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Le texte du message est requis" });
    }

    let session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session de chat non trouvée" });
    }

    // Append user message
    session.messages.push({
      sender: "user",
      text,
    });

    // Mock bot response logic (can be integrated with AI/Groq/OpenAI)
    let botReplyText = `Merci pour votre message : "${text}". L'assistant analyse votre demande selon le contexte ${session.roleContext.toUpperCase()}.`;
    let suggestions = ["Voir plus d'informations", "Poser une autre question"];

    if (text.toLowerCase().includes("rh") || session.roleContext === "rh") {
      botReplyText = "En tant qu'expert RH WellbeingPro, voici nos recommandations sur le climat social et la QVCT.";
      suggestions = ["Consulter le baromètre RH", "Exporter le rapport CSRD/ESRS"];
    } else if (text.toLowerCase().includes("santé") || text.toLowerCase().includes("stress")) {
      botReplyText = "Prendre soin de votre santé mentale et réduire le stress au travail est essentiel. Souhaitez-vous un exercice de respiration guidée ?";
      suggestions = ["Exercice de respiration (5 min)", "Conseils ergonomie"];
    }

    // Append bot message
    session.messages.push({
      sender: "bot",
      text: botReplyText,
      suggestions,
    });

    await session.save();

    res.json({
      success: true,
      session,
      reply: session.messages[session.messages.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session introuvable" });
    }

    res.json({
      success: true,
      messages: session.messages,
    });
  } catch (error) {
    next(error);
  }
};
