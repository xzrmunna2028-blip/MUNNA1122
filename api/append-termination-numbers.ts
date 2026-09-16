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
    const { rangeCode, newNumbers = [] } = req.body || {};
    if (!rangeCode) {
      return res.status(200).json({ status: 'error', message: 'Range code is required for appending numbers.' });
    }

    if (!Array.isArray(newNumbers) || newNumbers.length === 0) {
      return res.status(200).json({ status: 'error', message: 'No new valid numbers provided to append.' });
    }

    // Call helper to fetch current pool, merge, and save in Firestore pool_chunks
    const totalPool = await CustomTermStore.appendNumbers(rangeCode, newNumbers);

    return res.status(200).json({
      status: 'success',
      message: `Successfully appended ${newNumbers.length} numbers to range ${rangeCode}.`,
      addedCount: newNumbers.length,
      totalPool
    });
  } catch (e: any) {
    console.error('Append termination numbers error:', e);
    return res.status(500).json({ status: 'error', message: e.message || 'Server error' });
  }
}
