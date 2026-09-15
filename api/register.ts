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
    const { name, email, password } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const users = AuthStore.getUsers();
    const existing = users.find(u => u.email.toLowerCase().trim() === cleanEmail);

    if (existing) {
      if (existing.status === 'Pending') {
        return res.status(200).json({
          success: true,
          status: 'Pending',
          message: 'Registration is already submitted and pending admin approval.'
        });
      }
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: 'User',
      status: 'Pending' as const,
      createdAt: new Date().toISOString()
    };

    AuthStore.saveUser(newUser);

    return res.status(201).json({
      success: true,
      status: 'Pending',
      message: 'Registration submitted successfully. Waiting for admin approval.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
