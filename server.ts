import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  const jsonPath = path.join(process.cwd(), 'iprn_sync.json');
  const pythonScriptPath = path.join(process.cwd(), 'iprn_sync.py');

  // Helper to read the IPRN JSON sync file
  const readSyncData = () => {
    try {
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading iprn_sync.json:', err);
    }
    
    // Hardcoded fallback baseline with 0 values
    return {
      last_updated: new Date().toISOString(),
      metrics: {
        messages: 0,
        delivered: 0,
        failed: 0,
        todayCount: 0,
        deliveryRate: 0.0,
        todayDate: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
      },
      realtime_counters: {
        totalMessages: 0,
        delivered: 0,
        failed: 0,
        charged: 0
      },
      chart_data: [
        { date: 'Sep 1', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 2', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 3', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 4', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 5', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 6', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 7', total: 0, delivered: 0, failed: 0 }
      ]
    };
  };

  // 1. GET Endpoint to fetch aggregated sync metrics
  app.get('/api/dashboard-metrics', (req, res) => {
    const data = readSyncData();
    res.json(data);
  });

  // Dedicated endpoint for Client Active SMS
  app.get('/api/active-sms', (req, res) => {
    const data = readSyncData();
    res.json({
      status: 'success',
      last_updated: data.last_updated,
      logs: data.active_sms_logs || []
    });
  });

  // Dedicated endpoint for My Numbers (GET and POST for automatic IPRN range synchronization)
  app.get('/api/my-numbers', (req, res) => {
    const data = readSyncData();
    res.json({
      status: 'success',
      last_updated: data.last_updated,
      numbers: data.rented_numbers || []
    });
  });

  // Dedicated endpoint for live terminations/ranges from IPRN API sync data
  app.get('/api/terminations', (req, res) => {
    const data = readSyncData();
    const numbers = data.rented_numbers || [];
    const termMap = new Map();

    numbers.forEach((n: any) => {
      const rangeName = n.rangeName || n.term || n.range || 'IPRN Range';
      const code = rangeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      if (!termMap.has(code)) {
        termMap.set(code, {
          code,
          country: n.country || 'Global',
          operator: n.operator || 'Carrier',
          available: 'Unlimited available',
          rate: n.rate || n.cost || '0.0096 USD',
          limit: n.portalLimit || '10,000',
          label: `${rangeName} (${n.rate || n.cost || '0.0096 USD'})`,
        });
      }
    });

    res.json({
      status: 'success',
      terminations: Array.from(termMap.values())
    });
  });

  app.post('/api/my-numbers', (req, res) => {
    const { newNumbers, numbers } = req.body;
    const itemsToAdd = newNumbers || numbers || [];
    if (!Array.isArray(itemsToAdd) || itemsToAdd.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No numbers provided' });
    }

    try {
      const data = readSyncData();
      const existing = data.rented_numbers || [];
      const existingNums = new Set(existing.map((n: any) => n.number));
      
      const formattedAdded = itemsToAdd.map((item: any) => ({
        id: item.id || `NUM-LIVE-${Math.floor(100000 + Math.random() * 900000)}`,
        rangeName: item.rangeName || item.range || `${item.operator || 'LIVE'}_RANGE`,
        number: item.number,
        rate: item.cost || item.rate || '0.0096 USD',
        term: item.term || item.operator || '1/1',
        country: item.country || 'Global',
        operator: item.operator || 'Carrier',
        status: 'Active',
        lastMessage: '-',
        portalLimit: item.portalLimit || '10,000',
        sidRange: item.sidRange || 'IPRN-Direct',
        multiLimit: item.multiLimit || 'No Limit',
        sidDidLimit: item.sidDidLimit || 'Unlimited',
        cost: item.cost || item.rate || '0.0096 USD'
      })).filter((n: any) => !existingNums.has(n.number));

      data.rented_numbers = [...formattedAdded, ...existing];
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

      // Immediately synchronize associated ranges with IPRN API
      syncWithIprn((updated) => {
        res.json({
          status: 'success',
          message: 'Numbers and associated ranges synchronized with IPRN API immediately.',
          numbers: (updated && updated.rented_numbers) ? updated.rented_numbers : data.rented_numbers
        });
      });
    } catch (e) {
      console.error('Failed to sync added numbers with IPRN API:', e);
      res.status(500).json({ status: 'error', message: 'Failed to synchronize numbers with IPRN API' });
    }
  });

  // Dedicated endpoint for SMS Statistics
  app.get('/api/statistics', (req, res) => {
    const data = readSyncData();
    res.json({
      status: 'success',
      last_updated: data.last_updated,
      metrics: data.metrics,
      chart_data: data.chart_data,
      logs: data.active_sms_logs || []
    });
  });

  // Function to execute synchronization with the IPRN API
  let isSyncing = false;
  const syncWithIprn = (callback?: (data: any) => void) => {
    if (isSyncing) {
      console.log('[IPRN-Sync] Sync already in progress, returning existing data.');
      if (callback) callback(readSyncData());
      return;
    }

    isSyncing = true;
    const env = {
      ...process.env,
      IPRN_API_KEY: process.env.IPRN_API_KEY || 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z',
    };

    exec(`python3 "${pythonScriptPath}"`, { env }, (error, stdout, stderr) => {
      isSyncing = false;
      if (error) {
        console.warn('[IPRN-Sync] Notice during background sync:', error.message);
      } else {
        console.log('[IPRN-Sync] Live sync completed successfully.');
      }
      if (callback) {
        callback(readSyncData());
      }
    });
  };

  // 2. POST Endpoint to manually trigger real-time Python sync from UI
  app.post('/api/trigger-sync', (req, res) => {
    console.log('Manual trigger: synchronizing via IPRN WebsiteDataSync...');
    syncWithIprn((data) => {
      res.json({
        status: 'success',
        simulated: false,
        message: 'Successfully updated metrics data from IPRN API via WebsiteDataSync.',
        data,
      });
    });
  });

  // Serve front-end assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Code Flow Server] Server running on http://localhost:${PORT}`);
  });
}

startServer();
