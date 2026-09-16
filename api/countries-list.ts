import { CountryStore } from './_lib/countryStore.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const countries = await CountryStore.getAll();
      return res.status(200).json({ status: 'success', countries });
    }

    if (req.method === 'POST') {
      const { country } = req.body || {};
      if (!country || !country.name) {
        return res.status(400).json({ status: 'error', message: 'Country name is required.' });
      }

      const saved = await CountryStore.save(country);
      const countries = await CountryStore.getAll();
      return res.status(200).json({
        status: 'success',
        message: `Country ${saved.name} saved successfully.`,
        country: saved,
        countries,
      });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ status: 'error', message: 'Country ID is required.' });
      }

      await CountryStore.delete(String(id));
      const countries = await CountryStore.getAll();
      return res.status(200).json({ status: 'success', message: 'Country deleted.', countries });
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Countries API error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
}
