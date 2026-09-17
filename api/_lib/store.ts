import fs from 'node:fs';
import path from 'node:path';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseQuotaExhausted, handleFirebaseError } from './firebase.js';

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

/**
 * Highly Optimized, High-Concurrency Thread-Safe CoreStore
 * Leverages in-memory caching and real-time Firestore synchronization.
 */
export class CoreStore {
  private static cache: SyncData | null = null;
  private static lastReadTime = 0;
  private static cacheTTL = 1000; // 1-second hot read cache TTL to handle extreme request spikes
  private static isWriting = false;
  private static hasPendingWrite = false;
  private static pendingData: SyncData | null = null;
  private static jsonBackupPath = path.join(process.cwd(), 'iprn_sync.json');

  private static saveLocalBackup(data: SyncData): void {
    try {
      fs.writeFileSync(this.jsonBackupPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
  }

  private static readLocalBackup(): SyncData | null {
    try {
      if (fs.existsSync(this.jsonBackupPath)) {
        const raw = fs.readFileSync(this.jsonBackupPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return null;
  }

  /**
   * Reads data with a 1-second in-memory caching layer and real-time Firestore database synchronization.
   */
  public static async read(): Promise<SyncData> {
    const now = Date.now();
    
    // Serve from cache if TTL has not expired
    if (this.cache && (now - this.lastReadTime < this.cacheTTL)) {
      return JSON.parse(JSON.stringify(this.cache)); // Return deep clone to prevent accidental reference mutation
    }

    // If quota is exhausted, read from local backup JSON file
    if (isFirebaseQuotaExhausted()) {
      const backup = this.readLocalBackup();
      if (backup) {
        this.cache = backup;
        this.lastReadTime = now;
        return JSON.parse(JSON.stringify(backup));
      }
    }

    try {
      // 1. Fetch global settings
      const settingsRef = doc(db, 'settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      
      const defaultData: SyncData = {
        last_updated: new Date().toISOString(),
        metrics: { messages: 0, delivered: 0, failed: 0, todayCount: 0, deliveryRate: 100, todayDate: "", totalRanges: 0 },
        realtime_counters: { totalMessages: 0, delivered: 0, failed: 0, charged: 0, totalRanges: 0 },
        chart_data: [],
        active_sms_logs: [],
        rented_numbers: [],
        activity_logs: []
      };

      let mergedData: SyncData = { ...defaultData };

      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data() as Partial<SyncData>;
        mergedData = {
          ...mergedData,
          ...settingsData,
          metrics: { ...mergedData.metrics, ...(settingsData.metrics || {}) },
          realtime_counters: { ...mergedData.realtime_counters, ...(settingsData.realtime_counters || {}) },
          active_sms_logs: settingsData.active_sms_logs || [],
          rented_numbers: settingsData.rented_numbers || [],
          activity_logs: settingsData.activity_logs || []
        };
      }

      this.cache = mergedData;
      this.lastReadTime = now;
      this.saveLocalBackup(mergedData);
      return JSON.parse(JSON.stringify(mergedData));
    } catch (error: any) {
      handleFirebaseError(error);

      const backup = this.readLocalBackup();
      if (backup) {
        this.cache = backup;
        this.lastReadTime = now;
        return JSON.parse(JSON.stringify(backup));
      }

      if (this.cache) {
        return JSON.parse(JSON.stringify(this.cache));
      }
      
      // Serve defaults as final fallback
      return {
        last_updated: new Date().toISOString(),
        metrics: { messages: 0, delivered: 0, failed: 0, todayCount: 0, deliveryRate: 100, todayDate: "", totalRanges: 0 },
        realtime_counters: { totalMessages: 0, delivered: 0, failed: 0, charged: 0, totalRanges: 0 },
        chart_data: [],
        active_sms_logs: [],
        rented_numbers: [],
        activity_logs: []
      };
    }
  }

  /**
   * Writes the sync data object atomically to Firestore settings and collections.
   */
  public static async write(data: SyncData): Promise<boolean> {
    // Automatically recompute metrics and dashboard counters before persisting
    this.recomputeStats(data);

    // Force local memory cache update and persist to JSON file engine
    this.cache = JSON.parse(JSON.stringify(data));
    this.lastReadTime = Date.now();
    this.saveLocalBackup(data);

    // If Firestore write quota is exhausted for the project, skip gRPC write to prevent stream errors
    if (isFirebaseQuotaExhausted()) {
      return true;
    }

    // If a write is currently in progress, register this as a single pending write (will run once the active write completes)
    if (this.isWriting) {
      this.pendingData = JSON.parse(JSON.stringify(data));
      this.hasPendingWrite = true;
      return true;
    }

    this.isWriting = true;

    try {
      if (isFirebaseQuotaExhausted()) {
        this.isWriting = false;
        return true;
      }

      data.last_updated = new Date().toISOString();

      // Write atomic settings/global document (1 single efficient write unit)
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, {
        last_updated: data.last_updated,
        iprn_api_key: data.iprn_api_key || '',
        metrics: data.metrics,
        realtime_counters: data.realtime_counters,
        chart_data: data.chart_data || [],
        active_sms_logs: (data.active_sms_logs || []).slice(0, 100),
        rented_numbers: (data.rented_numbers || []).slice(0, 100),
        activity_logs: (data.activity_logs || []).slice(0, 50)
      });

      this.isWriting = false;

      // Execute single queued follow-up write if another update request arrived during the operation
      if (this.hasPendingWrite && this.pendingData) {
        const nextData = this.pendingData;
        this.hasPendingWrite = false;
        this.pendingData = null;
        // Run next write asynchronously
        setTimeout(() => {
          this.write(nextData).catch(() => {});
        }, 50);
      }

      return true;
    } catch (error: any) {
      this.isWriting = false;
      handleFirebaseError(error);

      // Clear pending queue on failure to prevent any repeating loops
      this.hasPendingWrite = false;
      this.pendingData = null;

      return false;
    }
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
    retries = 2,
    delay = 2000
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429) {
          console.warn(`[CoreStore] Rate limited (429) on ${url}. Respecting provider limits and backing off.`);
          return response; // Return response immediately instead of spamming retries
        }
        return response;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        const waitTime = delay * Math.pow(2, i);
        console.warn(`[CoreStore] Connection error (${err.message}). Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('fetchWithRetry failed after maximum attempts');
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

export interface CustomTermination {
  code: string;
  country: string;
  operator: string;
  service: string;
  rangeName: string;
  available: string;
  rate: string;
  limit: string;
  number: string;
  label: string;
  totalNumbers?: number;
  createdAt?: number;
}

export class CustomTermStore {
  /**
   * Saves custom termination range and its phone number pool chunked into Firestore
   */
  public static async save(
    term: Omit<CustomTermination, 'available' | 'label'>,
    numbersPool: string[]
  ): Promise<boolean> {
    if (isFirebaseQuotaExhausted()) {
      return true;
    }

    try {
      const { code } = term;
      const totalNumbers = numbersPool.length;

      // 1. Save metadata to main document
      const termRef = doc(db, 'custom_terminations', code);
      await setDoc(termRef, {
        code,
        country: term.country,
        operator: term.operator,
        service: term.service,
        rangeName: term.rangeName,
        rate: term.rate,
        limit: term.limit,
        number: term.number,
        totalNumbers,
        createdAt: term.createdAt || Date.now()
      });

      // 2. Chunk numbersPool into max 10,000 per document to stay safely below 1MB limit
      const CHUNK_SIZE = 10000;
      const chunks: string[][] = [];
      for (let i = 0; i < numbersPool.length; i += CHUNK_SIZE) {
        chunks.push(numbersPool.slice(i, i + CHUNK_SIZE));
      }

      // 3. Save each chunk to subcollection pool_chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunkRef = doc(db, 'custom_terminations', code, 'pool_chunks', `chunk_${i}`);
        await setDoc(chunkRef, { numbers: chunks[i] });
      }

      // 4. Delete any leftover previous chunks from disk or Firestore if the pool size has decreased
      const startIdx = chunks.length;
      for (let i = startIdx; i < startIdx + 100; i++) {
        try {
          const chunkRef = doc(db, 'custom_terminations', code, 'pool_chunks', `chunk_${i}`);
          await deleteDoc(chunkRef);
        } catch (e) {
          break; // Stop if we hit an error or no more chunks
        }
      }

      return true;
    } catch (e: any) {
      handleFirebaseError(e);
      return false;
    }
  }

  /**
   * Updates only metadata of an existing custom termination
   */
  public static async updateMetadata(
    code: string,
    updates: Partial<Omit<CustomTermination, 'code'>>
  ): Promise<any> {
    if (isFirebaseQuotaExhausted()) {
      return updates;
    }

    try {
      const termRef = doc(db, 'custom_terminations', code);
      const snap = await getDoc(termRef);
      if (!snap.exists()) {
        throw new Error('Termination range not found');
      }

      const current = snap.data();
      const updated = {
        ...current,
        country: updates.country || current.country,
        operator: updates.operator || current.operator,
        service: updates.service || current.service,
        rangeName: updates.rangeName || current.rangeName,
        rate: updates.rate !== undefined ? updates.rate : current.rate,
        limit: updates.limit || current.limit,
        number: updates.number !== undefined ? updates.number : current.number,
      };

      await setDoc(termRef, updated);
      return updated;
    } catch (e: any) {
      handleFirebaseError(e);
      return updates;
    }
  }

  /**
   * Retrieves all custom terminations with computed fields
   */
  public static async getAll(): Promise<CustomTermination[]> {
    try {
      const colRef = collection(db, 'custom_terminations');
      const snap = await getDocs(colRef);
      const list: CustomTermination[] = [];
      
      snap.forEach((d) => {
        const data = d.data();
        if (data && data.code) {
          const total = data.totalNumbers || 0;
          list.push({
            code: data.code,
            country: data.country,
            operator: data.operator,
            service: data.service,
            rangeName: data.rangeName,
            rate: data.rate,
            limit: data.limit,
            number: data.number,
            available: total > 0 ? `${total.toLocaleString()} available` : 'Unlimited available',
            label: `${data.rangeName} (${total > 0 ? total.toLocaleString() + ' file numbers' : 'Unlimited available'})`,
            totalNumbers: total,
            createdAt: data.createdAt || Date.now()
          });
        }
      });

      // Sort by createdAt desc
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.error('[CustomTermStore] Error fetching custom terminations:', e);
      return [];
    }
  }

  /**
   * Fetches full combined pool of numbers for a custom range
   */
  public static async getPool(code: string): Promise<string[]> {
    try {
      const colRef = collection(db, 'custom_terminations', code, 'pool_chunks');
      const snap = await getDocs(colRef);
      let combined: string[] = [];
      
      snap.forEach((d) => {
        const data = d.data();
        if (data && Array.isArray(data.numbers)) {
          combined = combined.concat(data.numbers);
        }
      });
      
      return combined;
    } catch (e) {
      console.error(`[CustomTermStore] Error fetching pool for ${code}:`, e);
      return [];
    }
  }

  /**
   * Deletes custom range and its chunks from Firestore
   */
  public static async delete(code: string): Promise<boolean> {
    try {
      // 1. Delete pool chunks
      const colRef = collection(db, 'custom_terminations', code, 'pool_chunks');
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'custom_terminations', code, 'pool_chunks', d.id));
      }

      // 2. Delete main document
      await deleteDoc(doc(db, 'custom_terminations', code));
      return true;
    } catch (e) {
      console.error(`[CustomTermStore] Error deleting termination ${code}:`, e);
      return false;
    }
  }

  /**
   * Appends numbers to a custom range and saves back
   */
  public static async appendNumbers(code: string, newNumbers: string[]): Promise<number> {
    const termRef = doc(db, 'custom_terminations', code);
    const snap = await getDoc(termRef);
    if (!snap.exists()) {
      throw new Error('Termination range not found');
    }

    const metadata = snap.data();
    const currentPool = await this.getPool(code);
    const poolSet = new Set(currentPool);
    
    newNumbers.forEach((num) => {
      let clean = String(num || '').trim();
      if (clean) {
        if (!clean.startsWith('+')) clean = `+${clean}`;
        poolSet.add(clean);
      }
    });

    const merged = Array.from(poolSet);
    
    await this.save({
      code,
      country: metadata.country || 'Global',
      operator: metadata.operator || 'Carrier',
      service: metadata.service || 'WhatsApp',
      rangeName: metadata.rangeName || code,
      rate: metadata.rate || '0.0000 USD',
      limit: metadata.limit || '10,000',
      number: merged[0] || metadata.number || '',
      createdAt: metadata.createdAt || Date.now()
    }, merged);

    return merged.length;
  }
}

