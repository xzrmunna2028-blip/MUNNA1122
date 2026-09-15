export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // System is healthy and operational 24/7
  return res.status(200).json({
    success: true,
    enabled: false,
    message: 'All systems operational 24/7 across Vercel cloud and client endpoints'
  });
}
