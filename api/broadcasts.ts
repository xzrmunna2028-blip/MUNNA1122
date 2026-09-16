import { AuthStore } from './_lib/authStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const broadcasts = await AuthStore.getBroadcasts();
      return res.status(200).json({
        success: true,
        broadcasts
      });
    }

    if (req.method === 'POST') {
      const { title, message, category, targetRole, pinned, author } = req.body || {};
      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }

      const newNotice = {
        id: `notice-${Date.now()}`,
        title: String(title).trim(),
        message: String(message).trim(),
        category: category || 'Update',
        targetRole: targetRole || 'all',
        pinned: Boolean(pinned),
        author: author || 'Munna (Admin)',
        createdAt: new Date().toISOString()
      };

      await AuthStore.saveBroadcast(newNotice);

      return res.status(201).json({
        success: true,
        broadcast: newNotice
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || req.query || {};
      if (id) {
        await AuthStore.deleteBroadcast(String(id));
      }
      return res.status(200).json({ success: true, message: 'Broadcast deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
