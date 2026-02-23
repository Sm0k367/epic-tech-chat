// pages/api/leaderboard.ts
import type { NextApiRequest, NextApiResponse } from 'next'

// In-memory leaderboard (swap for DB in prod!)
let fakeBoard = [
  { name: 'you', streak: 5, emoji: '🔥' },
  { name: 'guest42', streak: 3, emoji: '🤖' },
  { name: 'dj_smokestream', streak: 2, emoji: '💻' }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(fakeBoard);
  } else if (req.method === 'POST') {
    const { name, streak } = req.body;
    const found = fakeBoard.find(u => u.name === name);
    if (found) found.streak = streak;
    else fakeBoard.push({ name, streak, emoji: '⭐' });
    res.status(200).json({ ok: true });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
