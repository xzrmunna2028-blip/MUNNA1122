import { CoreStore } from './_lib/store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = await CoreStore.read();

    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'success',
        last_updated: data.last_updated,
        numbers: data.rented_numbers || []
      });
    }

    if (req.method === 'POST') {
      const { newNumbers, numbers } = req.body || {};
      const itemsToAdd = newNumbers || numbers || [];
      if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
        return res.status(200).json({ status: 'error', message: 'No numbers provided' });
      }

      const existing = data.rented_numbers || [];
      const existingNums = new Set(existing.map((n: any) => n.number));
      
      const formattedAdded = itemsToAdd.map((item: any) => ({
        id: item.id || `NUM-LIVE-${Math.floor(100000 + Math.random() * 900000)}`,
        rangeName: item.rangeName || item.range || `${item.operator || 'LIVE'}_RANGE`,
        range: item.range || item.rangeName || `${item.operator || 'LIVE'}_RANGE`,
        allocatedAt: new Date().toISOString(),
        monthlyPrice: item.cost || item.rate || '0.0096 USD',
        number: item.number,
        rate: item.cost || item.rate || '0.0096 USD',
        term: item.term || item.operator || '1/1',
        country: item.country || 'Global',
        operator: item.operator || 'Carrier',
        status: 'Active',
        lastMessage: '-',
        portalLimit: item.portalLimit || '10,000',
        sidRange: item.sidRange || 'IPRN-Direct',
        multiLimit: item.multiLimit || 'No Limit',
        sidDidLimit: item.sidDidLimit || 'Unlimited',
        cost: item.cost || item.rate || '0.0096 USD'
      })).filter((n: any) => !existingNums.has(n.number));

      data.rented_numbers = [...formattedAdded, ...existing];
      data.last_updated = new Date().toISOString();

      await CoreStore.write(data);

      return res.status(200).json({
        status: 'success',
        message: 'Numbers successfully added and synchronized.',
        numbers: data.rented_numbers
      });
    }

    if (req.method === 'DELETE') {
      const { ids, deleteAll } = req.body || {};
      
      if (deleteAll) {
        data.rented_numbers = [];
      } else if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        data.rented_numbers = (data.rented_numbers || []).filter((n: any) => !idSet.has(n.id) && !idSet.has(n.number));
      }

      data.metrics.totalRanges = data.rented_numbers.length;
      if (data.realtime_counters) {
        data.realtime_counters.totalRanges = data.rented_numbers.length;
      }
      data.last_updated = new Date().toISOString();

      await CoreStore.write(data);

      return res.status(200).json({
        status: 'success',
        message: 'Numbers deleted successfully.',
        numbers: data.rented_numbers
      });
    }

    return res.status(451).json({ status: 'error', message: 'Method not allowed' });
  } catch (error: any) {
    console.error('My numbers API error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}
