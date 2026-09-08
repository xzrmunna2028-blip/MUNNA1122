import { CoreStore } from './_lib/store.js';

/**
 * Highly Scalable Enterprise Webhook API Route
 * Handles real-time API callbacks and webhooks with CORS & preflight support
 */
export default async function handler(req: any, res: any) {
  // Set CORS headers for external webhook origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET verification challenges / webhook status checks
  if (req.method === 'GET') {
    const challenge = req.query?.['hub.challenge'] || req.query?.challenge || req.query?.echostr;
    if (challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(200).json({
      status: 'active',
      message: 'CodeFlow Webhook listener is active and listening for real-time POST events.',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. Webhook expects POST requests.'
    });
  }

  try {
    // Read current state from Firestore
    const data = await CoreStore.read();

    // Safely parse incoming payload body
    let payload = req.body || {};
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (_) {
        try {
          const params = new URLSearchParams(payload);
          payload = Object.fromEntries(params.entries());
        } catch (e) {}
      }
    }

    // Unwrap nested payload wrapper if present
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      payload = { ...payload, ...payload.data };
    } else if (payload.payload && typeof payload.payload === 'object' && !Array.isArray(payload.payload)) {
      payload = { ...payload, ...payload.payload };
    }

    const eventType = String(payload.type || payload.event || payload.action || 'auto').toLowerCase();
    
    let processedType = 'unknown';
    let logMessage = '';

    // 1. Process Messages / SMS payloads
    if (
      eventType === 'message' || 
      eventType === 'sms' ||
      eventType === 'otp' ||
      payload.number || 
      payload.msisdn || 
      payload.text || 
      payload.content || 
      payload.message || 
      payload.otp
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

    // Persist modifications to Firestore
    await CoreStore.write(data);

    return res.status(200).json({
      status: 'success',
      processed: true,
      eventType: processedType,
      message: 'Webhook event processed and synced to Firestore successfully.',
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
      message: 'Failed to process webhook event',
      error: error.message
    });
  }
}

