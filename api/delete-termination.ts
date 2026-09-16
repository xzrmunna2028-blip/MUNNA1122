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
    const { code, rangeName } = req.body || {};
    if (!code && !rangeName) {
      return res.status(200).json({ status: 'error', message: 'Range code or rangeName is required.' });
    }

    let targetCode = code;

    // If code wasn't provided, find it by rangeName
    if (!targetCode && rangeName) {
      const allTerms = await CustomTermStore.getAll();
      const matched = allTerms.find(t => t.rangeName === rangeName || t.code === rangeName);
      if (matched) {
        targetCode = matched.code;
      }
    }

    if (!targetCode) {
      return res.status(200).json({ status: 'error', message: 'Termination range not found.' });
    }

    const success = await CustomTermStore.delete(targetCode);
    if (!success) {
      return res.status(200).json({ status: 'error', message: 'Failed to delete the termination range from Firestore.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Termination range successfully deleted and synchronized.',
      deletedCode: targetCode
    });
  } catch (e: any) {
    console.error('Delete termination api error:', e);
    return res.status(500).json({ status: 'error', message: e.message || 'Server error' });
  }
}
