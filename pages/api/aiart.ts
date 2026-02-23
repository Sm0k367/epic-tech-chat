// pages/api/aiart.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from "axios";

const DALL_E_API_URL = "https://api.openai.com/v1/images/generations";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.body;
  try {
    const { data } = await axios.post(
      DALL_E_API_URL,
      { prompt, n: 1, size: "512x512" },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.status(200).json({ url: data.data[0].url });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
