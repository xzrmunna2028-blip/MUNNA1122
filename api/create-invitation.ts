import { AuthStore } from './_lib/authStore.js';
import crypto from 'node:crypto';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, role, balance, inviter, hostUrl } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split('@')[0] || 'User').trim();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const expiresAt = now + FIFTEEN_MINUTES_MS;

    let origin = (hostUrl || '').trim().replace(/\/+$/, '');
    if (!origin || origin.includes('localhost') || origin.includes('run.app') || origin.includes('ais-')) {
      const headerHost = req.headers['x-forwarded-host'] || req.headers.host;
      if (headerHost && !headerHost.includes('localhost') && !headerHost.includes('run.app')) {
        const proto = req.headers['x-forwarded-proto'] || 'https';
        origin = `${proto}://${headerHost}`;
      } else {
        origin = 'https://codeflowsms.vercel.app';
      }
    }

    const link = `${origin}/#onboarding?token=${token}`;

    const newInvite = {
      token,
      email: cleanEmail,
      name: cleanName,
      role: role || 'User',
      balance: typeof balance === 'number' ? balance : parseFloat(balance) || 50.0,
      inviter: inviter || 'VoltxSMS Support',
      createdAt: now,
      expiresAt,
      status: 'active' as const,
      link
    };

    AuthStore.saveInvitation(newInvite);

    return res.status(200).json({
      success: true,
      invitation: newInvite,
      link
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
