import { AuthStore, UserRecord } from './_lib/authStore.js';

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

    const { token, password, phone, telegram, country, city, address, timezone, pin } = body || {};

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and Password are required.' });
    }

    const cleanToken = String(token).trim();
    const invitations = await AuthStore.getInvitations();
    const inv = invitations.find((i: any) => i.token.trim().toLowerCase() === cleanToken.toLowerCase());

    const targetEmail = inv ? inv.email : '';
    const targetName = inv ? (inv.name || inv.email.split('@')[0]) : 'User';
    const targetRole = inv ? inv.role : 'User';

    if (inv) {
      // Mark as used
      inv.status = 'used';
      await AuthStore.saveInvitation(inv);
    }

    // Save user as Pending for Admin approval
    if (targetEmail) {
      const newUser: UserRecord = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        name: targetName,
        email: targetEmail.toLowerCase().trim(),
        password: String(password),
        role: targetRole,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      await AuthStore.saveUser(newUser);
    }

    return res.status(200).json({
      success: true,
      message: 'Account registration submitted successfully. Waiting for admin approval.',
      email: targetEmail
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
