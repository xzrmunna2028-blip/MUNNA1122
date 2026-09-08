import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  // Support both GET and POST for triggering synchronization
  try {
    const jsonPath = path.join(process.cwd(), 'iprn_sync.json');
    
    // Read current sync data
    let data: any = {
      last_updated: new Date().toISOString(),
      metrics: { messages: 0, delivered: 0, failed: 0, todayCount: 0, deliveryRate: 0, todayDate: "", totalRanges: 0 },
      realtime_counters: { totalMessages: 0, delivered: 0, failed: 0, charged: 0, totalRanges: 0 },
      chart_data: [],
      active_sms_logs: [],
      rented_numbers: [],
      activity_logs: [],
      iprn_api_key: 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z'
    };

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        data = { ...data, ...parsed };
      } catch (e) {
        console.error('[Vercel-Sync] Error reading iprn_sync.json:', e);
      }
    }

    // Determine API Key
    const apiKey = data.iprn_api_key || process.env.IPRN_API_KEY || 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z';

    // 1. Fetch Real-time Numbers
    let fetchedNumbers: any[] = [];
    try {
      const numbersRes = await fetch('https://ksiiprn.com/api/v1/iprn/numbers?page=1', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (numbersRes.ok) {
        const json = await numbersRes.json();
        if (json && json.success && Array.isArray(json.data)) {
          fetchedNumbers = json.data;
        }
      } else {
        console.warn(`[Vercel-Sync] Numbers API responded with status ${numbersRes.status}`);
      }
    } catch (err: any) {
      console.error('[Vercel-Sync] Error fetching numbers from provider:', err.message);
    }

    // 2. Fetch Real-time Messages
    let fetchedMessages: any[] = [];
    let providerTotalMessages = 0;
    try {
      const messagesRes = await fetch('https://ksiiprn.com/api/v1/iprn/messages?page=1', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (messagesRes.ok) {
        const json = await messagesRes.json();
        if (json && json.success && Array.isArray(json.data)) {
          fetchedMessages = json.data;
          providerTotalMessages = json.pagination?.total || json.data.length || 0;
        }
      } else {
        console.warn(`[Vercel-Sync] Messages API responded with status ${messagesRes.status}`);
      }
    } catch (err: any) {
      console.error('[Vercel-Sync] Error fetching messages from provider:', err.message);
    }

    // 3. Process and merge fetched numbers into rented_numbers
    if (fetchedNumbers.length > 0) {
      const existingRented = data.rented_numbers || [];
      const numMap = new Map(existingRented.map((n: any) => [n.number, n]));

      fetchedNumbers.forEach((item: any) => {
        const numStr = String(item.number || item.msisdn || '');
        if (numStr) {
          const formattedNum = numStr.startsWith('+') ? numStr : '+' + numStr;
          const rangeName = item.rangeName || item.range_name || item.range || item.termination || 'Standard Range';
          
          numMap.set(formattedNum, {
            id: item.id || `NUM-API-${formattedNum.replace('+', '')}`,
            rangeName,
            number: formattedNum,
            rate: item.cost || item.rate || item.a2p_rate || '0.0096 USD',
            term: rangeName,
            country: item.country || (rangeName.includes(' - ') ? rangeName.split(' - ')[0] : 'Global'),
            operator: item.operator || (rangeName.includes(' - ') ? rangeName.split(' - ')[1] : 'Carrier'),
            status: item.status || 'Active',
            lastMessage: item.lastMessage || item.last_message_at || '-',
            portalLimit: item.portalLimit || item.limit || '10,000',
            sidRange: 'IPRN-Direct',
            multiLimit: 'No Limit',
            sidDidLimit: 'Unlimited',
            cost: item.cost || item.rate || '0.0096 USD'
          });
        }
      });
      
      data.rented_numbers = Array.from(numMap.values());
    }

    // 4. Process and merge fetched messages into active_sms_logs
    if (fetchedMessages.length > 0) {
      const existingLogs = data.active_sms_logs || [];
      const msgMap = new Map(existingLogs.map((m: any) => [m.id, m]));

      fetchedMessages.forEach((item: any) => {
        const id = String(item.id || item.message_id || `MSG-API-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
        let numStr = String(item.number || item.msisdn || '');
        if (numStr && !numStr.startsWith('+')) numStr = '+' + numStr;

        msgMap.set(id, {
          id,
          number: numStr,
          termination: String(item.range_name || item.termination || 'IPRN Gateway'),
          sid: String(item.sid || item.sender_id || item.sender || 'AUTHMSG'),
          status: String(item.status || 'DELIVERED').toUpperCase(),
          text: String(item.text || item.content || ''),
          otp: String(item.otp || ''),
          timestamp: String(item.timestamp || item.created_at || new Date().toISOString()),
          cost: `${parseFloat(item.cost || item.a2p_rate || 0.0100).toFixed(4)} USD`,
          sender: String(item.sender || item.sender_id || 'IPRN-API')
        });
      });

      data.active_sms_logs = Array.from(msgMap.values());
    }

    // 5. Compute consolidated stats and metrics
    const totalMessagesCount = data.active_sms_logs.length;
    const deliveredCount = data.active_sms_logs.filter((l: any) => l.status === 'DELIVERED').length;
    const failedCount = totalMessagesCount - deliveredCount;
    const deliveryRateVal = totalMessagesCount > 0 ? Math.round((deliveredCount / totalMessagesCount) * 100) : 100;
    const totalRangesCount = data.rented_numbers.length;

    const now = new Date();
    data.last_updated = now.toISOString();
    
    data.metrics = {
      messages: totalMessagesCount,
      delivered: deliveredCount,
      failed: failedCount,
      todayCount: totalMessagesCount,
      deliveryRate: deliveryRateVal,
      todayDate: now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      totalRanges: totalRangesCount
    };

    data.realtime_counters = {
      totalMessages: totalMessagesCount,
      delivered: deliveredCount,
      failed: failedCount,
      charged: totalMessagesCount,
      totalRanges: totalRangesCount
    };

    // Log this provider sync activity
    const newActivity = {
      id: `ACT-SYNC-${Date.now()}`,
      timestamp: now.toISOString(),
      event: 'SYNC',
      processedType: 'provider_sync',
      description: `Provider sync: Consolidated ${totalMessagesCount} messages & ${totalRangesCount} ranges from IPRN API.`,
      status: 'SUCCESS',
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
      userAgent: 'Vercel Serverless Sync SyncEngine'
    };

    data.activity_logs = [newActivity, ...(data.activity_logs || [])].slice(0, 150);

    // Save consolidated metrics
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

    return res.status(200).json({
      status: 'success',
      simulated: false,
      message: 'Successfully updated metrics data from IPRN API via Vercel WebsiteDataSync.',
      data
    });

  } catch (err: any) {
    console.error('[Vercel-Sync] Serverless sync error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Vercel Serverless Sync Failed',
      error: err.message
    });
  }
}
