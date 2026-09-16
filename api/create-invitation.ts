import { AuthStore } from './_lib/authStore.js';
import crypto from 'node:crypto';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse input from body (POST) or query (GET) to maximize flexibility and compatibility
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const query = req.query || {};
    const email = body.email || query.email || '';
    const name = body.name || query.name || '';
    const role = body.role || query.role || 'User';
    const balance = body.balance !== undefined ? body.balance : query.balance;
    const inviter = body.inviter || query.inviter || 'VoltxSMS Support';
    const hostUrl = body.hostUrl || query.hostUrl || '';

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split('@')[0] || 'User').trim();

    if (!cleanEmail) {
      return res.status(200).json({ success: false, error: 'A valid email address is required.' });
    }

    const clientToken = body.token || query.token;
    const token = clientToken ? String(clientToken).trim() : ('inv_' + crypto.randomBytes(16).toString('hex'));
    const now = Date.now();
    const FIFTY_YEARS_MS = 50 * 365 * 24 * 3600 * 1000;
    const expiresAt = now + FIFTY_YEARS_MS;

    let origin = String(hostUrl || '').trim().replace(/\/+$/, '');
    if (!origin || origin.includes('localhost') || origin.includes('run.app') || origin.includes('ais-')) {
      const headerHost = req.headers['x-forwarded-host'] || req.headers.host;
      if (headerHost && !headerHost.includes('localhost') && !headerHost.includes('run.app')) {
        const proto = req.headers['x-forwarded-proto'] || 'https';
        origin = `${proto}://${headerHost}`;
      } else {
        origin = 'https://codeflowsms.vercel.app';
      }
    }

    const roleVal = String(role || 'User');
    const balVal = typeof balance === 'number' ? balance : parseFloat(balance) || 50.0;
    const link = `${origin}/#onboarding?ref=cf${token.replace(/^inv_/, '')}`;

    const newInvite = {
      token,
      email: cleanEmail,
      name: cleanName,
      role: roleVal,
      balance: balVal,
      inviter: String(inviter || 'Admin Support'),
      createdAt: now,
      expiresAt,
      status: 'active' as const,
      link
    };

    // Keep all invitation tokens active and valid
    try {
      const existing = await AuthStore.getInvitations();
      existing.unshift(newInvite);
      await AuthStore.saveInvitations(existing);
    } catch (e) {
      await AuthStore.saveInvitation(newInvite);
    }

    return res.status(200).json({
      success: true,
      invitation: newInvite,
      link,
      expiresInSeconds: 50 * 365 * 24 * 3600
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
