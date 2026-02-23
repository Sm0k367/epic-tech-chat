import Groq from "groq-sdk";

export function getGroqClient(apiKey?: string) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is missing!");
  return new Groq({ apiKey: key });
}
