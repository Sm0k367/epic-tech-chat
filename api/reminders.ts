import type { NextApiRequest, NextApiResponse } from 'next'

let reminders: { time: string, user: string, message: string }[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Set a reminder
    const { time, user, message } = req.body;
    reminders.push({ time, user, message });
    res.status(200).json({ ok: true });
  } else if (req.method === 'GET') {
    // Get upcoming reminders (replace with user/session filter in production)
    res.status(200).json(reminders);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
