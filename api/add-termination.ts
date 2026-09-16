import { CustomTermStore } from './_lib/store.js';

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
    const { country, operator, rangeName, rate, limit = '10,000', sampleNumber = '', numbersPool = [], service = '' } = req.body || {};
    if (!country || !rangeName) {
      return res.status(200).json({ status: 'error', message: 'Country and Range Name are required.' });
    }

    const code = `TERM_${rangeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    const pool = Array.isArray(numbersPool) ? numbersPool : [];
    
    const newTerm = {
      code,
      country: String(country).trim(),
      operator: String(operator || service || 'Carrier').trim(),
      service: String(service || 'WhatsApp').trim(),
      rangeName: String(rangeName).trim(),
      rate: String(rate || '0.0000 USD').trim(),
      limit: String(limit || '10,000').trim(),
      number: String(sampleNumber || (pool.length > 0 ? pool[0] : '')).trim(),
      createdAt: Date.now()
    };

    // Save to Firestore with chunked numbers pool to support UNLIMITED numbers
    await CustomTermStore.save(newTerm, pool);

    return res.status(200).json({
      status: 'success',
      message: `Successfully added termination range: ${rangeName}`,
      termination: {
        ...newTerm,
        available: pool.length > 0 ? `${pool.length.toLocaleString()} available` : 'Unlimited available',
        label: `${rangeName} (${pool.length > 0 ? pool.length.toLocaleString() + ' file numbers' : 'Unlimited available'})`,
        totalNumbers: pool.length
      }
    });
  } catch (e: any) {
    console.error('Add termination api error:', e);
    return res.status(500).json({ status: 'error', message: e.message || 'Server error' });
  }
}
