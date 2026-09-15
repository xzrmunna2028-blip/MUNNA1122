import { AuthStore } from './_lib/authStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { token } = body || {};
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const cleanToken = String(token).trim();
    const invites = AuthStore.getInvitations();
    const inv = invites.find((i: any) => i.token.trim().toLowerCase() === cleanToken.toLowerCase());

    if (!inv) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    inv.status = 'revoked';
    AuthStore.saveInvitation(inv);

    return res.status(200).json({
      success: true,
      message: 'Invitation link successfully revoked'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
