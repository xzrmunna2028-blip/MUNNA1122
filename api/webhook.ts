import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Vercel Serverless API Route & Express-compatible Webhook Handler
 * 
 * Receives webhook data from IPRN / Virtual gateway APIs,
 * processes messages, numbers, and country list payloads,
 * logs user activity, and updates dashboard metrics in iprn_sync.json.
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests for webhook ingestion
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. Webhook expects POST requests.'
    });
  }

  try {
    const jsonPath = path.join(process.cwd(), 'iprn_sync.json');
    
    // Read the current state
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
        console.error('[Vercel-Webhook] Error reading existing iprn_sync.json:', e);
      }
    }

    // Ensure nested properties exist
    if (!data.metrics) data.metrics = {};
    if (!data.realtime_counters) data.realtime_counters = {};
    if (!data.active_sms_logs) data.active_sms_logs = [];
    if (!data.rented_numbers) data.rented_numbers = [];
    if (!data.activity_logs) data.activity_logs = [];

    const payload = req.body || {};
    const eventType = payload.type || payload.event || 'auto';
    let processedType = 'unknown';
    let logMessage = '';

    // 1. Process Messages / SMS payloads
    if (
      eventType === 'message' || 
      eventType === 'sms' ||
      (payload.number && (payload.text || payload.content || payload.message || payload.otp))
    ) {
      processedType = 'message';
      const id = String(payload.id || payload.message_id || `MSG-V-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
      let numStr = String(payload.number || payload.msisdn || '');
      if (numStr && !numStr.startsWith('+')) numStr = '+' + numStr;

      const newLog = {
        id,
        number: numStr,
        termination: String(payload.termination || payload.range_name || payload.range || 'IPRN Webhook Ingress'),
        sid: String(payload.sid || payload.sender_id || payload.sender || 'WEBHOOK'),
        status: String(payload.status || 'DELIVERED').toUpperCase(),
        text: String(payload.text || payload.content || payload.message || ''),
        otp: String(payload.otp || ''),
        timestamp: String(payload.timestamp || payload.created_at || new Date().toISOString()),
        cost: String(payload.cost || payload.rate || '0.0100 USD'),
        sender: String(payload.sender || 'IPRN-Gateway-Vercel')
      };

      // Append or replace
      data.active_sms_logs = [newLog, ...data.active_sms_logs.filter((l: any) => l.id !== id)];
      
      // Update counters
      const statusUpper = newLog.status;
      if (statusUpper === 'DELIVERED') {
        data.metrics.delivered = (data.metrics.delivered || 0) + 1;
        data.realtime_counters.delivered = (data.realtime_counters.delivered || 0) + 1;
      } else if (statusUpper === 'FAILED') {
        data.metrics.failed = (data.metrics.failed || 0) + 1;
        data.realtime_counters.failed = (data.realtime_counters.failed || 0) + 1;
      }
      
      data.metrics.messages = data.active_sms_logs.length;
      data.metrics.todayCount = (data.metrics.todayCount || 0) + 1;
      data.realtime_counters.totalMessages = data.active_sms_logs.length;
      
      // Compute delivery rate
      const total = data.metrics.messages || 1;
      const delivered = data.metrics.delivered || 0;
      data.metrics.deliveryRate = Math.round((delivered / total) * 100);

      logMessage = `Ingested SMS payload for number ${numStr} (Status: ${statusUpper})`;
    }

    // 2. Process Numbers / Virtual Gateway Range updates
    else if (
      eventType === 'number' || 
      eventType === 'rented_number' ||
      payload.numbers || 
      payload.rented_numbers ||
      Array.isArray(payload.number_list)
    ) {
      processedType = 'numbers';
      const rawNums = payload.numbers || payload.rented_numbers || payload.number_list || [];
      const incomingList = Array.isArray(rawNums) ? rawNums : [rawNums];
      
      let addedCount = 0;
      incomingList.forEach((n: any) => {
        if (!n || (!n.number && typeof n !== 'string')) return;
        const numVal = typeof n === 'string' ? n : n.number;
        
        // Avoid duplicates
        if (!data.rented_numbers.some((rn: any) => rn.number === numVal)) {
          data.rented_numbers.unshift({
            id: n.id || `NUM-WH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            number: numVal,
            range: n.range || n.rangeName || 'IPRN Webhook Range',
            allocatedAt: n.allocatedAt || new Date().toISOString(),
            status: n.status || 'Active',
            operator: n.operator || 'Virtual Carrier',
            monthlyPrice: n.monthlyPrice || '0.00 USD'
          });
          addedCount++;
        }
      });

      data.metrics.totalRanges = data.rented_numbers.length;
      data.realtime_counters.totalRanges = data.rented_numbers.length;
      logMessage = `Processed number list updates. Added ${addedCount} new active numbers.`;
    }

    // 3. Process Country Lists / Termination Lists
    else if (
      eventType === 'country_list' || 
      eventType === 'terminations' ||
      payload.countries || 
      payload.terminations
    ) {
      processedType = 'country_list';
      const list = payload.countries || payload.terminations || [];
      data.terminations = list; // persist the dynamic terminations lookup in metrics
      logMessage = `Successfully synchronized country/termination rates list containing ${list.length} entries.`;
    }

    // Fallback/ping payload
    else {
      processedType = 'ping';
      logMessage = 'Received ping verification / heartbeat payload.';
    }

    // 4. Create and log User Activity
    const newActivity = {
      id: `ACT-V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      event: eventType.toUpperCase(),
      processedType,
      description: logMessage,
      status: 'SUCCESS',
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Vercel Webhook Ingress Engine'
    };

    // Keep last 150 activity logs to prevent file bloating
    data.activity_logs = [newActivity, ...(data.activity_logs || [])].slice(0, 150);
    data.last_updated = new Date().toISOString();

    // Write updated dataset back to storage
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

    // Return beautiful serverless response
    return res.status(200).json({
      status: 'success',
      processed: true,
      eventType: processedType,
      message: 'Vercel Webhook processed successfully, user activity logged, and dashboard updated.',
      activity: {
        id: newActivity.id,
        description: newActivity.description,
        timestamp: newActivity.timestamp
      },
      dashboardMetrics: {
        totalMessages: data.metrics.messages,
        totalRanges: data.metrics.totalRanges,
        lastUpdated: data.last_updated
      }
    });

  } catch (error: any) {
    console.error('[Vercel-Webhook] Error processing serverless webhook:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process Vercel webhook',
      error: error.message
    });
  }
}
