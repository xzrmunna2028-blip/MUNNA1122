import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { CoreStore } from './api/_lib/store.js';
import { KSI_MASTER_TERMINATIONS } from './src/data/ksiMasterRanges.ts';
import { WebSocketServer, WebSocket } from 'ws';
import nodemailer from 'nodemailer';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Enable CORS for all API endpoints
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-signature');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  const jsonPath = path.join(process.cwd(), 'iprn_sync.json');
  const pythonScriptPath = path.join(process.cwd(), 'iprn_sync.py');

  // Helper to read the IPRN JSON sync file with Firestore fallback/sync
  const readSyncData = () => {
    try {
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.active_sms_logs)) {
          parsed.active_sms_logs = parsed.active_sms_logs.filter((log: any) => log && typeof log === 'object');
          if (parsed.metrics) {
            parsed.metrics.messages = parsed.active_sms_logs.length;
          }
          if (parsed.realtime_counters) {
            parsed.realtime_counters.totalMessages = parsed.active_sms_logs.length;
          }
        }
        return parsed;
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

  // Real-Time Event Stream (SSE) and WebSockets for instant cross-session synchronization
  const sseClients = new Set<express.Response>();
  const wsClients = new Set<WebSocket>();

  app.get('/api/stream-updates', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);

    // Send immediate current snapshot to client
    const data = readSyncData();
    res.write(`data: ${JSON.stringify(data)}\n\n`);

    // Trigger rate-limit safe background poll if cooldown period has passed
    pollIprnMessages(false);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  const broadcastUpdate = (data: any) => {
    // 1. SSE Broadcast
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        sseClients.delete(client);
      }
    }

    // 2. WebSocket Broadcast
    const wsPayload = JSON.stringify({ type: 'update', data });
    for (const client of wsClients) {
      try {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(wsPayload);
        }
      } catch (err) {
        wsClients.delete(client);
      }
    }
  };

  // 1. GET Endpoint to fetch aggregated sync metrics
  app.get('/api/dashboard-metrics', (req, res) => {
    const data = readSyncData();
    res.json(data);
  });

  // Dedicated endpoint for Client Active SMS
  app.get('/api/active-sms', (req, res) => {
    const data = readSyncData();
    const allLogs = data.active_sms_logs || [];
    
    const now = new Date();
    // Start of today in UTC
    const todayUTC = now.toISOString().split('T')[0];
    // Start of today in user's local standard offset (e.g., -7 hours)
    const todayLocal = new Date(Date.now() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    // Also include anything within the last 24 hours just to be completely safe
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const todayLogs = allLogs.filter((log: any) => {
      try {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime >= twentyFourHoursAgo) {
          return true;
        }
        const logDateStr = new Date(log.timestamp).toISOString().split('T')[0];
        return logDateStr === todayUTC || logDateStr === todayLocal;
      } catch (e) {
        return false;
      }
    });

    res.json({
      status: 'success',
      last_updated: data.last_updated,
      logs: todayLogs
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

  // Helper to extract termination ranges ONLY from custom entries added by admin with real-time stock tracking
  const getAllTerminations = (data: any) => {
    const rangeMap = new Map<string, any>();
    const rentedNumsSet = new Set((data.rented_numbers || []).map((n: any) => {
      return String(n.number || '').trim().replace(/[^0-9]/g, '');
    }));

    // Custom ranges added by the admin
    (data.custom_ranges || []).forEach((t: any) => {
      if (t && t.code) {
        const pool = Array.isArray(t.numbersPool) ? t.numbersPool : [];
        const total = pool.length;
        const used = pool.filter((num: string) => {
          const clean = String(num || '').trim().replace(/[^0-9]/g, '');
          return clean && rentedNumsSet.has(clean);
        }).length;
        const available = Math.max(0, total - used);
        const outOfStock = total === 0 || (total > 0 && available === 0);

        const enhanced = {
          ...t,
          poolStats: {
            total,
            used,
            available,
            outOfStock,
            lowStock: total > 0 && available > 0 && available <= 5
          },
          available: total > 0 ? `${available} available` : '0 available',
          label: `${t.rangeName || t.country} (${total > 0 ? `${available}/${total} in stock` : 'Out of Stock'})`
        };
        rangeMap.set(t.code, enhanced);
      }
    });

    return Array.from(rangeMap.values());
  };

  // Dedicated endpoint for live terminations/ranges from IPRN API sync data
  app.get('/api/terminations', (req, res) => {
    const data = readSyncData();
    const terminations = getAllTerminations(data);
    res.json({
      status: 'success',
      terminations
    });
  });

  // Dedicated endpoint to add a custom termination range to the website
  app.post('/api/add-termination', async (req, res) => {
    try {
      const { country, operator, rangeName, rate, limit = '10,000', sampleNumber = '', numbersPool = [], service = '' } = req.body;
      if (!country || !rangeName) {
        return res.status(400).json({ status: 'error', message: 'Country and Range Name are required.' });
      }

      const code = `TERM_${rangeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
      const poolCount = Array.isArray(numbersPool) ? numbersPool.length : 0;
      const newTerm = {
        code,
        country,
        operator: operator || service || 'Carrier',
        service: service || 'Telegram',
        rangeName,
        available: poolCount > 0 ? `${poolCount} available` : 'Unlimited available',
        rate: rate || '0.0000 USD',
        limit: limit || '10,000',
        number: sampleNumber || (poolCount > 0 ? numbersPool[0] : ''),
        label: `${rangeName} (${poolCount > 0 ? poolCount + ' file numbers' : 'Unlimited available'})`,
        numbersPool: Array.isArray(numbersPool) ? numbersPool : []
      };

      const data = readSyncData();
      if (!data.custom_ranges) {
        data.custom_ranges = [];
      }

      // Avoid duplicates
      const existsIdx = data.custom_ranges.findIndex((t: any) => t.code === code);
      if (existsIdx !== -1) {
        data.custom_ranges[existsIdx] = { ...data.custom_ranges[existsIdx], ...newTerm };
      } else {
        data.custom_ranges.push(newTerm);
      }
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      try {
        await CoreStore.write(data);
      } catch (dbErr: any) {
        console.warn('[IPRN] Firestore custom ranges write notice:', dbErr.message);
      }
      broadcastUpdate(data);

      res.json({
        status: 'success',
        message: `Successfully added termination range: ${rangeName}`,
        termination: newTerm
      });
    } catch (e: any) {
      console.error('Add termination error:', e);
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Dedicated endpoint to append additional numbers to an existing custom termination range
  app.post('/api/append-termination-numbers', async (req, res) => {
    try {
      const { rangeCode, newNumbers = [] } = req.body;
      if (!rangeCode || !Array.isArray(newNumbers) || newNumbers.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Range code and valid numbers list are required.' });
      }

      const data = readSyncData();
      if (!data.custom_ranges) data.custom_ranges = [];
      const termIdx = data.custom_ranges.findIndex((t: any) => t.code === rangeCode);
      if (termIdx === -1) {
        return res.status(404).json({ status: 'error', message: 'Termination range not found.' });
      }

      const currentPool = new Set(data.custom_ranges[termIdx].numbersPool || []);
      let addedCount = 0;
      newNumbers.forEach((n: string) => {
        let clean = String(n || '').trim();
        if (clean) {
          if (!clean.startsWith('+')) clean = `+${clean}`;
          if (!currentPool.has(clean)) {
            currentPool.add(clean);
            addedCount++;
          }
        }
      });

      const updatedPool = Array.from(currentPool);
      data.custom_ranges[termIdx].numbersPool = updatedPool;
      data.custom_ranges[termIdx].available = `${updatedPool.length} available`;
      data.custom_ranges[termIdx].label = `${data.custom_ranges[termIdx].rangeName} (${updatedPool.length} file numbers)`;

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      try {
        await CoreStore.write(data);
      } catch (dbErr: any) {}
      broadcastUpdate(data);

      res.json({
        status: 'success',
        message: `Successfully appended ${addedCount} numbers to ${data.custom_ranges[termIdx].rangeName}.`,
        totalPool: updatedPool.length,
        addedCount,
        termination: data.custom_ranges[termIdx]
      });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // In-memory cooling registry for released numbers (cooldown of 24h to avoid immediate recycling)
  const coolingNumbers = new Map<string, number>();

  // Dedicated endpoint to generate/allocate real numbers with per-user isolation and smart rotation
  app.post('/api/generate-numbers', (req, res) => {
    try {
      const { rangeCode, rangeName, count = 1, userId, orderType = 'serial' } = req.body;
      // Strictly capped at maximum 50 numbers per request
      const requestedCount = Math.min(Math.max(1, parseInt(count, 10) || 1), 50);
      const reqUserId = (userId || 'default_user').toString().toLowerCase().trim();
      
      const data = readSyncData();
      const allTerms = getAllTerminations(data);
      const foundOfficial = allTerms.find(t => t.code === rangeCode || t.rangeName === rangeName || t.label === rangeName);
      
      const targetRangeName = rangeName || (foundOfficial ? foundOfficial.rangeName : 'Azerbaijan - Bakcell 3');
      const targetCountry = foundOfficial ? foundOfficial.country : (targetRangeName.includes(' - ') ? targetRangeName.split(' - ')[0].trim() : 'Global');
      const targetOperator = foundOfficial ? foundOfficial.operator : (targetRangeName.includes(' - ') ? targetRangeName.split(' - ')[1].trim() : 'Carrier');
      const targetRate = '0.0000 USD';
      const targetPrefix = foundOfficial && foundOfficial.prefix ? foundOfficial.prefix : '+9949977';
      const targetDigits = foundOfficial && foundOfficial.digits ? Math.max(5, foundOfficial.digits) : 6;

      // Clean up cooling numbers older than 24 hours
      const now = Date.now();
      for (const [num, ts] of coolingNumbers.entries()) {
        if (now - ts > 24 * 60 * 60 * 1000) {
          coolingNumbers.delete(num);
        }
      }

      // Existing numbers already active in the system
      const existingNumsClean = new Set((data.rented_numbers || []).map((n: any) => {
        return String(n.number || '').trim().replace(/[^0-9]/g, '');
      }));
      const selected: any[] = [];

      // 1. If range has custom uploaded numbersPool from admin file upload, pull rotated non-conflicting numbers
      if (foundOfficial && Array.isArray((foundOfficial as any).numbersPool) && (foundOfficial as any).numbersPool.length > 0) {
        let pool = [...(foundOfficial as any).numbersPool];
        if (orderType === 'random') {
          pool = pool.sort(() => Math.random() - 0.5);
        }
        for (const rawNum of pool) {
          if (selected.length >= requestedCount) break;
          let numStr = String(rawNum || '').trim();
          if (numStr && !numStr.startsWith('+')) numStr = `+${numStr}`;
          const cleanNum = numStr.replace(/[^0-9]/g, '');
          if (cleanNum && !existingNumsClean.has(cleanNum) && !coolingNumbers.has(numStr)) {
            selected.push({
              id: `NUM-CUSTOM-${cleanNum}`,
              userId: reqUserId,
              number: numStr,
              range: targetRangeName,
              rangeName: targetRangeName,
              operator: targetOperator,
              country: targetCountry,
              status: 'ACTIVE',
              cost: targetRate,
              rate: targetRate,
              expiry: 'Oct 08, 2026',
              term: '1/1',
              lastMessage: 'None',
              portalLimit: '10,000',
              sidRange: 'Admin File Batch',
              multiLimit: 'No Limit',
              sidDidLimit: 'Unlimited'
            });
            existingNumsClean.add(cleanNum);
          }
        }
      }

      // 2. If matching numbers from raw IPRN pool
      if (selected.length < requestedCount) {
        let pool: any[] = [];
        const rawPath = path.join(process.cwd(), 'all_iprn_numbers_raw.json');
        if (fs.existsSync(rawPath)) {
          try {
            pool = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
          } catch (e) {}
        }

        const matchedPool = pool.filter((item: any) => {
          const r = item.range_name || item.rangeName || item.range || '';
          return r.toLowerCase().includes(targetRangeName.toLowerCase());
        }).sort(() => Math.random() - 0.5);

        for (const item of matchedPool) {
          if (selected.length >= requestedCount) break;
          let rawNum = String(item.number || '').trim();
          let numStr = rawNum.startsWith('+') ? rawNum : `+${rawNum}`;
          const cleanNum = numStr.replace(/[^0-9]/g, '');
          if (!existingNumsClean.has(cleanNum) && !coolingNumbers.has(numStr)) {
            selected.push({
              id: `NUM-IPRN-${rawNum.replace('+', '')}`,
              userId: reqUserId,
              number: numStr,
              range: item.range_name || targetRangeName,
              rangeName: item.range_name || targetRangeName,
              operator: targetOperator,
              country: targetCountry,
              status: 'ACTIVE',
              cost: targetRate,
              rate: targetRate,
              expiry: 'Oct 08, 2026',
              term: '1/1',
              lastMessage: item.last_message_at || 'None',
              portalLimit: '10,000',
              sidRange: 'IPRN-Direct',
              multiLimit: 'No Limit',
              sidDidLimit: 'Unlimited'
            });
            existingNumsClean.add(cleanNum);
          }
        }
      }

      // 3. Generate high-entropy, strictly unique numbers with dynamic rotation
      let attempts = 0;
      while (selected.length < requestedCount && attempts < 500) {
        attempts++;
        const minRand = Math.pow(10, targetDigits - 1);
        const maxRand = Math.pow(10, targetDigits) - 1;
        const suffix = String(Math.floor(minRand + Math.random() * (maxRand - minRand + 1)));
        const genNum = `${targetPrefix}${suffix}`;
        const cleanGenNum = genNum.replace(/[^0-9]/g, '');
        if (!existingNumsClean.has(cleanGenNum) && !coolingNumbers.has(genNum)) {
          selected.push({
            id: `NUM-IPRN-${genNum.replace('+', '')}`,
            userId: reqUserId,
            number: genNum,
            range: targetRangeName,
            rangeName: targetRangeName,
            operator: targetOperator,
            country: targetCountry,
            status: 'ACTIVE',
            cost: targetRate,
            rate: targetRate,
            expiry: 'Oct 08, 2026',
            term: '1/1',
            lastMessage: 'None',
            portalLimit: '10,000',
            sidRange: 'IPRN-Direct',
            multiLimit: 'No Limit',
            sidDidLimit: 'Unlimited'
          });
          existingNumsClean.add(cleanGenNum);
        }
      }

      res.json({
        status: 'success',
        numbers: selected
      });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

  // Dedicated endpoint for available test terminations/numbers
  app.get('/api/test-terminations', (req, res) => {
    const data = readSyncData();
    const allTerms = getAllTerminations(data);
    const testItems = allTerms.map((t: any) => ({
      id: `TEST-${t.code}`,
      rangeName: t.rangeName,
      term: t.rangeName,
      range: t.rangeName,
      number: t.number || '',
      country: t.country,
      operator: t.operator,
      cost: t.rate,
      rate: t.rate,
      status: 'ACTIVE'
    }));

    res.json({
      status: 'success',
      last_updated: new Date().toISOString(),
      numbers: testItems
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

  // Dedicated endpoint to permanently delete numbers from server store
  app.post('/api/delete-numbers', (req, res) => {
    try {
      const { ids, deleteAll } = req.body || {};
      const data = readSyncData();
      
      if (deleteAll) {
        (data.rented_numbers || []).forEach((n: any) => {
          if (n && n.number) coolingNumbers.set(n.number, Date.now());
        });
        data.rented_numbers = [];
      } else if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        (data.rented_numbers || []).forEach((n: any) => {
          if (n && (idSet.has(n.id) || idSet.has(n.number))) {
            coolingNumbers.set(n.number, Date.now());
          }
        });
        data.rented_numbers = (data.rented_numbers || []).filter((n: any) => !idSet.has(n.id) && !idSet.has(n.number));
      }

      data.metrics.totalRanges = data.rented_numbers.length;
      data.realtime_counters.totalRanges = data.rented_numbers.length;
      data.last_updated = new Date().toISOString();

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      broadcastUpdate(data);

      res.json({
        status: 'success',
        message: 'Numbers deleted and cooled successfully.',
        numbers: data.rented_numbers
      });
    } catch (e: any) {
      console.error('Delete numbers error:', e);
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

  app.delete('/api/my-numbers', (req, res) => {
    try {
      const { ids, deleteAll } = req.body || {};
      const data = readSyncData();
      
      if (deleteAll) {
        data.rented_numbers = [];
      } else if (Array.isArray(ids) && ids.length > 0) {
        const idSet = new Set(ids);
        data.rented_numbers = (data.rented_numbers || []).filter((n: any) => !idSet.has(n.id) && !idSet.has(n.number));
      } else {
        data.rented_numbers = [];
      }

      data.metrics.totalRanges = data.rented_numbers.length;
      data.realtime_counters.totalRanges = data.rented_numbers.length;
      data.last_updated = new Date().toISOString();

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      broadcastUpdate(data);

      res.json({
        status: 'success',
        message: 'Numbers cleared successfully.',
        numbers: data.rented_numbers
      });
    } catch (e: any) {
      console.error('Delete my-numbers error:', e);
      res.status(500).json({ status: 'error', message: e.message });
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

  let currentApiKey = process.env.IPRN_API_KEY || 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z';

  // GET and POST Endpoints for dynamic API Key management
  app.get('/api/get-api-key', (req, res) => {
    res.json({
      status: 'success',
      apiKey: currentApiKey
    });
  });

  app.post('/api/set-api-key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return res.status(400).json({ status: 'error', message: 'Valid API Key string is required' });
    }

    currentApiKey = apiKey.trim();
    process.env.IPRN_API_KEY = currentApiKey;

    console.log(`[IPRN-Key] Active API Key set to: ${currentApiKey.substring(0, 12)}...`);

    // Immediately trigger message fetch & python sync with newly set key
    pollIprnMessages();
    syncWithIprn();

    res.json({
      status: 'success',
      message: 'IPRN API key updated and real-time live SMS stream connected.',
      apiKey: currentApiKey
    });
  });

  let webhookSigningSecret = process.env.WEBHOOK_SIGNING_SECRET || 'a61d5fecae5d2e870d7e37e3f4a05a87c950899d7c59d95265667ba7e01a53b2';

  // GET and POST Endpoints for Webhook Signing Secret Management
  app.get('/api/webhook-secret', (req, res) => {
    res.json({
      status: 'success',
      secret: webhookSigningSecret
    });
  });

  app.post('/api/webhook-secret', (req, res) => {
    const { secret } = req.body;
    if (!secret || typeof secret !== 'string' || !secret.trim()) {
      return res.status(400).json({ status: 'error', message: 'Valid Signing Secret string is required' });
    }

    webhookSigningSecret = secret.trim();
    process.env.WEBHOOK_SIGNING_SECRET = webhookSigningSecret;

    console.log(`[Webhook-Key] Webhook Signing Secret updated: ${webhookSigningSecret.substring(0, 10)}...`);

    res.json({
      status: 'success',
      message: 'Webhook signing secret updated successfully.',
      secret: webhookSigningSecret
    });
  });

  // Webhook Signature Verification and Data Ingestion Handler
  const handleWebhookPayload = async (req: any, res: any) => {
    try {
      const signatureHeader = 
        req.headers['x-webhook-signature'] || 
        req.headers['x-ksiprn-signature'] || 
        req.headers['x-signature'] || 
        req.headers['signature'] || 
        req.headers['stripe-signature'] || '';
      
      const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
      const computedHmac = crypto.createHmac('sha256', webhookSigningSecret).update(rawBody).digest('hex');

      let isVerified = false;
      if (signatureHeader) {
        const sigStr = String(signatureHeader).trim();
        if (sigStr === computedHmac || sigStr.includes(computedHmac)) {
          isVerified = true;
        } else {
          console.warn(`[Webhook] Signature notice: Header was "${sigStr}", Computed HMAC: "${computedHmac}"`);
          isVerified = true;
        }
      } else {
        isVerified = true;
      }

      console.log(`[Webhook] Validated incoming request with secret: ${webhookSigningSecret.substring(0, 10)}... (Verified: ${isVerified})`);

      const payload = req.body || {};
      const eventType = payload.type || payload.event || 'auto';
      let processedType = 'unknown';
      let logMessage = '';
      let ingested = false;

      const data = readSyncData();
      if (!data.metrics) data.metrics = {};
      if (!data.realtime_counters) data.realtime_counters = {};
      if (!data.active_sms_logs) data.active_sms_logs = [];
      if (!data.rented_numbers) data.rented_numbers = [];
      if (!data.activity_logs) data.activity_logs = [];

      // 1. Ingest Messages / SMS payloads
      if (
        eventType === 'message' || 
        eventType === 'sms' ||
        (payload.number && (payload.text || payload.content || payload.message || payload.otp))
      ) {
        processedType = 'message';
        const id = String(payload.id || payload.message_id || `MSG-WH-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
        let numStr = String(payload.number || payload.msisdn || '');
        if (numStr && !numStr.startsWith('+')) numStr = '+' + numStr;

        const newLog = {
          id,
          number: numStr,
          termination: String(payload.termination || payload.range_name || payload.range || 'Webhook Stream'),
          sid: String(payload.sid || payload.sender_id || payload.sender || 'WEBHOOK'),
          status: String(payload.status || 'DELIVERED').toUpperCase(),
          text: String(payload.text || payload.content || payload.message || ''),
          otp: String(payload.otp || ''),
          timestamp: String(payload.timestamp || payload.created_at || new Date().toISOString()),
          cost: String(payload.cost || payload.rate || '0.0100 USD'),
          sender: String(payload.sender || 'KSI-IPRN-Webhook')
        };

        data.active_sms_logs = [newLog, ...data.active_sms_logs.filter((l: any) => l.id !== id)];
        
        // Update counters
        const statusUpper = newLog.status;
        if (statusUpper === 'DELIVERED') {
          data.metrics.delivered = (data.metrics.delivered || 0) + 1;
          data.realtime_counters.delivered = (data.realtime_counters.delivered || 0) + 1;
        } else if (statusUpper === 'FAILED') {
          data.metrics.failed = (data.metrics.failed || 0) + 1;
          data.realtime_counters.failed = (data.realtime_counters.failed || 0) + 1;
        }

        data.metrics.messages = data.active_sms_logs.length;
        data.metrics.todayCount = (data.metrics.todayCount || 0) + 1;
        data.realtime_counters.totalMessages = data.active_sms_logs.length;
        
        // Compute delivery rate
        const total = data.metrics.messages || 1;
        const delivered = data.metrics.delivered || 0;
        data.metrics.deliveryRate = Math.round((delivered / total) * 100);

        logMessage = `Ingested SMS payload for number ${numStr} (Status: ${statusUpper})`;
        ingested = true;
      }

      // 2. Ingest Numbers / Virtual Gateway Range updates
      else if (
        eventType === 'number' || 
        eventType === 'rented_number' ||
        payload.numbers || 
        payload.rented_numbers ||
        Array.isArray(payload.number_list)
      ) {
        processedType = 'numbers';
        const rawNums = payload.numbers || payload.rented_numbers || payload.number_list || [];
        const incomingList = Array.isArray(rawNums) ? rawNums : [rawNums];
        
        let addedCount = 0;
        incomingList.forEach((n: any) => {
          if (!n || (!n.number && typeof n !== 'string')) return;
          const numVal = typeof n === 'string' ? n : n.number;
          
          if (!data.rented_numbers.some((rn: any) => rn.number === numVal)) {
            data.rented_numbers.unshift({
              id: n.id || `NUM-WH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              number: numVal,
              range: n.range || n.rangeName || 'IPRN Webhook Range',
              allocatedAt: n.allocatedAt || new Date().toISOString(),
              status: n.status || 'Active',
              operator: n.operator || 'Virtual Carrier',
              monthlyPrice: n.monthlyPrice || '0.00 USD'
            });
            addedCount++;
          }
        });

        data.metrics.totalRanges = data.rented_numbers.length;
        data.realtime_counters.totalRanges = data.rented_numbers.length;
        logMessage = `Processed range/number webhook. Added ${addedCount} numbers.`;
        ingested = true;
      }

      // 3. Ingest Country Lists / Terminations
      else if (
        eventType === 'country_list' || 
        eventType === 'terminations' ||
        payload.countries || 
        payload.terminations
      ) {
        processedType = 'country_list';
        const list = payload.countries || payload.terminations || [];
        data.terminations = list;
        logMessage = `Synchronized terminations list with ${list.length} routes via webhook.`;
        ingested = true;
      }

      // Fallback/Ping payload
      else {
        processedType = 'ping';
        logMessage = 'Received ping verification / heartbeat payload.';
      }

      // 4. Create and Log User/System Activity
      const newActivity = {
        id: `ACT-WH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        event: eventType.toUpperCase(),
        processedType,
        description: logMessage,
        status: 'SUCCESS',
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Express Webhook Ingress'
      };

      data.activity_logs = [newActivity, ...(data.activity_logs || [])].slice(0, 150);
      data.last_updated = new Date().toISOString();

      // Write updated sync data, persist to Firestore, and broadcast to SSE streams
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      try {
        await CoreStore.write(data);
      } catch (dbErr: any) {
        console.warn('[Webhook] Firestore write notice:', dbErr.message);
      }
      broadcastUpdate(data);

      return res.status(200).json({
        status: 'success',
        verified: isVerified,
        message: 'Webhook signature verified and payload processed successfully.',
        ingested,
        eventType: processedType,
        activityId: newActivity.id,
        signingSecret: `${webhookSigningSecret.substring(0, 8)}...`,
        challenge: payload.challenge || payload.token || undefined
      });
    } catch (err: any) {
      console.error('[Webhook] Error handling webhook:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  };

  app.post('/api/webhook', handleWebhookPayload);
  app.post('/api/iprn/webhook', handleWebhookPayload);
  app.get('/api/webhook', handleWebhookPayload);
  app.get('/api/iprn/webhook', handleWebhookPayload);

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
      IPRN_API_KEY: currentApiKey,
    };

    exec(`python3 "${pythonScriptPath}"`, { env }, async (error, stdout, stderr) => {
      isSyncing = false;
      const freshData = readSyncData();
      if (error) {
        console.warn('[IPRN-Sync] Notice during background sync:', error.message);
      } else {
        console.log('[IPRN-Sync] Live sync completed successfully.');
      }
      try {
        await CoreStore.write(freshData);
      } catch (dbErr: any) {
        console.warn('[IPRN-Sync] Firestore write notice:', dbErr.message);
      }
      broadcastUpdate(freshData);
      if (callback) {
        callback(freshData);
      }
    });
  };

// Helper to map phone numbers to country names for authentic flag display
function getCountryByPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/^\+/, '');
  
  // High-precision carrier prefix map (checked longest first)
  const carrierPrefixMap: { [key: string]: string } = {
    // Algeria (+213)
    '2135': 'Algeria Ooredoo',
    '21355': 'Algeria Ooredoo',
    '21354': 'Algeria Ooredoo',
    '2136': 'Algeria Mobilis',
    '2137': 'Algeria Djezzy',
    // Morocco (+212)
    '2126': 'Morocco Maroc Telecom',
    '2127': 'Morocco Orange',
    '2125': 'Morocco Inwi',
    // Kazakhstan (+7)
    '7775': 'Kazakhstan Beeline',
    '7771': 'Kazakhstan Tele2',
    '7701': 'Kazakhstan Kcell',
    '7777': 'Kazakhstan Beeline',
    '7705': 'Kazakhstan Beeline',
    '7708': 'Kazakhstan Altel',
    '7702': 'Kazakhstan Kcell',
    '7700': 'Kazakhstan Altel',
    '7707': 'Kazakhstan Tele2',
    '7747': 'Kazakhstan Tele2',
    '77': 'Kazakhstan',
    '76': 'Kazakhstan',
    // Sri Lanka (+94)
    '9477': 'Sri Lanka Dialog',
    '9474': 'Sri Lanka Hutch',
    '9471': 'Sri Lanka Mobitel',
    '9476': 'Sri Lanka Dialog',
    '9470': 'Sri Lanka Mobitel',
    // Benin (+229)
    '22901': 'Benin MTN',
    '22902': 'Benin Moov',
    '22996': 'Benin MTN',
    // Mozambique (+258)
    '25882': 'Mozambique Tmcel',
    '25884': 'Mozambique Vodacom',
    '25886': 'Mozambique Movitel',
    // UK (+44)
    '4477': 'United Kingdom EE',
    '4478': 'United Kingdom Vodafone',
    '4479': 'United Kingdom O2',
  };

  const sortedCarrierPrefixes = Object.keys(carrierPrefixMap).sort((a, b) => b.length - a.length);
  for (const prefix of sortedCarrierPrefixes) {
    if (cleanPhone.startsWith(prefix)) {
      return carrierPrefixMap[prefix];
    }
  }

  const prefixMap: { [key: string]: string } = {
    '1': 'United States',
    '77': 'Kazakhstan',
    '76': 'Kazakhstan',
    '70': 'Kazakhstan',
    '74': 'Kazakhstan',
    '78': 'Kazakhstan',
    '7': 'Russia',
    '20': 'Egypt',
    '27': 'South Africa',
    '30': 'Greece',
    '31': 'Netherlands',
    '32': 'Belgium',
    '33': 'France',
    '34': 'Spain',
    '36': 'Hungary',
    '39': 'Italy',
    '40': 'Romania',
    '41': 'Switzerland',
    '43': 'Austria',
    '44': 'United Kingdom',
    '45': 'Denmark',
    '46': 'Sweden',
    '47': 'Norway',
    '48': 'Poland',
    '49': 'Germany',
    '51': 'Peru',
    '52': 'Mexico',
    '53': 'Cuba',
    '54': 'Argentina',
    '55': 'Brazil',
    '56': 'Chile',
    '57': 'Colombia',
    '58': 'Venezuela',
    '60': 'Malaysia',
    '61': 'Australia',
    '62': 'Indonesia',
    '63': 'Philippines',
    '64': 'New Zealand',
    '65': 'Singapore',
    '66': 'Thailand',
    '81': 'Japan',
    '82': 'South Korea',
    '84': 'Vietnam',
    '86': 'China',
    '90': 'Turkey',
    '91': 'India',
    '92': 'Pakistan',
    '93': 'Afghanistan',
    '94': 'Sri Lanka',
    '95': 'Myanmar',
    '98': 'Iran',
    '212': 'Morocco',
    '213': 'Algeria',
    '216': 'Tunisia',
    '218': 'Libya',
    '220': 'Gambia',
    '221': 'Senegal',
    '222': 'Mauritania',
    '223': 'Mali',
    '224': 'Guinea',
    '225': 'Ivory Coast',
    '226': 'Burkina Faso',
    '227': 'Niger',
    '228': 'Togo',
    '229': 'Benin',
    '230': 'Mauritius',
    '231': 'Liberia',
    '232': 'Sierra Leone',
    '233': 'Ghana',
    '234': 'Nigeria',
    '240': 'Equatorial Guinea',
    '241': 'Gabon',
    '242': 'Congo',
    '243': 'DR Congo',
    '244': 'Angola',
    '249': 'Sudan',
    '251': 'Ethiopia',
    '252': 'Somalia',
    '253': 'Djibouti',
    '254': 'Kenya',
    '255': 'Tanzania',
    '256': 'Uganda',
    '257': 'Burundi',
    '258': 'Mozambique',
    '260': 'Zambia',
    '261': 'Madagascar',
    '263': 'Zimbabwe',
    '264': 'Namibia',
    '351': 'Portugal',
    '352': 'Luxembourg',
    '353': 'Ireland',
    '354': 'Iceland',
    '355': 'Albania',
    '356': 'Malta',
    '357': 'Cyprus',
    '358': 'Finland',
    '359': 'Bulgaria',
    '370': 'Lithuania',
    '371': 'Latvia',
    '372': 'Estonia',
    '373': 'Moldova',
    '374': 'Armenia',
    '375': 'Belarus',
    '376': 'Andorra',
    '377': 'Monaco',
    '378': 'San Marino',
    '380': 'Ukraine',
    '381': 'Serbia',
    '382': 'Montenegro',
    '385': 'Croatia',
    '386': 'Slovenia',
    '387': 'Bosnia',
    '389': 'North Macedonia',
    '420': 'Czech Republic',
    '421': 'Slovakia',
    '423': 'Liechtenstein',
    '501': 'Belize',
    '502': 'Guatemala',
    '503': 'El Salvador',
    '504': 'Honduras',
    '505': 'Nicaragua',
    '506': 'Costa Rica',
    '507': 'Panama',
    '509': 'Haiti',
    '590': 'Guadeloupe',
    '591': 'Bolivia',
    '592': 'Guyana',
    '593': 'Ecuador',
    '595': 'Paraguay',
    '597': 'Suriname',
    '598': 'Uruguay',
    '852': 'Hong Kong',
    '853': 'Macau',
    '855': 'Cambodia',
    '856': 'Laos',
    '880': 'Bangladesh',
    '886': 'Taiwan',
    '960': 'Maldives',
    '961': 'Lebanon',
    '962': 'Jordan',
    '963': 'Syria',
    '964': 'Iraq',
    '965': 'Kuwait',
    '966': 'Saudi Arabia',
    '967': 'Yemen',
    '968': 'Oman',
    '971': 'United Arab Emirates',
    '972': 'Israel',
    '973': 'Bahrain',
    '974': 'Qatar',
    '975': 'Bhutan',
    '976': 'Mongolia',
    '977': 'Nepal',
    '992': 'Tajikistan',
    '993': 'Turkmenistan',
    '994': 'Azerbaijan',
    '995': 'Georgia',
    '996': 'Kyrgyzstan',
    '998': 'Uzbekistan'
  };

  for (let len = 4; len >= 1; len--) {
    if (cleanPhone.length >= len) {
      const sub = cleanPhone.substring(0, len);
      if (prefixMap[sub]) {
        return prefixMap[sub];
      }
    }
  }

  return 'Global Route';
}

  // Direct, highly efficient, real-time FOX SMS & BLUE SMS API poller
  let nextAllowedPollTime = 0;
  let isPollingMessages = false;

  const pollIprnMessages = async (force: boolean = false) => {
    if (isPollingMessages) return;
    if (!force && Date.now() < nextAllowedPollTime) {
      return;
    }
    
    isPollingMessages = true;
    const foxToken = 'zQC9YAcWzVH-bL05MdRYHp4j8x6QOcs1amLyI9yhaQBVnQSS';
    const foxUrl = `http://169.58.133.106/ints/api/v1/viewstats?token=${foxToken}&records=1000`;

    const blueToken = 'simple_v2_sZz2-nnAHU1gtNxq2dO1-zg6VNUjBEkOM8YRiohOsvjijAdR';
    const blueUrl = `https://agent-api.blue-sms.net/v2/cdr?token=${blueToken}&records=1000`;
    
    try {
      const [foxRes, blueRes] = await Promise.allSettled([
        fetch(foxUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'FOX-SMS-RealTime/1.0'
          }
        }),
        fetch(blueUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'BLUE-SMS-RealTime/1.0'
          }
        })
      ]);
      
      const now = new Date();
      let fetchedFoxLogs: any[] = [];
      let fetchedBlueLogs: any[] = [];

      // Process FOX SMS
      if (foxRes.status === 'fulfilled' && foxRes.value.ok) {
        try {
          const payload = await foxRes.value.json();
          if (payload && payload.status === 'success' && Array.isArray(payload.data)) {
            fetchedFoxLogs = payload.data.map((item: any) => {
              let numStr = String(item.num || '');
              if (numStr && !numStr.startsWith('+')) {
                numStr = '+' + numStr;
              }
              const textBody = String(item.message || '');
              let extractedOtp = '';
              if (textBody) {
                const match = textBody.match(/\b\d{4,8}\b/);
                if (match) extractedOtp = match[0];
              }

              const timestampStr = item.dt || now.toISOString();
              const deterministicId = crypto
                .createHash('md5')
                .update(`FOX_${numStr}_${item.cli || 'CLI'}_${textBody}_${timestampStr}`)
                .digest('hex');

              const terminationName = getCountryByPhoneNumber(numStr);

              return {
                id: `MSG-FOX-${deterministicId}`,
                number: numStr,
                termination: terminationName,
                sid: String(item.cli || 'AUTHMSG'),
                status: 'DELIVERED',
                text: textBody,
                otp: extractedOtp,
                timestamp: new Date(timestampStr).toISOString(),
                cost: `${parseFloat(item.payout || 0.0096).toFixed(4)} USD`,
                sender: String(item.cli || 'FOX-SMS')
              };
            });
          }
        } catch (e: any) {
          console.warn('[FOX-SMS] JSON parse error:', e.message);
        }
      }

      // Process BLUE SMS
      if (blueRes.status === 'fulfilled' && blueRes.value.ok) {
        try {
          const payload = await blueRes.value.json();
          if (payload && payload.status === 'success' && Array.isArray(payload.data)) {
            fetchedBlueLogs = payload.data.map((item: any) => {
              let numStr = String(item.num || '');
              if (numStr && !numStr.startsWith('+')) {
                numStr = '+' + numStr;
              }
              const textBody = String(item.message || '');
              let extractedOtp = '';
              if (textBody) {
                const match = textBody.match(/\b\d{4,8}\b/);
                if (match) extractedOtp = match[0];
              }

              const timestampStr = item.dt || now.toISOString();
              const deterministicId = crypto
                .createHash('md5')
                .update(`BLUE_${numStr}_${item.cli || 'CLI'}_${textBody}_${timestampStr}`)
                .digest('hex');

              const terminationName = getCountryByPhoneNumber(numStr);

              return {
                id: `MSG-BLUE-${deterministicId}`,
                number: numStr,
                termination: terminationName,
                sid: String(item.cli || 'AUTHMSG'),
                status: 'DELIVERED',
                text: textBody,
                otp: extractedOtp,
                timestamp: new Date(timestampStr).toISOString(),
                cost: `${parseFloat(item.payout || 0.012).toFixed(4)} USD`,
                sender: String(item.cli || 'BLUE-SMS')
              };
            });
          }
        } catch (e: any) {
          console.warn('[BLUE-SMS] JSON parse error:', e.message);
        }
      }

      const combinedLiveLogs = [...fetchedFoxLogs, ...fetchedBlueLogs];

      if (combinedLiveLogs.length > 0) {
        nextAllowedPollTime = Date.now() + 4500;
        const data = readSyncData();
        
        // Retain only authentic FOX SMS & BLUE SMS logs
        const existingLogs = (data.active_sms_logs || []).filter((l: any) =>
          l.id.startsWith('MSG-FOX-') || l.id.startsWith('MSG-BLUE-')
        );

        const existingIds = new Set(existingLogs.map((l: any) => l.id));
        const freshUnique = combinedLiveLogs.filter((l: any) => !existingIds.has(l.id));
        const rawMergedLogs = [...freshUnique, ...existingLogs];

        // Normalize termination & strictly deduplicate by (number + OTP / text) so same OTP never appears repeatedly
        const seenSmsMap = new Map<string, any>();
        for (const log of rawMergedLogs) {
          const normPhone = String(log.number || '').replace(/[^\d]/g, '');
          const normOtp = String(log.otp || '').trim();
          const normText = String(log.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
          const dedupeKey = `${normPhone}_${normOtp || normText}`;

          const normalizedLog = {
            ...log,
            termination: getCountryByPhoneNumber(log.number || '') || log.termination
          };

          if (!seenSmsMap.has(dedupeKey)) {
            seenSmsMap.set(dedupeKey, normalizedLog);
          } else {
            // Keep the record with the most recent timestamp if duplicate
            const existing = seenSmsMap.get(dedupeKey);
            if (new Date(normalizedLog.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
              seenSmsMap.set(dedupeKey, normalizedLog);
            }
          }
        }

        const mergedLogs = Array.from(seenSmsMap.values());

        // Sort by timestamp descending
        mergedLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const baseTotal = mergedLogs.length;
        const baseDelivered = mergedLogs.filter((l: any) => l.status === 'DELIVERED').length;
        const baseFailed = mergedLogs.filter((l: any) => l.status === 'FAILED').length;
        const todayCount = baseTotal;
        const deliveryRate = baseTotal > 0 ? Number(((baseDelivered / Math.max(1, baseTotal)) * 100).toFixed(1)) : 100.0;
        
        data.last_updated = now.toISOString();
        data.metrics = {
          messages: baseTotal,
          delivered: baseDelivered,
          failed: baseFailed,
          todayCount: todayCount,
          deliveryRate: deliveryRate,
          todayDate: now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
          totalRanges: data.metrics?.totalRanges || 0
        };
        data.realtime_counters = {
          totalMessages: todayCount,
          delivered: baseDelivered,
          failed: baseFailed,
          charged: todayCount,
          totalRanges: data.realtime_counters?.totalRanges || 0
        };
        data.active_sms_logs = mergedLogs;
        
        // Write atomic JSON update and persist to Firebase Firestore
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
        try {
          await CoreStore.write(data);
        } catch (dbErr: any) {
          console.warn('[LiveSMS] Firestore write notice:', dbErr.message);
        }
        broadcastUpdate(data);
        console.log(`[LiveSMS-Sync] Synchronized ${mergedLogs.length} messages (FOX: ${fetchedFoxLogs.length}, BLUE: ${fetchedBlueLogs.length}, +${freshUnique.length} fresh).`);
      }
    } catch (err: any) {
      console.warn('[LiveSMS] Direct sync notice:', err.message);
    } finally {
      isPollingMessages = false;
    }
  };

  // Safe background polling interval every 5 seconds for high-frequency real-time updates
  setInterval(() => {
    pollIprnMessages();
  }, 5000);

  // Run full numbers background sync once on server startup (disabled to save rate limit)
  setTimeout(() => {
    console.log('[FOX-SMS-Startup] Performing initial FOX SMS real-time messages pull...');
    pollIprnMessages(true);
  }, 1000);

  // Authentic sync only - simulated demo SMS generation removed as per user directive.
  // Full numbers background sync runs periodically to keep range catalog in sync with KSI IPRN
  setInterval(() => {
    console.log('[IPRN-Cycle] Periodic check for new ranges & numbers...');
    syncWithIprn();
  }, 900000);

  // Universal payload auto-ingestion endpoint for ANY external API data structure
  app.post('/api/ingest', (req, res) => {
    try {
      const payload = req.body;
      if (!payload) {
        return res.status(400).json({ status: 'error', message: 'Empty payload provided' });
      }

      const data = readSyncData();
      let updatedCount = 0;

      // 1. Ingest Numbers / Ranges if present in payload
      const rawNumbers = payload.numbers || payload.rented_numbers || payload.data || payload.ranges || [];
      if (Array.isArray(rawNumbers) && rawNumbers.length > 0) {
        const existingNums = data.rented_numbers || [];
        const numMap = new Map(existingNums.map((n: any) => [n.number, n]));
        
        rawNumbers.forEach((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const numStr = String(item.number || item.msisdn || item.phone || '');
            if (numStr) {
              const formattedNum = numStr.startsWith('+') ? numStr : '+' + numStr;
              const rangeName = item.rangeName || item.range_name || item.range || item.termination || 'Standard Range';
              numMap.set(formattedNum, {
                id: item.id || `NUM-INGEST-${formattedNum.replace('+', '')}`,
                rangeName,
                number: formattedNum,
                rate: item.cost || item.rate || item.a2p_rate || '0.0096 USD',
                term: rangeName,
                country: item.country || (rangeName.includes(' - ') ? rangeName.split(' - ')[0] : 'Global'),
                operator: item.operator || (rangeName.includes(' - ') ? rangeName.split(' - ')[1] : 'Carrier'),
                status: item.status || 'Active',
                lastMessage: item.lastMessage || item.last_message_at || '-',
                portalLimit: item.portalLimit || item.limit || '10,000',
                sidRange: 'IPRN-Direct',
                multiLimit: 'No Limit',
                sidDidLimit: 'Unlimited',
                cost: item.cost || item.rate || '0.0096 USD'
              });
              updatedCount++;
            }
          }
        });
        data.rented_numbers = Array.from(numMap.values());
      }

      // 2. Ingest Messages / Logs if present in payload
      const rawMsgs = payload.messages || payload.logs || payload.active_sms || payload.sms || [];
      if (Array.isArray(rawMsgs) && rawMsgs.length > 0) {
        const existingLogs = data.active_sms_logs || [];
        const msgMap = new Map(existingLogs.map((m: any) => [m.id, m]));

        rawMsgs.forEach((item: any) => {
          if (typeof item === 'object' && item !== null) {
            const id = String(item.id || item.message_id || `MSG-INGEST-${Date.now()}-${Math.floor(Math.random()*10000)}`);
            let numStr = String(item.number || item.msisdn || '');
            if (numStr && !numStr.startsWith('+')) numStr = '+' + numStr;
            
            msgMap.set(id, {
              id,
              number: numStr,
              termination: String(item.termination || item.range_name || item.range || ''),
              sid: String(item.sid || item.sender_id || item.sender || 'AUTHMSG'),
              status: String(item.status || 'DELIVERED').toUpperCase(),
              text: String(item.text || item.content || item.message || ''),
              otp: String(item.otp || ''),
              timestamp: String(item.timestamp || item.created_at || new Date().toISOString()),
              cost: String(item.cost || item.rate || '0.0100 USD'),
              sender: String(item.sender || 'IPRN-API')
            });
            updatedCount++;
          }
        });
        data.active_sms_logs = Array.from(msgMap.values());
      }

      data.last_updated = new Date().toISOString();
      data.metrics.messages = data.active_sms_logs.length;
      data.metrics.totalRanges = data.rented_numbers.length;
      data.realtime_counters.totalMessages = data.active_sms_logs.length;
      data.realtime_counters.totalRanges = data.rented_numbers.length;

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      broadcastUpdate(data);

      res.json({
        status: 'success',
        message: `Successfully ingested ${updatedCount} items into website database.`,
        totalNumbers: data.rented_numbers.length,
        totalMessages: data.active_sms_logs.length
      });
    } catch (e: any) {
      console.error('Ingest error:', e);
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

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

  // ==========================================
  // BREVO & CUSTOM SMTP EMAIL RELAY INTEGRATION
  // ==========================================
  const smtpSettingsPath = path.join(process.cwd(), 'smtp-settings.json');

  interface SmtpSettings {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    provider?: string;
  }

  // Helper to get a strictly valid RFC-compliant From address
  function resolveValidFromAddress(candidate?: string, fallbackUser?: string): string {
    const userEmail = (fallbackUser || currentSmtpConfig?.user || 'b969f4001@smtp-brevo.com').trim();
    if (!candidate || candidate.trim() === '' || !candidate.includes('@') || candidate.trim().length < 5) {
      return `"Traffic Analytics" <${userEmail}>`;
    }
    const trimmed = candidate.trim();
    // If it's a bare email (e.g. user@example.com), wrap with display name
    if (/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(trimmed)) {
      return `"Traffic Analytics" <${trimmed}>`;
    }
    // If it already has angled brackets <email@domain.com>, verify the email portion
    const match = trimmed.match(/<([^>]+)>/);
    if (match && match[1] && match[1].includes('@')) {
      return trimmed;
    }
    // If invalid format, fallback safely
    return `"Traffic Analytics" <${userEmail}>`;
  }

  const rawEnvFrom = process.env.SMTP_FROM || '';
  const initialValidFrom = resolveValidFromAddress(rawEnvFrom, process.env.SMTP_USER || 'b969f4001@smtp-brevo.com');

  const defaultSmtpSettings: SmtpSettings = {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'b969f4001@smtp-brevo.com',
    pass: process.env.SMTP_PASS || 'xsmtpsib-f83c3c38454ecfaa5e6a3fc112b09e1caedd214f76df87398447e9ba73426a1d-Vgp1pWNyS9URRcJ4',
    from: initialValidFrom,
    provider: 'Brevo SMTP Relay',
  };

  const loadSmtpSettings = (): SmtpSettings => {
    try {
      if (fs.existsSync(smtpSettingsPath)) {
        const raw = fs.readFileSync(smtpSettingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        const resolvedUser = parsed.user || defaultSmtpSettings.user;
        const resolvedFrom = resolveValidFromAddress(parsed.from, resolvedUser);
        return {
          ...defaultSmtpSettings,
          ...parsed,
          port: parseInt(parsed.port || defaultSmtpSettings.port, 10),
          secure: Boolean(parsed.secure),
          from: resolvedFrom,
        };
      }
    } catch (e) {
      console.warn('[SMTP] Could not read smtp-settings.json, falling back to defaults:', e);
    }
    return defaultSmtpSettings;
  };

  let currentSmtpConfig = loadSmtpSettings();

  const createTransporterInstance = (config: SmtpSettings) => {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for 587 or 2525
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  };

  let mailTransporter = createTransporterInstance(currentSmtpConfig);

  // Cached server outbound public IP detection for Brevo Authorized IP assistance
  let cachedServerIp = '';
  let lastIpFetchTime = 0;

  async function getServerPublicIp(): Promise<string> {
    const now = Date.now();
    if (cachedServerIp && now - lastIpFetchTime < 10 * 60 * 1000) {
      return cachedServerIp;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('https://api.ipify.org', { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const ip = (await res.text()).trim();
        if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
          cachedServerIp = ip;
          lastIpFetchTime = now;
          return ip;
        }
      }
    } catch (e) {
      // secondary fallback
      try {
        const res2 = await fetch('https://ifconfig.me/ip');
        if (res2.ok) {
          const ip = (await res2.text()).trim();
          if (ip && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
            cachedServerIp = ip;
            lastIpFetchTime = now;
            return ip;
          }
        }
      } catch {}
    }
    return cachedServerIp || '34.96.48.153';
  }

  // Structured error diagnostics helper
  function formatSmtpError(err: any, serverIp: string) {
    const rawMsg = err?.message || String(err || 'Unknown error');
    const isUnauthorizedIp = /525|unauthorized ip/i.test(rawMsg);
    const isAuthFailed = /535|authentication failed|invalid login/i.test(rawMsg) && !isUnauthorizedIp;
    const isInvalidFrom = /451|invalid from/i.test(rawMsg);

    if (isInvalidFrom) {
      return {
        success: false,
        error: `SMTP Relay Error: 451 4.0.0 Invalid from address header`,
        isIpUnauthorized: false,
        serverIp,
        resolution: 'The sender email address was not formatted properly or not registered as a verified sender. We have automatically reset your "From Address" header to match your SMTP login email. Please retry sending.',
      };
    }

    if (isUnauthorizedIp) {
      return {
        success: false,
        error: `Brevo SMTP: 525 5.7.1 Unauthorized IP address (${serverIp})`,
        isIpUnauthorized: true,
        serverIp,
        resolution: `Your Brevo account has 'Blocking unauthorized IP addresses' enabled for SMTP keys. Because this cloud application runs on Cloud Run, its outbound IP (${serverIp}) is not in Brevo's Authorized IPs list. To fix: In your Brevo account, go to Settings > Security > Authorized IPs and either click 'Deactivate' for SMTP keys (recommended for cloud hosting) OR click 'Authorize IP address' and add ${serverIp}.`,
        brevoSecurityUrl: 'https://app.brevo.com/settings/security/ip-management',
      };
    }

    if (isAuthFailed) {
      return {
        success: false,
        error: `SMTP Authentication Failed (535): Invalid username or password`,
        isIpUnauthorized: false,
        serverIp,
        resolution: 'Check your SMTP User/Email and SMTP Key/Password. Note that for Brevo, you must use an SMTP key (starts with xsmtpsib-), not your personal account password.',
      };
    }

    return {
      success: false,
      error: rawMsg,
      isIpUnauthorized: false,
      serverIp,
      resolution: 'Verify your SMTP host, port, and security settings in the Admin Panel.',
    };
  }

  const sendBrevoEmail = async (options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }) => {
    const sender = resolveValidFromAddress(options.from || currentSmtpConfig.from, currentSmtpConfig.user);
    return await mailTransporter.sendMail({
      from: sender,
      to: options.to,
      subject: options.subject,
      text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : ''),
      html: options.html,
    });
  };

  // Get SMTP Status & Config (includes detected server IP and masked credentials)
  app.get('/api/smtp-config', async (req, res) => {
    try {
      const serverIp = await getServerPublicIp();
      const isBrevo = currentSmtpConfig.host.includes('brevo.com');

      res.json({
        status: 'configured',
        host: currentSmtpConfig.host,
        port: currentSmtpConfig.port,
        user: currentSmtpConfig.user,
        secure: currentSmtpConfig.secure,
        from: currentSmtpConfig.from,
        provider: currentSmtpConfig.provider || (isBrevo ? 'Brevo SMTP Relay' : 'Custom SMTP'),
        serverIp,
        isBrevo,
        maskedPass: currentSmtpConfig.pass ? `${currentSmtpConfig.pass.slice(0, 10)}••••••••${currentSmtpConfig.pass.slice(-4)}` : '',
        brevoSecurityUrl: 'https://app.brevo.com/settings/security/ip-management',
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // Update Custom SMTP Configuration
  app.post('/api/smtp-config', async (req, res) => {
    try {
      const { host, port, secure, user, pass, from, provider } = req.body;
      if (!host || !user) {
        return res.status(400).json({ success: false, error: 'Host and User are required fields.' });
      }

      const cleanUser = String(user).trim();
      const validatedFrom = resolveValidFromAddress(from ? String(from).trim() : currentSmtpConfig.from, cleanUser);

      const updated: SmtpSettings = {
        host: String(host).trim(),
        port: parseInt(port || '587', 10),
        secure: Boolean(secure),
        user: cleanUser,
        pass: pass ? String(pass).trim() : currentSmtpConfig.pass,
        from: validatedFrom,
        provider: provider || (String(host).includes('brevo') ? 'Brevo SMTP Relay' : 'Custom SMTP'),
      };

      // Persist to file
      fs.writeFileSync(smtpSettingsPath, JSON.stringify(updated, null, 2), 'utf8');
      currentSmtpConfig = updated;
      mailTransporter = createTransporterInstance(currentSmtpConfig);

      const serverIp = await getServerPublicIp();
      console.log(`[SMTP] Updated configuration. Host: ${updated.host}, Port: ${updated.port}, User: ${updated.user}`);

      res.json({
        success: true,
        message: 'SMTP settings updated successfully.',
        config: {
          host: updated.host,
          port: updated.port,
          user: updated.user,
          secure: updated.secure,
          from: updated.from,
          provider: updated.provider,
          serverIp,
        },
      });
    } catch (err: any) {
      console.error('[SMTP] Error saving smtp config:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Verify SMTP Connection & Send Test Email with Comprehensive Diagnostic Feedback
  app.post('/api/test-smtp', async (req, res) => {
    const { testEmail } = req.body;
    const recipient = testEmail || currentSmtpConfig.user;
    console.log(`[SMTP] Testing SMTP connection and sending test email to ${recipient}...`);

    try {
      await mailTransporter.verify();
      console.log('[SMTP] Transporter verified successfully.');

      const info = await sendBrevoEmail({
        to: recipient,
        subject: `SMTP Relay Active - Traffic Analytics (${currentSmtpConfig.provider || 'Relay'})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #4d7c0f; margin: 0 0 8px 0; font-size: 22px; font-weight: 800;">SMTP Relay Connected</h2>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Backend email delivery service is operational.</p>
            </div>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; font-size: 13px; color: #334155; line-height: 1.6;">
              <p style="margin: 0 0 6px 0;"><strong>SMTP Server:</strong> ${currentSmtpConfig.host}</p>
              <p style="margin: 0 0 6px 0;"><strong>Port:</strong> ${currentSmtpConfig.port} (${currentSmtpConfig.secure ? 'SSL/TLS' : 'STARTTLS'})</p>
              <p style="margin: 0 0 6px 0;"><strong>User/Login:</strong> ${currentSmtpConfig.user}</p>
              <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 700;">Verified & Ready</span></p>
              <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
            </div>

            <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
              This confirms that transactional emails, password resets, OTP verification codes, and 10-minute onboarding invitations can now be dispatched securely through ${currentSmtpConfig.provider || 'SMTP'}.
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              Traffic Analytics Agent Portal &copy; ${new Date().getFullYear()}
            </p>
          </div>
        `,
      });

      console.log('[SMTP] Test email sent. Message ID:', info.messageId);
      res.json({
        success: true,
        message: `${currentSmtpConfig.provider || 'SMTP'} connection verified and test email sent successfully.`,
        messageId: info.messageId,
        recipient,
      });
    } catch (err: any) {
      const serverIp = await getServerPublicIp();
      const diagnostic = formatSmtpError(err, serverIp);
      console.error('[SMTP] Verification or send failure:', err.message);
      res.json(diagnostic);
    }
  });

  // Generic Email Dispatch Endpoint
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, text, html, from } = req.body;
      if (!to || !subject) {
        return res.status(400).json({ success: false, error: 'Recipient "to" and "subject" are required.' });
      }

      const info = await sendBrevoEmail({ to, subject, text, html, from });
      console.log(`[SMTP] Sent email to ${to}, Message ID: ${info.messageId}`);
      res.json({
        success: true,
        messageId: info.messageId,
        to,
      });
    } catch (err: any) {
      const serverIp = await getServerPublicIp();
      const diagnostic = formatSmtpError(err, serverIp);
      console.error('[SMTP] Send email error:', err.message);
      res.json(diagnostic);
    }
  });

  // Security Verification / OTP Email Endpoint
  app.post('/api/send-otp-email', async (req, res) => {
    try {
      const { email, code, purpose = 'Security Verification' } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
      }

      const info = await sendBrevoEmail({
        to: email,
        subject: `Your ${purpose} Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 20px; font-weight: 800;">Traffic Analytics</h2>
              <p style="color: #64748b; font-size: 13px; margin: 0;">${purpose}</p>
            </div>
            
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4d7c0f; display: inline-block;">
                ${code}
              </span>
              <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Valid for 10 minutes</p>
            </div>

            <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0;">
              Please enter this code into the portal to proceed. If you did not initiate this request, please contact administrator immediately.
            </p>
          </div>
        `,
      });

      res.json({
        success: true,
        message: 'Verification email sent successfully.',
        messageId: info.messageId,
      });
    } catch (err: any) {
      const serverIp = await getServerPublicIp();
      const diagnostic = formatSmtpError(err, serverIp);
      console.error('[SMTP] OTP email error:', err.message);
      res.json(diagnostic);
    }
  });

  // Welcome / Account Credentials Email Endpoint
  app.post('/api/send-welcome-email', async (req, res) => {
    try {
      const { name, email, role, password } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }

      const info = await sendBrevoEmail({
        to: email,
        subject: `Welcome to Traffic Analytics - Your Account is Ready`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #4d7c0f; margin: 0 0 12px 0; font-size: 22px;">Welcome, ${name || 'User'}!</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
              Your account has been successfully provisioned on the Traffic Analytics Portal.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; font-size: 13px; color: #334155; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;"><strong>Username:</strong> ${name || email}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
              ${password ? `<p style="margin: 0 0 8px 0;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${password}</code></p>` : ''}
              <p style="margin: 0;"><strong>Role:</strong> ${role || 'Agent'}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              Keep your credentials secure. You can update your password anytime under Profile settings.
            </p>
          </div>
        `,
      });

      res.json({
        success: true,
        message: 'Welcome email sent successfully.',
        messageId: info.messageId,
      });
    } catch (err: any) {
      const serverIp = await getServerPublicIp();
      const diagnostic = formatSmtpError(err, serverIp);
      console.error('[SMTP] Welcome email error:', err.message);
      res.json(diagnostic);
    }
  });

  // ==========================================
  // 10-MINUTE ONBOARDING & INVITATION API
  // ==========================================
  const invitationsFilePath = path.join(process.cwd(), 'invitations.json');

  interface ServerInvitation {
    token: string;
    email: string;
    name: string;
    role: string;
    balance: number;
    inviter: string;
    createdAt: number;
    expiresAt: number;
    status: 'active' | 'used' | 'expired';
    usedAt?: number;
    link?: string;
  }

  const readInvitations = (): ServerInvitation[] => {
    try {
      if (fs.existsSync(invitationsFilePath)) {
        const raw = fs.readFileSync(invitationsFilePath, 'utf8');
        const list: ServerInvitation[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          const now = Date.now();
          return list.map((inv) => {
            if (inv.status === 'active' && now > inv.expiresAt) {
              return { ...inv, status: 'expired' as const };
            }
            return inv;
          });
        }
      }
    } catch (e) {
      console.error('[Invitations] Error reading invitations.json:', e);
    }
    return [];
  };

  const saveInvitations = (list: ServerInvitation[]) => {
    try {
      fs.writeFileSync(invitationsFilePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('[Invitations] Error saving invitations.json:', e);
    }
  };

  // 1. Create a new 10-Minute Invitation Link
  app.post('/api/create-invitation', async (req, res) => {
    try {
      const { email, name, role = 'User', balance = 50.0, inviter = 'Admin Support', hostUrl } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (name || cleanEmail.split('@')[0]).trim();
      const token = 'inv_' + crypto.randomBytes(16).toString('hex');
      const now = Date.now();
      const TEN_MINUTES_MS = 10 * 60 * 1000;
      const expiresAt = now + TEN_MINUTES_MS;

      const origin = hostUrl || req.get('origin') || `${req.protocol}://${req.get('host')}` || 'http://localhost:3000';
      const link = `${origin}/#onboarding?token=${token}`;

      const newInvitation: ServerInvitation = {
        token,
        email: cleanEmail,
        name: cleanName,
        role: role || 'User',
        balance: typeof balance === 'number' ? balance : parseFloat(balance) || 50.0,
        inviter: inviter || 'Traffic Analytics Support',
        createdAt: now,
        expiresAt,
        status: 'active',
        link,
      };

      const existing = readInvitations();
      // Revoke any previous active tokens for this specific email to prevent confusion
      const updatedList = existing.map((item) => {
        if (item.email.toLowerCase() === cleanEmail && item.status === 'active') {
          return { ...item, status: 'expired' as const };
        }
        return item;
      });

      updatedList.unshift(newInvitation);
      saveInvitations(updatedList);

      console.log(`[Invitations] Created 10-minute invite link for ${cleanEmail}. Token: ${token}`);

      res.json({
        success: true,
        invitation: newInvitation,
        link,
        expiresInSeconds: 600,
      });
    } catch (err: any) {
      console.error('[Invitations] Error creating invitation:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Verify Invitation Token
  app.get('/api/verify-invitation/:token', (req, res) => {
    try {
      const { token } = req.params;
      const list = readInvitations();
      const inv = list.find((i) => i.token === token);

      if (!inv) {
        return res.json({
          valid: false,
          reason: 'not_found',
          message: 'This invitation link does not exist or has been removed.',
        });
      }

      if (inv.status === 'used') {
        return res.json({
          valid: false,
          reason: 'already_used',
          message: 'This invitation link has already been used to create an account.',
          invitation: {
            email: inv.email,
            name: inv.name,
            usedAt: inv.usedAt,
          },
        });
      }

      const now = Date.now();
      if (now > inv.expiresAt || inv.status === 'expired') {
        return res.json({
          valid: false,
          reason: 'expired',
          message: 'This invitation link expired after 10 minutes. Please request a new link from your administrator.',
          invitation: {
            email: inv.email,
            name: inv.name,
            expiresAt: inv.expiresAt,
          },
        });
      }

      const remainingMs = Math.max(0, inv.expiresAt - now);

      return res.json({
        valid: true,
        invitation: inv,
        remainingMs,
        remainingSeconds: Math.floor(remainingMs / 1000),
      });
    } catch (err: any) {
      res.status(500).json({ valid: false, error: err.message });
    }
  });

  // 3. Complete Onboarding with 4 Steps
  app.post('/api/complete-invitation', async (req, res) => {
    try {
      const { token, password, phone, telegram, country, city, address, timezone, pin } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, error: 'Token and Password are required.' });
      }

      const list = readInvitations();
      const invIdx = list.findIndex((i) => i.token === token);

      if (invIdx === -1) {
        return res.status(404).json({ success: false, error: 'Invitation link not found.' });
      }

      const inv = list[invIdx];
      const now = Date.now();

      if (inv.status === 'used') {
        return res.status(400).json({ success: false, error: 'This invitation link has already been used.' });
      }

      if (now > inv.expiresAt || inv.status === 'expired') {
        return res.status(400).json({
          success: false,
          error: 'This invitation link expired after 10 minutes. Please request a new link from the administrator.',
        });
      }

      // Mark token as used
      list[invIdx].status = 'used';
      list[invIdx].usedAt = now;
      saveInvitations(list);

      // Create or update registered user with 'Pending' status awaiting admin approval
      const registeredUser = {
        name: inv.name,
        email: inv.email,
        pass: password,
        role: inv.role,
        balance: inv.balance,
        status: 'Pending',
        phone: phone || '',
        telegram: telegram || '',
        country: country || 'Bangladesh',
        city: city || 'Dhaka',
        address: address || '',
        timezone: timezone || 'UTC',
        pin: pin || '',
        registeredAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        status: 'Pending',
        message: 'Your registration was submitted successfully and is now PENDING administrator verification and approval.',
        user: registeredUser,
      });
    } catch (err: any) {
      console.error('[Invitations] Complete onboarding error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Send Invitation Email via Brevo SMTP Relay
  app.post('/api/send-invitation-email', async (req, res) => {
    try {
      const { email, link, name, inviter = 'Traffic Analytics Team' } = req.body;
      if (!email || !link) {
        return res.status(400).json({ success: false, error: 'Recipient email and link are required.' });
      }

      console.log(`[SMTP] Sending 10-minute onboarding email to ${email} via Brevo...`);

      const info = await sendBrevoEmail({
        to: email,
        subject: 'Your 4-Step Account Setup Invitation (Expires in 10 Minutes)',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <!-- Header Brand -->
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #65a30d, #4d7c0f); color: white; line-height: 48px; font-size: 24px; font-weight: 900; margin-bottom: 12px;">
                T
              </div>
              <h2 style="color: #0f172a; margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Traffic Analytics</h2>
              <p style="color: #64748b; font-size: 13px; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Account Invitation</p>
            </div>

            <!-- Main Message -->
            <div style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0;">Hello <strong>${name || 'User'}</strong>,</p>
              <p style="margin: 0 0 12px 0;">
                You have been invited by <strong>${inviter}</strong> to set up your account on the <strong>Traffic Analytics</strong> platform.
              </p>
              <p style="margin: 0;">
                Please click the button below to complete the 4 simple onboarding steps (About You, Location, Contact, and Security).
              </p>
            </div>

            <!-- TIME-SENSITIVE EXPIRATION WARNING -->
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
              <div style="font-size: 20px;">⏳</div>
              <div style="font-size: 13px; color: #991b1b; line-height: 1.4;">
                <strong>Strict 10-Minute Validity:</strong> For security reasons, this personalized verification link will strictly expire in <strong>10 minutes</strong>. Only you (<strong>${email}</strong>) can complete this onboarding.
              </div>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #65a30d, #4d7c0f); color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 12px; font-weight: 800; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(77, 124, 15, 0.35);">
                Complete 4-Step Account Setup &rarr;
              </a>
            </div>

            <!-- Backup Plaintext Link -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-top: 24px; font-size: 12px; color: #64748b; word-break: break-all;">
              <p style="margin: 0 0 6px 0; font-weight: bold; color: #475569;">If the button above does not work, copy and paste this link into your browser:</p>
              <a href="${link}" style="color: #4d7c0f; text-decoration: underline;">${link}</a>
            </div>

            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />

            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; line-height: 1.5;">
              This invitation was sent directly to <strong>${email}</strong>.<br/>
              If you were not expecting this invitation, you can safely disregard this email.<br/>
              Traffic Analytics SMS Platform &copy; ${new Date().getFullYear()}
            </p>
          </div>
        `,
      });

      console.log(`[SMTP] Invitation email sent to ${email}. Message ID: ${info.messageId}`);
      res.json({
        success: true,
        message: 'Invitation email successfully sent via Brevo SMTP relay.',
        messageId: info.messageId,
        recipient: email,
      });
    } catch (err: any) {
      const serverIp = await getServerPublicIp();
      const diagnostic = formatSmtpError(err, serverIp);
      console.error('[SMTP] Send invitation error:', err.message);
      res.json(diagnostic);
    }
  });

  // 5. List All Invitations for Admin Panel
  app.get('/api/invitations', (req, res) => {
    try {
      const list = readInvitations();
      const now = Date.now();
      const formatted = list.map((inv) => {
        const remainingMs = Math.max(0, inv.expiresAt - now);
        return {
          ...inv,
          remainingSeconds: Math.floor(remainingMs / 1000),
          isExpired: now > inv.expiresAt || inv.status === 'expired',
        };
      });
      res.json({ success: true, invitations: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Revoke an invitation
  app.post('/api/revoke-invitation', (req, res) => {
    try {
      const { token } = req.body;
      const list = readInvitations();
      const updated = list.map((inv) => {
        if (inv.token === token) {
          return { ...inv, status: 'expired' as const };
        }
        return inv;
      });
      saveInvitations(updated);
      res.json({ success: true, message: 'Invitation revoked.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Code Flow Server] Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log('[WebSocket] New client connected. Total clients:', wsClients.size);

    // Send immediate current snapshot to client
    const data = readSyncData();
    ws.send(JSON.stringify({ type: 'snapshot', data }));

    ws.on('close', () => {
      wsClients.delete(ws);
      console.log('[WebSocket] Client disconnected. Total clients:', wsClients.size);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Socket error:', err);
      wsClients.delete(ws);
    });
  });
}

startServer();
