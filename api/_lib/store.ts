import fs from 'fs';
import path from 'path';

/**
 * Standardized Database Schema & Interfaces for Enterprise SMS Gateway
 */
export interface SmsLog {
  id: string;
  number: string;
  termination: string;
  sid: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING' | string;
  text: string;
  otp: string;
  timestamp: string;
  cost: string;
  sender: string;
}

export interface RentedNumber {
  id: string;
  number: string;
  rangeName?: string;
  range: string;
  allocatedAt: string;
  status: 'Active' | 'Suspended' | string;
  operator: string;
  monthlyPrice: string;
  rate?: string;
  term?: string;
  country?: string;
  cost?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  event: string;
  processedType: string;
  description: string;
  status: 'SUCCESS' | 'FAILED' | string;
  ip: string;
  userAgent: string;
}

export interface SyncData {
  last_updated: string;
  metrics: {
    messages: number;
    delivered: number;
    failed: number;
    todayCount: number;
    deliveryRate: number;
    todayDate: string;
    totalRanges: number;
  };
  realtime_counters: {
    totalMessages: number;
    delivered: number;
    failed: number;
    charged: number;
    totalRanges: number;
  };
  chart_data: any[];
  active_sms_logs: SmsLog[];
  rented_numbers: RentedNumber[];
  activity_logs: ActivityLog[];
  terminations?: any[];
  iprn_api_key?: string;
}

const JSON_FILE_NAME = 'iprn_sync.json';

/**
 * Highly Optimized, High-Concurrency Thread-Safe CoreStore
 * Leverages in-memory caching and non-blocking asynchronous fs.promises operations.
 */
export class CoreStore {
  private static cache: SyncData | null = null;
  private static lastReadTime = 0;
  private static cacheTTL = 1000; // 1-second hot read cache TTL to handle extreme request spikes
  private static writeQueue: Promise<boolean> = Promise.resolve(true); // Sequential queue to prevent race conditions on writes

  private static getPath(): string {
    return path.join(process.cwd(), JSON_FILE_NAME);
  }

  /**
   * Reads data with a 1-second in-memory caching layer and non-blocking async disk fallback.
   */
  public static async read(): Promise<SyncData> {
    const now = Date.now();
    
    // Serve from cache if TTL has not expired
    if (this.cache && (now - this.lastReadTime < this.cacheTTL)) {
      return JSON.parse(JSON.stringify(this.cache)); // Return deep clone to prevent accidental reference mutation
    }

    const filePath = this.getPath();
    const defaultData: SyncData = {
      last_updated: new Date().toISOString(),
      metrics: { messages: 0, delivered: 0, failed: 0, todayCount: 0, deliveryRate: 100, todayDate: "", totalRanges: 0 },
      realtime_counters: { totalMessages: 0, delivered: 0, failed: 0, charged: 0, totalRanges: 0 },
      chart_data: [],
      active_sms_logs: [],
      rented_numbers: [],
      activity_logs: []
    };

    if (!fs.existsSync(filePath)) {
      this.cache = defaultData;
      this.lastReadTime = now;
      return defaultData;
    }

    try {
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      
      const mergedData: SyncData = {
        ...defaultData,
        ...parsed,
        metrics: { ...defaultData.metrics, ...(parsed.metrics || {}) },
        realtime_counters: { ...defaultData.realtime_counters, ...(parsed.realtime_counters || {}) },
        active_sms_logs: parsed.active_sms_logs || [],
        rented_numbers: parsed.rented_numbers || [],
        activity_logs: parsed.activity_logs || []
      };

      this.cache = mergedData;
      this.lastReadTime = now;
      return JSON.parse(JSON.stringify(mergedData));
    } catch (error) {
      console.error('[CoreStore] Non-blocking read failed:', error);
      return defaultData;
    }
  }

  /**
   * Enqueues writes sequentially and executes them atomically.
   */
  public static async write(data: SyncData): Promise<boolean> {
    // Force cache update
    this.cache = JSON.parse(JSON.stringify(data));
    this.lastReadTime = Date.now();

    // Enqueue write to prevent race conditions
    this.writeQueue = this.writeQueue.then(async () => {
      const filePath = this.getPath();
      const tempPath = `${filePath}.tmp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      try {
        data.last_updated = new Date().toISOString();
        const jsonString = JSON.stringify(data, null, 2);
        
        await fs.promises.writeFile(tempPath, jsonString, 'utf8');
        await fs.promises.rename(tempPath, filePath);
        return true;
      } catch (error) {
        console.error('[CoreStore] Atomic async write failed:', error);
        if (fs.existsSync(tempPath)) {
          try { await fs.promises.unlink(tempPath); } catch (_) {}
        }
        return false;
      }
    });

    return this.writeQueue;
  }

  /**
   * Processes an incoming message webhook or sync payload with defensive validation and safe sanitization
   */
  public static processSms(payload: any, data: SyncData): string {
    if (!payload || typeof payload !== 'object') {
      return 'Rejected invalid/empty SMS payload.';
    }

    // Defensive schema parsing and sanitization
    const id = String(payload.id || payload.message_id || payload.msg_id || `MSG-V-${Date.now()}-${Math.floor(Math.random() * 1000)}`).trim();
    
    let rawNum = String(payload.number || payload.msisdn || payload.phone || '').trim();
    if (rawNum && !rawNum.startsWith('+')) {
      rawNum = '+' + rawNum;
    }
    
    // Coerce other attributes into safe defaults to prevent undefined/null UI crashes
    const termination = String(payload.termination || payload.range_name || payload.range || payload.rangeName || 'IPRN Ingress').trim();
    const sid = String(payload.sid || payload.sender_id || payload.sender || 'WEBHOOK').trim();
    
    // Normalize status
    let status = String(payload.status || 'DELIVERED').toUpperCase().trim();
    if (!['DELIVERED', 'FAILED', 'PENDING'].includes(status)) {
      status = 'DELIVERED';
    }

    const text = String(payload.text || payload.content || payload.message || '').trim();
    const otp = String(payload.otp || '').trim();
    const timestamp = String(payload.timestamp || payload.created_at || new Date().toISOString()).trim();
    
    // Parse cost safely to guard against malformed floats
    let costVal = 0.0100;
    try {
      const parsedCost = parseFloat(payload.cost || payload.rate || payload.a2p_rate || '0.0100');
      if (!isNaN(parsedCost)) costVal = parsedCost;
    } catch (_) {}
    const cost = `${costVal.toFixed(4)} USD`;

    const sender = String(payload.sender || payload.sender_id || 'IPRN-Gateway').trim();

    const newLog: SmsLog = {
      id,
      number: rawNum,
      termination,
      sid,
      status,
      text,
      otp,
      timestamp,
      cost,
      sender
    };

    // Filter duplicate and push to head of array
    data.active_sms_logs = [newLog, ...(data.active_sms_logs || []).filter((l) => l && l.id !== id)];
    this.recomputeStats(data);

    return `Ingested SMS payload for number ${rawNum} (Status: ${status})`;
  }

  /**
   * Processes incoming number or rented number payloads with strong type safety checks
   */
  public static processNumbers(payload: any, data: SyncData): string {
    if (!payload) return 'Rejected empty number payload.';

    const rawNums = payload.numbers || payload.rented_numbers || payload.number_list || [];
    const incomingList = Array.isArray(rawNums) ? rawNums : [rawNums];
    
    let addedCount = 0;
    incomingList.forEach((n: any) => {
      if (!n) return;
      
      const numVal = (typeof n === 'string' ? n : String(n.number || n.msisdn || '')).trim();
      if (!numVal) return;

      const formattedNum = numVal.startsWith('+') ? numVal : '+' + numVal;
      const existingIdx = (data.rented_numbers || []).findIndex((rn) => rn && rn.number === formattedNum);
      
      const range = String((typeof n === 'object' ? (n.range || n.rangeName || n.range_name || n.termination) : '') || 'IPRN Webhook Range').trim();
      const allocatedAt = String((typeof n === 'object' ? (n.allocatedAt || n.created_at || n.timestamp) : '') || new Date().toISOString()).trim();
      const status = String((typeof n === 'object' ? (n.status) : '') || 'Active').trim();
      const operator = String((typeof n === 'object' ? (n.operator) : '') || (range.includes(' - ') ? range.split(' - ')[1] : 'Virtual Carrier')).trim();
      
      let priceVal = 0.00;
      try {
        const parsedPrice = parseFloat(typeof n === 'object' ? (n.monthlyPrice || n.price || n.cost || '0.00') : '0.00');
        if (!isNaN(parsedPrice)) priceVal = parsedPrice;
      } catch (_) {}
      const monthlyPrice = `${priceVal.toFixed(2)} USD`;

      const mappedNumber: RentedNumber = {
        id: String((typeof n === 'object' && n.id) ? n.id : `NUM-API-${formattedNum.replace('+', '')}`).trim(),
        number: formattedNum,
        range,
        allocatedAt,
        status,
        operator,
        monthlyPrice,
        // Match frontend extended properties for statistics and list views
        rate: monthlyPrice,
        term: range,
        country: range.includes(' - ') ? range.split(' - ')[0] : 'Global',
        cost: monthlyPrice
      };

      if (!data.rented_numbers) data.rented_numbers = [];

      if (existingIdx !== -1) {
        data.rented_numbers[existingIdx] = { ...data.rented_numbers[existingIdx], ...mappedNumber };
      } else {
        data.rented_numbers.unshift(mappedNumber);
        addedCount++;
      }
    });

    this.recomputeStats(data);
    return `Processed number list updates. Added ${addedCount} brand new active numbers.`;
  }

  /**
   * Helper to append user activity logs securely with limit check
   */
  public static logActivity(
    eventType: string,
    processedType: string,
    description: string,
    req: any,
    data: SyncData
  ): void {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Vercel Ingress Serverless Engine';
    
    const newActivity: ActivityLog = {
      id: `ACT-V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      event: eventType.toUpperCase(),
      processedType,
      description,
      status: 'SUCCESS',
      ip: String(ip),
      userAgent: String(userAgent)
    };

    data.activity_logs = [newActivity, ...data.activity_logs].slice(0, 150);
  }

  /**
   * Extensible and reliable provider API calling with built-in retry logic
   */
  public static async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    delay = 1000
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429) {
          // Rate-limited: wait longer
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * Math.pow(2, i);
          console.warn(`[CoreStore] Rate limited (429) on provider API. Retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        return response;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        const waitTime = delay * Math.pow(2, i);
        console.warn(`[CoreStore] Connection error (${err.message}). Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('Max fetch retries exceeded');
  }

  /**
   * Central math engine to update delivery rates and metrics
   */
  private static recomputeStats(data: SyncData): void {
    const totalMessages = data.active_sms_logs.length;
    const delivered = data.active_sms_logs.filter((l) => l.status === 'DELIVERED').length;
    const failed = totalMessages - delivered;
    const deliveryRate = totalMessages > 0 ? Math.round((delivered / totalMessages) * 100) : 100;
    const totalRanges = data.rented_numbers.length;

    const now = new Date();
    const todayDate = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

    data.metrics = {
      messages: totalMessages,
      delivered,
      failed,
      todayCount: totalMessages,
      deliveryRate,
      todayDate,
      totalRanges
    };

    data.realtime_counters = {
      totalMessages,
      delivered,
      failed,
      charged: totalMessages,
      totalRanges
    };
  }
}
