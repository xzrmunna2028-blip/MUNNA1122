import { CoreStore, CustomTermStore } from './_lib/store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Fetch custom ranges from Firestore
    const customRanges = await CustomTermStore.getAll();

    // 2. Fetch global sync data to get rented numbers
    const data = await CoreStore.read();
    const rentedNumbers = data.rented_numbers || [];

    // 3. Match and calculate real-time stats for each range
    const terminations = customRanges.map((t: any) => {
      const total = t.totalNumbers || 0;
      
      // Calculate used count without loading the massive pool by matching range name/code
      const used = rentedNumbers.filter((n: any) => 
        (n.range === t.rangeName || n.rangeName === t.rangeName || n.range === t.code || n.rangeName === t.code)
      ).length;

      const available = Math.max(0, total - used);
      const outOfStock = total === 0 || (total > 0 && available === 0);

      return {
        ...t,
        poolStats: {
          total,
          used,
          available,
          outOfStock,
          lowStock: total > 0 && available > 0 && available <= 5
        },
        available: total > 0 ? `${available.toLocaleString()} available` : '0 available',
        label: `${t.rangeName} (${total > 0 ? `${available.toLocaleString()}/${total.toLocaleString()} in stock` : 'Out of Stock'})`
      };
    });

    return res.status(200).json({
      status: 'success',
      terminations
    });
  } catch (error: any) {
    console.error('Fetch terminations api error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}
