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
 * Robust Read and Transactional Write Store for iprn_sync.json data
 */
export class CoreStore {
  private static getPath(): string {
    return path.join(process.cwd(), JSON_FILE_NAME);
  }

  /**
   * Reads data with solid structural fallbacks
   */
  public static read(): SyncData {
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
      return defaultData;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...defaultData,
        ...parsed,
        metrics: { ...defaultData.metrics, ...(parsed.metrics || {}) },
        realtime_counters: { ...defaultData.realtime_counters, ...(parsed.realtime_counters || {}) },
        active_sms_logs: parsed.active_sms_logs || [],
        rented_numbers: parsed.rented_numbers || [],
        activity_logs: parsed.activity_logs || []
      };
    } catch (error) {
      console.error('[CoreStore] Failed to read or parse storage file:', error);
      return defaultData;
    }
  }

  /**
   * Writes dataset atomically using a temp file to prevent corrupted partial writes
   */
  public static write(data: SyncData): boolean {
    const filePath = this.getPath();
    const tempPath = `${filePath}.tmp-${Date.now()}`;
    try {
      data.last_updated = new Date().toISOString();
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (error) {
      console.error('[CoreStore] Atomic write failed:', error);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      return false;
    }
  }

  /**
   * Processes an incoming message webhook or sync payload
   */
  public static processSms(payload: any, data: SyncData): string {
    const id = String(payload.id || payload.message_id || `MSG-V-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    let numStr = String(payload.number || payload.msisdn || '');
    if (numStr && !numStr.startsWith('+')) numStr = '+' + numStr;

    const newLog: SmsLog = {
      id,
      number: numStr,
      termination: String(payload.termination || payload.range_name || payload.range || 'IPRN Webhook Ingress'),
      sid: String(payload.sid || payload.sender_id || payload.sender || 'WEBHOOK'),
      status: String(payload.status || 'DELIVERED').toUpperCase(),
      text: String(payload.text || payload.content || payload.message || ''),
      otp: String(payload.otp || ''),
      timestamp: String(payload.timestamp || payload.created_at || new Date().toISOString()),
      cost: `${parseFloat(payload.cost || payload.rate || 0.0100).toFixed(4)} USD`,
      sender: String(payload.sender || payload.sender_id || 'IPRN-Gateway')
    };

    // Filter duplicate and push to head
    data.active_sms_logs = [newLog, ...data.active_sms_logs.filter((l) => l.id !== id)];
    this.recomputeStats(data);

    return `Ingested SMS payload for number ${numStr} (Status: ${newLog.status})`;
  }

  /**
   * Processes incoming number or rented number payloads
   */
  public static processNumbers(payload: any, data: SyncData): string {
    const rawNums = payload.numbers || payload.rented_numbers || payload.number_list || [];
    const incomingList = Array.isArray(rawNums) ? rawNums : [rawNums];
    
    let addedCount = 0;
    incomingList.forEach((n: any) => {
      if (!n || (!n.number && typeof n !== 'string')) return;
      const numVal = typeof n === 'string' ? n : n.number;
      const formattedNum = numVal.startsWith('+') ? numVal : '+' + numVal;
      
      const existingIdx = data.rented_numbers.findIndex((rn) => rn.number === formattedNum);
      const mappedNumber: RentedNumber = {
        id: n.id || `NUM-API-${formattedNum.replace('+', '')}`,
        number: formattedNum,
        range: n.range || n.rangeName || 'IPRN Webhook Range',
        allocatedAt: n.allocatedAt || new Date().toISOString(),
        status: n.status || 'Active',
        operator: n.operator || 'Virtual Carrier',
        monthlyPrice: n.monthlyPrice || '0.00 USD'
      };

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
