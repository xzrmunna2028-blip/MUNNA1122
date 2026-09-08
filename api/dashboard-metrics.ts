import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  try {
    const jsonPath = path.join(process.cwd(), 'iprn_sync.json');
    
    let data: any = {
      last_updated: new Date().toISOString(),
      metrics: { messages: 0, delivered: 0, failed: 0, todayCount: 0, deliveryRate: 0, todayDate: "9/8/2026", totalRanges: 0 },
      realtime_counters: { totalMessages: 0, delivered: 0, failed: 0, charged: 0, totalRanges: 0 },
      chart_data: [],
      active_sms_logs: [],
      rented_numbers: [],
      activity_logs: []
    };

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        data = JSON.parse(raw);
      } catch (e) {
        console.error('[Vercel-Metrics] Error reading iprn_sync.json:', e);
      }
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Vercel-Metrics] Error serving dashboard metrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard metrics',
      error: error.message
    });
  }
}
