import { AuthStore } from './_lib/authStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract token from query param, url path, or body
    let token = '';
    if (req.query && req.query.token) {
      token = String(req.query.token).trim();
    } else if (req.body && req.body.token) {
      token = String(req.body.token).trim();
    } else if (req.url) {
      const parsedUrl = new URL(req.url, 'http://localhost');
      token = parsedUrl.searchParams.get('token') || '';
      if (!token) {
        const parts = parsedUrl.pathname.split('/');
        token = parts[parts.length - 1] || '';
        if (token === 'verify-invitation') token = '';
      }
    }

    if (!token) {
      return res.status(400).json({
        valid: false,
        reason: 'no_token',
        message: 'No invitation token was provided.'
      });
    }

    const invitations = AuthStore.getInvitations();
    const inv = invitations.find((i: any) => i.token.trim().toLowerCase() === token.toLowerCase());

    if (!inv) {
      return res.status(200).json({
        valid: false,
        reason: 'not_found',
        message: 'This invitation link does not exist or has expired.'
      });
    }

    if (inv.status === 'used') {
      return res.status(200).json({
        valid: false,
        reason: 'already_used',
        message: 'This invitation link has already been used to create an account.',
        invitation: {
          email: inv.email,
          name: inv.name
        }
      });
    }

    const now = Date.now();
    if (now > inv.expiresAt || inv.status === 'expired') {
      return res.status(200).json({
        valid: false,
        reason: 'expired',
        message: 'This invitation link has expired. Please request a new link.',
        invitation: {
          email: inv.email,
          name: inv.name,
          expiresAt: inv.expiresAt
        }
      });
    }

    const remainingMs = Math.max(0, inv.expiresAt - now);

    return res.status(200).json({
      valid: true,
      invitation: inv,
      remainingMs,
      remainingSeconds: Math.floor(remainingMs / 1000)
    });
  } catch (err: any) {
    return res.status(500).json({
      valid: false,
      error: err.message || 'Internal server error'
    });
  }
}
