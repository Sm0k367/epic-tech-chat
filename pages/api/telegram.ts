// pages/api/telegram.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, chatId } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const botUsername = 'EPICTHE_BOT';

  if (!botToken) {
    return res.status(500).json({ 
      error: 'Telegram bot not configured',
      message: 'Add TELEGRAM_BOT_TOKEN to environment variables'
    });
  }

  try {
    // Send message to Telegram bot and get response
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    // For now, we'll use a webhook approach or polling
    // This is a simplified version - you'll need to set up proper webhook handling
    
    // Send message to a specific chat (you'll need to configure this)
    const response = await axios.post(telegramApiUrl, {
      chat_id: chatId || process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });

    // In a real implementation, you'd wait for the bot's response via webhook
    // For now, return a confirmation
    res.status(200).json({ 
      output: `Message sent to @${botUsername}. Check Telegram for response!`,
      telegramResponse: response.data
    });

  } catch (error: any) {
    console.error('Telegram API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to communicate with Telegram bot',
      details: error.response?.data || error.message
    });
  }
}
