import { CoreStore } from './_lib/store';

export default async function handler(req: any, res: any) {
  try {
    const data = await CoreStore.read();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[Vercel-Metrics] Failed to fetch dashboard metrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard metrics',
      error: error.message
    });
  }
}
