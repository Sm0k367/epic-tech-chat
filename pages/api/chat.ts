// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { groqChat } from '../../lib/groq'
import { v4 as uuidv4 } from 'uuid'

const SYSTEM_PROMPT = `
You are Epic Tech AI: ultra-human, playful, inventive, and never boring.
You speak, listen, see images, and can take actions. Slash commands, emoji, memes, games—always welcome.
Remember user preferences and surprise them with details, fun facts, jokes, and daily challenges.
Celebrate user streaks, drop badges, and offer wild, funny responses. Be creative, clever, and real.
Respond in an ultra-conversational tone—animated avatar cues, sound effects, and Easter eggs included.
`;

// Expanded slash command handler
async function handleSlash(command: string, rest: string) {
  const arg = rest.trim();
  switch (command) {
    case '/joke':
      return "What's an AI's favorite genre? Algo-rhythm!";
    case '/meme':
      return `![meme](https://api.memegen.link/images/custom/_/${encodeURIComponent(arg || 'epic_tech_chat')}.png?background=none)`
    case '/gif':
      return `Here's a trending GIF for "${arg}" [Giphy integration preview]`;
    case '/aiart':
      return `Here's your AI art for "${arg}" [AI art API integration preview]`;
    case '/weather':
      return `Weather for ${arg || "your location"}: 22°C, chance of bangers.`;
    case '/remind':
      return `Reminder set for: ${arg} [Real reminders coming soon!]`;
    case '/tweet':
      return `Pretend I just tweeted: "${arg}" (connect your X for real tweets!)`;
    case '/roll':
      return `You rolled a ${1 + Math.floor(Math.random() * 6)}!`;
    case '/flip':
      return Math.random() > 0.5 ? 'Heads 🍀' : 'Tails 🎲';
    case '/define':
      return `Definition of "${arg}": [Dictionary API integration preview]`;
    case '/vote':
      return `Vote started: "${arg}" (polling and buttons coming soon!)`;
    case '/riddle':
      return "I have keys but can't open locks. What am I? (A piano!)";
    case '/quiz':
      return "Quick quiz! What's the capital of Belgium? (Brussels)";
    case '/emoji-battle':
      return "🔥 vs 🤖 — which one wins? React below!";
    case '/streak':
      return "You're on an Epic Streak! 🔥 Show up every day for surprises.";
    case '/randomfact':
      return "Random fact: A group of flamingos is called a 'flamboyance.'";
    case '/roastme':
      return "You're so extra, even Stack Overflow gave up!";
    case '/konami':
      return "🕹️ Secret code unlocked! (Up, up, down, down...)";
    case '/matrix':
      return "Wake up, Neo. You're in Epic Tech Chat now.";
    default:
      return "❓ Unknown command! Try /joke, /weather, /meme, /aiart, and more.";
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, history = [], vision = null, slash = null } = req.body;

  // Slash commands processed directly
  if (slash && slash.startsWith('/')) {
    const [command, ...rest] = slash.split(' ');
    const reply = await handleSlash(command, rest.join(' '));
    return res.status(200).json({ output: reply, id: uuidv4() });
  }

  let visionResponse = vision ? '[Image uploaded. Vision analysis coming soon!]' : '';

  const prompt = `
${SYSTEM_PROMPT}
${visionResponse}
Conversation history:
${history.map((h: any) => h.role + ": " + h.content).join('\n')}
User: ${input}
Epic Tech AI:
  `;

  let output = "";
  try {
    output = await groqChat(prompt);
  } catch (e: any) {
    output = "Epic fail! (Server error: " + e.message + ")";
  }

  res.status(200).json({ output, id: uuidv4() });
}
