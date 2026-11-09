/**
 * Adaptateur secondaire de secours : Groq (Llama 3.3).
 * Retourne l'objet JSON brut renvoyé par le modèle, ou null en cas d'échec.
 */
export async function callGroqClassifier({ prompt, apiKey, model, fetchImpl, signal }) {
  const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  return text ? JSON.parse(text) : null;
}

