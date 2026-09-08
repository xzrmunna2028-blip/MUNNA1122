import { CoreStore } from './_lib/store.js';

/**
 * Highly Scalable Vercel Webhook API Route
 * Optimized for peak traffic and concurrency
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. Webhook expects POST requests.'
    });
  }

  try {
    // Await non-blocking read
    const data = await CoreStore.read();
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
      logMessage = CoreStore.processSms(payload, data);
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
      logMessage = CoreStore.processNumbers(payload, data);
    }

    // 3. Process Country Lists / Terminations
    else if (
      eventType === 'country_list' || 
      eventType === 'terminations' ||
      payload.countries || 
      payload.terminations
    ) {
      processedType = 'country_list';
      const list = payload.countries || payload.terminations || [];
      data.terminations = list;
      logMessage = `Successfully synchronized country/termination rate tables with ${list.length} routes via webhook.`;
    }

    // Default Fallback
    else {
      processedType = 'ping';
      logMessage = 'Ingested heartbeat/ping notification webhook from gateway.';
    }

    // Log Activity History
    CoreStore.logActivity(eventType, processedType, logMessage, req, data);

    // Persist modifications asynchronously & non-blocking
    await CoreStore.write(data);

    return res.status(200).json({
      status: 'success',
      processed: true,
      eventType: processedType,
      message: 'Vercel Webhook processed successfully, activity history saved, and dashboard counters updated.',
      activity: {
        description: logMessage,
        timestamp: new Date().toISOString()
      },
      dashboardMetrics: {
        totalMessages: data.metrics.messages,
        totalRanges: data.metrics.totalRanges,
        lastUpdated: data.last_updated
      }
    });

  } catch (error: any) {
    console.error('[Vercel-Webhook] Serverless process failed:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process Vercel webhook securely',
      error: error.message
    });
  }
}
