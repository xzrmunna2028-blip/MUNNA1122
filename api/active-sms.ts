import { CoreStore } from './_lib/store';

export default async function handler(req: any, res: any) {
  try {
    const data = CoreStore.read();
    return res.status(200).json({
      status: 'success',
      last_updated: data.last_updated,
      logs: data.active_sms_logs || []
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}
