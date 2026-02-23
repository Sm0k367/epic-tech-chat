// pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-08-16' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Create a payment intent for tips/donations
    const { amount, currency = 'usd', user } = req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100), // dollars -> cents
        currency,
        description: `Epic Tech Chat tip from ${user || "anonymous"}`,
        metadata: { user: user || "guest" }
      });
      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
