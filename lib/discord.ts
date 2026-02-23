// lib/discord.ts
import axios from "axios";

/**
 * Sends a message or alert to your Discord server using a webhook URL.
 * @param content The text (or JSON) to send
 * @param webhookUrl Your Discord channel's webhook URL
 * @returns Promise that resolves when the message is sent
 */
export async function sendToDiscord(content: string, webhookUrl: string) {
  try {
    await axios.post(webhookUrl, {
      content
    });
    return true;
  } catch (err) {
    console.error("Discord webhook error:", err);
    return false;
  }
}
