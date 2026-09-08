import { CoreStore } from './_lib/store';

/**
 * Highly Scalable Vercel Trigger-Sync API Route
 * Synchronizes metrics from IPRN provider endpoints using robust non-blocking operations
 */
export default async function handler(req: any, res: any) {
  try {
    const data = await CoreStore.read();
    
    // Default fallback API Key
    const apiKey = data.iprn_api_key || process.env.IPRN_API_KEY || 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z';

    // 1. Fetch Provider Numbers with Auto Retry & Rate Limit Handling
    let fetchedNumbers: any[] = [];
    try {
      const numbersRes = await CoreStore.fetchWithRetry(
        'https://ksiiprn.com/api/v1/iprn/numbers?page=1',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        },
        3, // 3 retries
        1000 // exponential delay
      );
      
      if (numbersRes.ok) {
        const json = await numbersRes.json();
        if (json && json.success && Array.isArray(json.data)) {
          fetchedNumbers = json.data;
        }
      }
    } catch (err: any) {
      console.error('[Vercel-Sync] Numbers fetch exhausted retries:', err.message);
    }

    // 2. Fetch Provider Messages with Auto Retry & Rate Limit Handling
    let fetchedMessages: any[] = [];
    try {
      const messagesRes = await CoreStore.fetchWithRetry(
        'https://ksiiprn.com/api/v1/iprn/messages?page=1',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          }
        },
        3, // 3 retries
        1000 // exponential delay
      );
      
      if (messagesRes.ok) {
        const json = await messagesRes.json();
        if (json && json.success && Array.isArray(json.data)) {
          fetchedMessages = json.data;
        }
      }
    } catch (err: any) {
      console.error('[Vercel-Sync] Messages fetch exhausted retries:', err.message);
    }

    // 3. Import and format fetched numbers
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

    // 4. Import and format fetched messages
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

    // Recompute stats and append success log
    const logMsg = `Consolidated dynamic data from IPRN: Imported ${fetchedMessages.length} fresh messages & ${fetchedNumbers.length} ranges.`;
    CoreStore.logActivity('SYNC', 'provider_sync', logMsg, req, data);

    // Save update asynchronously
    await CoreStore.write(data);

    return res.status(200).json({
      status: 'success',
      message: 'Dynamic sync completed and metrics updated successfully.',
      data
    });

  } catch (err: any) {
    console.error('[Vercel-Sync] Core trigger-sync failed:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to synchronize with IPRN provider',
      error: err.message
    });
  }
}
