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

    if (!isAdmin) {
      return res.status(200).json({
        last_updated: new Date().toISOString(),
        metrics: {
          messages: 0,
          delivered: 0,
          failed: 0,
          todayCount: 0,
          deliveryRate: 0.0,
          todayDate: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
          totalRanges: 0
        },
        realtime_counters: {
          totalMessages: 0,
          delivered: 0,
          failed: 0,
          charged: 0,
          totalRanges: 0
        },
        chart_data: [
          { date: 'Sep 10', total: 0, delivered: 0, failed: 0 },
          { date: 'Sep 11', total: 0, delivered: 0, failed: 0 },
          { date: 'Sep 12', total: 0, delivered: 0, failed: 0 },
          { date: 'Sep 13', total: 0, delivered: 0, failed: 0 },
          { date: 'Sep 14', total: 0, delivered: 0, failed: 0 },
          { date: 'Sep 15', total: 0, delivered: 0, failed: 0 },
          { date: 'Sep 16', total: 0, delivered: 0, failed: 0 }
        ],
        active_sms_logs: [],
        rented_numbers: []
      });
    }

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

