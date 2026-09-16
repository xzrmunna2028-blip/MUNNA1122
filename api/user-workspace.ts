import { WorkspaceStore } from './_lib/workspaceStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const emailParam = req.query?.email || req.body?.email;
  const email = String(emailParam || '').toLowerCase().trim();

  if (!email) {
    return res.status(400).json({ success: false, message: 'User email is required' });
  }

  try {
    if (req.method === 'GET') {
      const workspace = await WorkspaceStore.get(email);
      return res.status(200).json({ success: true, workspace });
    }

    if (req.method === 'POST') {
      const incoming = req.body || {};
      const success = await WorkspaceStore.save(email, incoming);
      const workspace = await WorkspaceStore.get(email);
      return res.status(200).json({ success, workspace });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('User workspace API error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
}
