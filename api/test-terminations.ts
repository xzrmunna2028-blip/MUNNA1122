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
    const customRanges = await CustomTermStore.getAll();
    const data = await CoreStore.read();
    const rentedNumbers = data.rented_numbers || [];

    const testItems = customRanges.map((t: any) => ({
      id: `TEST-${t.code}`,
      rangeName: t.rangeName,
      term: t.rangeName,
      range: t.rangeName,
      number: t.number || '',
      country: t.country,
      operator: t.operator,
      cost: t.rate || '0.0000 USD',
      rate: t.rate || '0.0000 USD',
      status: 'ACTIVE'
    }));

    return res.status(200).json({
      status: 'success',
      last_updated: new Date().toISOString(),
      numbers: testItems
    });
  } catch (error: any) {
    console.error('Test terminations error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
}
