import { AuthStore } from './_lib/authStore.js';

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
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await AuthStore.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase().trim() === cleanEmail);

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const expectedPass = foundUser.password || foundUser.pass || '';
    if (expectedPass !== cleanPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (foundUser.status === 'Pending') {
      return res.status(403).json({
        success: false,
        status: 'Pending',
        message: 'Your account is pending admin approval'
      });
    }

    if (foundUser.status === 'Suspended') {
      return res.status(403).json({
        success: false,
        status: 'Suspended',
        message: 'Your account has been temporarily suspended'
      });
    }

    if (foundUser.status === 'Rejected') {
      return res.status(403).json({
        success: false,
        status: 'Rejected',
        message: 'Your account registration was rejected'
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role || 'User',
        status: foundUser.status
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
