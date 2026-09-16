import { AuthStore } from './_lib/authStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const users = await AuthStore.getUsers();
    const user = users.find(u => u.email.toLowerCase().trim() === cleanEmail);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = 'Active';
    await AuthStore.saveUser(user);

    return res.status(200).json({
      success: true,
      message: `User ${user.email} approved successfully`,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
