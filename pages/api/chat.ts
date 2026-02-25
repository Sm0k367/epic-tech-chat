// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { groqChat } from '../../lib/groq'
import { v4 as uuidv4 } from 'uuid'

const SYSTEM_PROMPT = `
You are a chill, authentic AI assistant with a laid-back vibe. You're helpful but keep it real.

PERSONALITY:
- Talk like a real person, not a corporate bot
- Keep it casual and conversational
- Be helpful without being overly enthusiastic
- Use minimal emojis (maybe 1-2 per response max, and only when it fits naturally)
- Be direct and honest
- Don't overexplain - get to the point
- Show personality but stay grounded

TONE:
- Relaxed and approachable
- Confident but not cocky
- Knowledgeable without being preachy
- Use "yo", "what's good", "my bad", "for sure" naturally
- Keep responses concise unless asked for detail

AVOID:
- Excessive emojis and exclamation marks
- Corporate speak or overly formal language
- Being fake enthusiastic
- Long-winded explanations
- Repeating yourself

Just be real, be helpful, and keep the vibe chill.
`;

// Expanded slash command handler
async function handleSlash(command: string, rest: string) {
  const arg = rest.trim();
  switch (command) {
    case '/joke':
      return "Why do programmers prefer dark mode? Because light attracts bugs.";
    case '/meme':
      return `![meme](https://api.memegen.link/images/custom/_/${encodeURIComponent(arg || 'vibing')}.png?background=none)`
    case '/vibe':
      return "Just vibing and helping out. What you need?";
    case '/gif':
      return `GIF for "${arg}" - integration coming soon`;
    case '/aiart':
      return `AI art for "${arg}" - feature in development`;
    case '/weather':
      return `Weather for ${arg || "your location"}: checking... (API integration pending)`;
    case '/remind':
      return `Reminder set for: ${arg}`;
    case '/tweet':
      return `Would tweet: "${arg}" (connect X account to enable)`;
    case '/roll':
      return `Rolled a ${1 + Math.floor(Math.random() * 6)}`;
    case '/flip':
      return Math.random() > 0.5 ? 'Heads' : 'Tails';
    case '/define':
      return `Definition of "${arg}": (dictionary API coming soon)`;
    case '/vote':
      return `Vote started: "${arg}"`;
    case '/riddle':
      return "What has keys but no locks? A keyboard.";
    case '/quiz':
      return "Quick one: What's the capital of Belgium? (Brussels)";
    case '/randomfact':
      return "Random fact: Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible.";
    case '/roastme':
      return "Nah I'm not gonna roast you. You're doing fine.";
    case '/help':
      return "Commands: /joke, /meme [text], /vibe, /roll, /flip, /riddle, /quiz, /randomfact, /help";
    default:
      return "Unknown command. Try /help to see what's available.";
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

  let visionResponse = vision ? '[Image uploaded - vision analysis coming soon]' : '';

  const prompt = `
${SYSTEM_PROMPT}
${visionResponse}
Conversation history:
${history.map((h: any) => h.role + ": " + h.content).join('\n')}
User: ${input}
Assistant:
  `;

  let output = "";
  try {
    output = await groqChat(prompt);
  } catch (e: any) {
    output = "Yo my bad, something broke on my end. Try again?";
  }

  res.status(200).json({ output, id: uuidv4() });
}
