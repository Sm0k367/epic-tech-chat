// lib/x.ts
import axios from "axios";

const X_API_URL = "https://api.twitter.com/2/tweets";

/**
 * Sends a tweet via the official Twitter API. You’ll need OAuth 2.0 Bearer Token.
 * @param message The content to tweet.
 * @param token Your X.com (Twitter) Bearer Token.
 * @returns Promise resolving with the response
 */
export async function tweet(message: string, token: string) {
  try {
    const { data } = await axios.post(
      X_API_URL,
      { text: message },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (e) {
    console.error("Twitter error:", e);
    throw e;
  }
}
