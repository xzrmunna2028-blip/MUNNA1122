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

    const data = await CoreStore.read();

    // Determine assigned numbers for this user/admin
    const userNumbers = isAdmin
      ? (data.rented_numbers || [])
      : (data.rented_numbers || []).filter((n: any) => {
          const owner = (n.userId || n.user || n.email || '').toLowerCase().trim();
          return owner === userId;
        });

    const userNumsSet = new Set<string>(userNumbers.map((n: any) => String(n.number || n).trim().replace(/[^0-9]/g, '')));

    // Filter active SMS logs matching user numbers
    const userActiveLogs = userNumsSet.size === 0 ? [] : (data.active_sms_logs || []).filter((log: any) => {
      if (!log) return false;
      const clean = String(log.number || '').replace(/[^0-9]/g, '');
      return Array.from(userNumsSet).some((un: string) => clean.includes(un) || un.includes(clean));
    });

    const totalMessages = userActiveLogs.length;
    const delivered = userActiveLogs.filter((l: any) => l.status === 'DELIVERED').length;
    const failed = userActiveLogs.filter((l: any) => l.status === 'FAILED').length;
    const rate = totalMessages > 0 ? parseFloat(((delivered / totalMessages) * 100).toFixed(1)) : 0;

    const now = new Date();
    const todayPrefix = now.toISOString().split('T')[0];
    const todayCount = userActiveLogs.filter((l: any) => l.timestamp && l.timestamp.startsWith(todayPrefix)).length;

    const chart_data = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isoPrefix = d.toISOString().split('T')[0];

      const dayLogs = userActiveLogs.filter((l: any) => l.timestamp && l.timestamp.startsWith(isoPrefix));
      return {
        date: dateStr,
        total: dayLogs.length,
        delivered: dayLogs.filter((l: any) => l.status === 'DELIVERED').length,
        failed: dayLogs.filter((l: any) => l.status === 'FAILED').length
      };
    });

    return res.status(200).json({
      last_updated: data.last_updated || new Date().toISOString(),
      metrics: {
        messages: totalMessages,
        delivered: delivered,
        failed: failed,
        todayCount: todayCount,
        deliveryRate: rate,
        todayDate: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
        totalRanges: userNumbers.length
      },
      realtime_counters: {
        totalMessages: totalMessages,
        delivered: delivered,
        failed: failed,
        charged: delivered,
        totalRanges: userNumbers.length
      },
      chart_data: chart_data,
      active_sms_logs: userActiveLogs,
      rented_numbers: userNumbers
    });
  } catch (error: any) {
    console.error('[Vercel-Metrics] Failed to fetch dashboard metrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard metrics',
      error: error.message
    });
  }
}

