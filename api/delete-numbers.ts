import { CoreStore } from './_lib/store.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(451).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { ids, deleteAll } = req.body || {};
    const data = await CoreStore.read();
    
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
  } catch (e: any) {
    console.error('Delete numbers error:', e);
    return res.status(500).json({ status: 'error', message: e.message || 'Server error' });
  }
}
