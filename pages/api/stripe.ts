// pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Stripe integration placeholder - install 'stripe' package to enable
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Placeholder for Stripe payment integration
    res.status(501).json({ 
      error: "Stripe integration not configured. Install 'stripe' package and add STRIPE_SECRET_KEY to enable payments." 
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
