// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { Groq } from 'groq-sdk'
import { v4 as uuidv4 } from 'uuid'

// Optionally require dotenv if running locally
if (!process.env.GROQ_API_KEY && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const SYSTEM_PROMPT = `
You are Epic Tech AI: ultra-human, playful, inventive, and never boring.
You speak, listen, see images, and can take actions. Slash commands and emoji: always welcome.
Remember user preferences and surprise them with details, fun facts, jokes, and daily challenges.
Respond in a real, conversational tone—light mode, dark mode, and animated avatar cues supported.
`;

// Example: handle slash commands
function handleSlash(command: string, rest: string) {
  switch (command) {
    case '/joke':
      return "What's a neural net’s favorite club? The Techno-logue!";
    case '/gif':
      return `Here’s a GIF for "${rest}": [searching online GIFs...]`;
    case '/summarize':
      return `[Summarizing: "${rest}"] (to be implemented)`;
    // Add more!
    default:
      return "Unknown slash command!";
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { input, history = [], vision = null, slash = null } = req.body;

  // Handle slash commands directly
  if (slash && slash.startsWith('/')) {
    const [command, ...rest] = slash.split(' ');
    const reply = handleSlash(command, rest.join(' '));
    return res.status(200).json({ output: reply, id: uuidv4() });
  }

  // Vision (image analysis) placeholder – implement with Groq multimodal or fallback API
  let visionResponse = vision ? '[Vision analysis... coming soon]' : '';

  // Compose LLM request
  const prompt = `
${SYSTEM_PROMPT}
${visionResponse}
Conversation history:
${history.map((h: any) => h.role + ": " + h.content).join('\n')}
User: ${input}
Epic Tech AI:
  `;

  // Call Groq (stream or just full completion, depending on SDK)
  let output = ""
  try {
    const completion = await groq.completions.create({
      model: "mixtral-8x7b-32768", // or other Groq model
      prompt,
      max_tokens: 1024,
      stream: false, // set to true for streaming (see Groq docs)
    });

    output = completion.choices?.[0]?.text || "Oops, server didn't return text!";
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  res.status(200).json({ output, id: uuidv4() });
}
