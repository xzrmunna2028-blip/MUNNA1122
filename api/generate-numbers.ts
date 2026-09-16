import { CoreStore, CustomTermStore } from './_lib/store.js';

// Global serverless map for cooling numbers (valid across container reuse)
const coolingNumbers = new Map<string, number>();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(451).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { rangeCode, rangeName, count = 1, userId, orderType = 'serial' } = req.body || {};
    
    // Strictly capped at maximum 50 numbers per request
    const requestedCount = Math.min(Math.max(1, parseInt(count, 10) || 1), 50);
    const reqUserId = (userId || 'default_user').toString().toLowerCase().trim();

    // 1. Fetch custom terminations from Firestore
    const customRanges = await CustomTermStore.getAll();
    const foundOfficial = customRanges.find(t => t.code === rangeCode || t.rangeName === rangeName || t.label === rangeName);

    const targetRangeName = rangeName || (foundOfficial ? foundOfficial.rangeName : 'Azerbaijan - Bakcell 3');
    const targetCountry = foundOfficial ? foundOfficial.country : (targetRangeName.includes(' - ') ? targetRangeName.split(' - ')[0].trim() : 'Global');
    const targetOperator = foundOfficial ? foundOfficial.operator : (targetRangeName.includes(' - ') ? targetRangeName.split(' - ')[1].trim() : 'Carrier');
    const targetRate = '0.0000 USD';
    const targetPrefix = foundOfficial && (foundOfficial as any).prefix ? (foundOfficial as any).prefix : '+9949977';
    const targetDigits = foundOfficial && (foundOfficial as any).digits ? Math.max(5, (foundOfficial as any).digits) : 6;

    // Clean up cooling numbers older than 24 hours
    const now = Date.now();
    for (const [num, ts] of coolingNumbers.entries()) {
      if (now - ts > 24 * 60 * 60 * 1000) {
        coolingNumbers.delete(num);
      }
    }

    // 2. Load sync data to get existing rented numbers
    const data = await CoreStore.read();
    const existingNumsClean = new Set((data.rented_numbers || []).map((n: any) => {
      return String(n.number || '').trim().replace(/[^0-9]/g, '');
    }));
    const selected: any[] = [];

    // 3. If range has custom uploaded numbers pool, pull numbers lazily
    if (foundOfficial) {
      // Lazy load only the specific numbers pool from Firestore subcollection pool_chunks!
      let pool = await CustomTermStore.getPool(foundOfficial.code);
      if (pool.length > 0) {
        if (orderType === 'random') {
          pool = pool.sort(() => Math.random() - 0.5);
        }
        for (const rawNum of pool) {
          if (selected.length >= requestedCount) break;
          let numStr = String(rawNum || '').trim();
          if (numStr && !numStr.startsWith('+')) numStr = `+${numStr}`;
          const cleanNum = numStr.replace(/[^0-9]/g, '');
          if (cleanNum && !existingNumsClean.has(cleanNum) && !coolingNumbers.has(numStr)) {
            selected.push({
              id: `NUM-CUSTOM-${cleanNum}`,
              userId: reqUserId,
              number: numStr,
              range: targetRangeName,
              rangeName: targetRangeName,
              operator: targetOperator,
              country: targetCountry,
              status: 'ACTIVE',
              cost: targetRate,
              rate: targetRate,
              expiry: 'Oct 08, 2026',
              term: '1/1',
              lastMessage: 'None',
              portalLimit: '10,000',
              sidRange: 'Admin File Batch',
              multiLimit: 'No Limit',
              sidDidLimit: 'Unlimited'
            });
            existingNumsClean.add(cleanNum);
          }
        }
      }
    }

    // 4. Generate pseudo-random numbers with prefix if pool is exhausted or not found
    let attempts = 0;
    while (selected.length < requestedCount && attempts < 500) {
      attempts++;
      const minRand = Math.pow(10, targetDigits - 1);
      const maxRand = Math.pow(10, targetDigits) - 1;
      const suffix = String(Math.floor(minRand + Math.random() * (maxRand - minRand + 1)));
      const genNum = `${targetPrefix}${suffix}`;
      const cleanGenNum = genNum.replace(/[^0-9]/g, '');
      if (!existingNumsClean.has(cleanGenNum) && !coolingNumbers.has(genNum)) {
        selected.push({
          id: `NUM-IPRN-${genNum.replace('+', '')}`,
          userId: reqUserId,
          number: genNum,
          range: targetRangeName,
          rangeName: targetRangeName,
          operator: targetOperator,
          country: targetCountry,
          status: 'ACTIVE',
          cost: targetRate,
          rate: targetRate,
          expiry: 'Oct 08, 2026',
          term: '1/1',
          lastMessage: 'None',
          portalLimit: '10,000',
          sidRange: 'IPRN-Direct',
          multiLimit: 'No Limit',
          sidDidLimit: 'Unlimited'
        });
        existingNumsClean.add(cleanGenNum);
      }
    }

    return res.status(200).json({
      status: 'success',
      numbers: selected
    });
  } catch (error: any) {
    console.error('Generate numbers API error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
}
