/**
 * Réponse de repli minimale (ancien comportement). Utilisée uniquement quand
 * aucun `replyProvider` n'est injecté dans le contrôleur de message.
 */
export const createLegacyBotReply = async ({ text, session }) => {
  const lower = text.toLowerCase();
  const roleContext = session?.roleContext || "anonyme";
  let botReplyText = "Merci pour votre message. Je peux vous aider à découvrir une activité adaptée à vos envies.";
  let suggestions = ["Voir plus d'informations", "Poser une autre question"];

  if (lower.includes("rh") || roleContext === "rh") {
    botReplyText = "En tant qu'expert RH ActivityTN, voici des informations sur les activités disponibles.";
    suggestions = ["Consulter les activités", "Découvrir les restaurants"];
  } else if (lower.includes("santé") || lower.includes("stress")) {
    botReplyText = "Souhaitez-vous découvrir une activité de détente ou de plein air ?";
    suggestions = ["Activités de plein air", "Sorties détente"];
  }
  return { sender: "bot", text: botReplyText, suggestions };
};

