import { AuthStore } from './_lib/authStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let email = String(req.query?.email || '').trim().toLowerCase();
    if (!email && req.url) {
      const parsed = new URL(req.url, 'http://localhost');
      email = String(parsed.searchParams.get('email') || '').trim().toLowerCase();
      if (!email) {
        const parts = parsed.pathname.split('/');
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart && lastPart !== 'user-status') {
          email = decodeURIComponent(lastPart).trim().toLowerCase();
        }
      }
    }
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const users = AuthStore.getUsers();
    const user = users.find(u => u.email.toLowerCase().trim() === email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      status: user.status,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
