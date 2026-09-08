import fs from 'fs';
import path from 'path';

export default async function handler(req: any, res: any) {
  try {
    const jsonPath = path.join(process.cwd(), 'iprn_sync.json');
    let data: any = { rented_numbers: [], last_updated: new Date().toISOString() };

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        data = JSON.parse(raw);
      } catch (e) {}
    }

    return res.status(200).json({
      status: 'success',
      last_updated: data.last_updated,
      numbers: data.rented_numbers || []
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
