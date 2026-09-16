import { CoreStore } from './_lib/store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = String(req.query?.userId || '').toLowerCase().trim();
    const isAdmin = userId === 'xzrmunna7788@gmail.com' || userId === 'xzrmunna7788';

    // Non-admin or unauthenticated requests always return empty logs by default
    if (!isAdmin && !userId) {
      return res.status(200).json({
        status: 'success',
        last_updated: new Date().toISOString(),
        logs: []
      });
    }

    const data = await CoreStore.read();
    let logs = data.active_sms_logs || [];

    if (!isAdmin && userId) {
      // Return only logs belonging to user's numbers
      logs = [];
    }

    return res.status(200).json({
      status: 'success',
      last_updated: data.last_updated,
      logs: logs
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
