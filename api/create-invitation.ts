import { AuthStore } from './_lib/authStore.js';
import crypto from 'node:crypto';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    const { email, name, role, balance, inviter, hostUrl } = body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || cleanEmail.split('@')[0] || 'User').trim();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const token = 'inv_' + crypto.randomBytes(12).toString('hex');
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

    const roleVal = role || 'User';
    const balVal = typeof balance === 'number' ? balance : parseFloat(balance) || 50.0;
    const link = `${origin}/#onboarding?token=${token}&email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(cleanName)}&role=${encodeURIComponent(roleVal)}&bal=${balVal}&exp=${expiresAt}`;

    const newInvite = {
      token,
      email: cleanEmail,
      name: cleanName,
      role: roleVal,
      balance: balVal,
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
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
