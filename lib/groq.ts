import axios from "axios";

/**
 * Calls Groq's fast LLM API (chat completions endpoint) and returns the text result.
 */
export async function groqChat(prompt: string, apiKey?: string) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is missing!");

  try {
    const { data } = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        timeout: 25000 // 25 second timeout
      }
    );
    return data.choices?.[0]?.message?.content || "No response from AI";
  } catch (error: any) {
    console.error("Groq API Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message || "Failed to get AI response");
  }
}
