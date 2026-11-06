const TEXT_LIMIT = 1000;
const SUGGESTION_LIMIT = 6;
const SUGGESTION_LENGTH = 40;

export function validateChatResponseDto(message) {
  const text = typeof message?.text === "string" && message.text.trim()
    ? message.text.trim().slice(0, TEXT_LIMIT)
    : "Je n'ai pas pu générer de réponse, pouvez-vous reformuler ?";
  const suggestions = (Array.isArray(message?.suggestions) ? message.suggestions : [])
    .filter((s) => typeof s === "string" && s.trim())
    .map((s) => s.trim().slice(0, SUGGESTION_LENGTH))
    .slice(0, SUGGESTION_LIMIT);
  return { sender: "bot", text, suggestions, metadata: message?.metadata && typeof message.metadata === "object" ? message.metadata : {} };
}

