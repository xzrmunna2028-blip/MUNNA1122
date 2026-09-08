import { CoreStore } from './_lib/store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = await CoreStore.read();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Vercel-Metrics] Failed to fetch dashboard metrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard metrics',
      error: error.message
    });
  }
}

