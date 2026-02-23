import axios from "axios";

/**
 * Calls Groq’s fast LLM API (compatible with OpenAI endpoint) and returns the text result.
 */
export async function groqChat(prompt: string, apiKey?: string) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is missing!");

  const { data } = await axios.post(
    "https://api.groq.com/openai/v1/completions",
    {
      model: "mixtral-8x7b-32768",
      prompt,
      max_tokens: 1024
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    }
  );
  return data.choices?.[0]?.text || "";
}
