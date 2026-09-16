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
    const { code, country, operator, rangeName, rate, limit, sampleNumber, service } = req.body || {};
    if (!code) {
      return res.status(200).json({ status: 'error', message: 'Range code is required for updates.' });
    }

    const updated = await CustomTermStore.updateMetadata(code, {
      country,
      operator: operator || service,
      service,
      rangeName,
      rate,
      limit,
      number: sampleNumber
    });

    return res.status(200).json({
      status: 'success',
      message: `Successfully updated termination: ${updated.rangeName}`,
      termination: updated
    });
  } catch (e: any) {
    console.error('Update termination api error:', e);
    return res.status(500).json({ status: 'error', message: e.message || 'Server error' });
  }
}
