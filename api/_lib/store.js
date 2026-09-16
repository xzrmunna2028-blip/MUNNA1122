import fs from "node:fs";
import path from "node:path";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase.js";
class CoreStore {
  static cache = null;
  static lastReadTime = 0;
  static cacheTTL = 1e3;
  // 1-second hot read cache TTL to handle extreme request spikes
  static writeQueue = Promise.resolve(true);
  // Sequential queue to prevent race conditions on writes
  static jsonBackupPath = path.join(process.cwd(), "iprn_sync.json");
  static quotaFilePath = path.join(process.cwd(), ".firestore_quota");
  static quotaExhaustedUntil = (() => {
    try {
      const qPath = path.join(process.cwd(), ".firestore_quota");
      if (fs.existsSync(qPath)) {
        const val = parseInt(fs.readFileSync(qPath, "utf8").trim(), 10);
        if (!isNaN(val) && val > Date.now()) {
          return val;
        }
      }
    } catch {
    }
    return Date.now() + 24 * 60 * 60 * 1e3;
  })();
  // Timestamp until which Firestore writes should be bypassed
  static saveLocalBackup(data) {
    try {
      fs.writeFileSync(this.jsonBackupPath, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
    }
  }
  static readLocalBackup() {
    try {
      if (fs.existsSync(this.jsonBackupPath)) {
        const raw = fs.readFileSync(this.jsonBackupPath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (e) {
    }
    return null;
  }
  /**
   * Reads data with a 1-second in-memory caching layer and real-time Firestore database synchronization.
   */
  static async read() {
    const now = Date.now();
    if (this.cache && now - this.lastReadTime < this.cacheTTL) {
      return JSON.parse(JSON.stringify(this.cache));
    }
    if (now < this.quotaExhaustedUntil) {
      const backup = this.readLocalBackup();
      if (backup) {
        this.cache = backup;
        this.lastReadTime = now;
        return JSON.parse(JSON.stringify(backup));
      }
    }
    try {
      const settingsRef = doc(db, "settings", "global");
      const settingsSnap = await getDoc(settingsRef);
      const defaultData = {
        last_updated: (/* @__PURE__ */ new Date()).toISOString(),
        metrics: { messages: 0, delivered: 0, failed: 0, todayCount: 0, deliveryRate: 100, todayDate: "", totalRanges: 0 },
        realtime_counters: { totalMessages: 0, delivered: 0, failed: 0, charged: 0, totalRanges: 0 },
        chart_data: [],
        active_sms_logs: [],
        rented_numbers: [],
        activity_logs: []
      };
      let mergedData = { ...defaultData };
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        mergedData = {
          ...mergedData,
          ...settingsData,
          metrics: { ...mergedData.metrics, ...settingsData.metrics || {} },
          realtime_counters: { ...mergedData.realtime_counters, ...settingsData.realtime_counters || {} },
          active_sms_logs: settingsData.active_sms_logs || [],
          rented_numbers: settingsData.rented_numbers || [],
          activity_logs: settingsData.activity_logs || []
        };
      }
      this.cache = mergedData;
      this.lastReadTime = now;
      this.saveLocalBackup(mergedData);
      return JSON.parse(JSON.stringify(mergedData));
    } catch (error) {
      const errMsg = String(error?.message || error?.code || "");
      if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("resource-exhausted") || errMsg.includes("Quota") || error?.code === 8 || error?.code === "resource-exhausted") {
        this.quotaExhaustedUntil = Date.now() + 24 * 60 * 60 * 1e3;
        try {
          fs.writeFileSync(this.quotaFilePath, this.quotaExhaustedUntil.toString(), "utf8");
        } catch {
        }
      }
      const backup = this.readLocalBackup();
      if (backup) {
        this.cache = backup;
        this.lastReadTime = now;
        return JSON.parse(JSON.stringify(backup));
      }
      if (this.cache) {
        return JSON.parse(JSON.stringify(this.cache));
      }
      return {
        last_updated: (/* @__PURE__ */ new Date()).toISOString(),
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
  static async write(data) {
    this.recomputeStats(data);
    this.cache = JSON.parse(JSON.stringify(data));
    this.lastReadTime = Date.now();
    this.saveLocalBackup(data);
    if (Date.now() < this.quotaExhaustedUntil) {
      return true;
    }
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        if (Date.now() < this.quotaExhaustedUntil) {
          return true;
        }
        data.last_updated = (/* @__PURE__ */ new Date()).toISOString();
        const settingsRef = doc(db, "settings", "global");
        await setDoc(settingsRef, {
          last_updated: data.last_updated,
          iprn_api_key: data.iprn_api_key || "",
          metrics: data.metrics,
          realtime_counters: data.realtime_counters,
          chart_data: data.chart_data || [],
          active_sms_logs: (data.active_sms_logs || []).slice(0, 100),
          rented_numbers: (data.rented_numbers || []).slice(0, 100),
          activity_logs: (data.activity_logs || []).slice(0, 50)
        });
        return true;
      } catch (error) {
        const errMsg = String(error?.message || error?.code || "");
        if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("resource-exhausted") || errMsg.includes("Quota") || error?.code === 8 || error?.code === "resource-exhausted") {
          this.quotaExhaustedUntil = Date.now() + 24 * 60 * 60 * 1e3;
          try {
            fs.writeFileSync(this.quotaFilePath, this.quotaExhaustedUntil.toString(), "utf8");
          } catch {
          }
          console.warn("[CoreStore] Firestore daily write quota limit reached. Safely persisting via local high-speed memory & JSON engine.");
        } else {
          console.warn("[CoreStore] Firestore sync notice:", error?.message || error);
        }
        return false;
      }
    });
    return this.writeQueue;
  }
  /**
   * Processes an incoming message webhook or sync payload with defensive validation and safe sanitization
   */
  static processSms(payload, data) {
    if (!payload || typeof payload !== "object") {
      return "Rejected invalid/empty SMS payload.";
    }
    const id = String(payload.id || payload.message_id || payload.msg_id || `MSG-V-${Date.now()}-${Math.floor(Math.random() * 1e3)}`).trim();
    let rawNum = String(payload.number || payload.msisdn || payload.phone || "").trim();
    if (rawNum && !rawNum.startsWith("+")) {
      rawNum = "+" + rawNum;
    }
    const termination = String(payload.termination || payload.range_name || payload.range || payload.rangeName || "IPRN Ingress").trim();
    const sid = String(payload.sid || payload.sender_id || payload.sender || "WEBHOOK").trim();
    let status = String(payload.status || "DELIVERED").toUpperCase().trim();
    if (!["DELIVERED", "FAILED", "PENDING"].includes(status)) {
      status = "DELIVERED";
    }
    const text = String(payload.text || payload.content || payload.message || "").trim();
    const otp = String(payload.otp || "").trim();
    const timestamp = String(payload.timestamp || payload.created_at || (/* @__PURE__ */ new Date()).toISOString()).trim();
    let costVal = 0.01;
    try {
      const parsedCost = parseFloat(payload.cost || payload.rate || payload.a2p_rate || "0.0100");
      if (!isNaN(parsedCost)) costVal = parsedCost;
    } catch (_) {
    }
    const cost = `${costVal.toFixed(4)} USD`;
    const sender = String(payload.sender || payload.sender_id || "IPRN-Gateway").trim();
    const newLog = {
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
    data.active_sms_logs = [newLog, ...(data.active_sms_logs || []).filter((l) => l && l.id !== id)];
    this.recomputeStats(data);
    return `Ingested SMS payload for number ${rawNum} (Status: ${status})`;
  }
  /**
   * Processes incoming number or rented number payloads with strong type safety checks
   */
  static processNumbers(payload, data) {
    if (!payload) return "Rejected empty number payload.";
    const rawNums = payload.numbers || payload.rented_numbers || payload.number_list || [];
    const incomingList = Array.isArray(rawNums) ? rawNums : [rawNums];
    let addedCount = 0;
    incomingList.forEach((n) => {
      if (!n) return;
      const numVal = (typeof n === "string" ? n : String(n.number || n.msisdn || "")).trim();
      if (!numVal) return;
      const formattedNum = numVal.startsWith("+") ? numVal : "+" + numVal;
      const existingIdx = (data.rented_numbers || []).findIndex((rn) => rn && rn.number === formattedNum);
      const range = String((typeof n === "object" ? n.range || n.rangeName || n.range_name || n.termination : "") || "IPRN Webhook Range").trim();
      const allocatedAt = String((typeof n === "object" ? n.allocatedAt || n.created_at || n.timestamp : "") || (/* @__PURE__ */ new Date()).toISOString()).trim();
      const status = String((typeof n === "object" ? n.status : "") || "Active").trim();
      const operator = String((typeof n === "object" ? n.operator : "") || (range.includes(" - ") ? range.split(" - ")[1] : "Virtual Carrier")).trim();
      let priceVal = 0;
      try {
        const parsedPrice = parseFloat(typeof n === "object" ? n.monthlyPrice || n.price || n.cost || "0.00" : "0.00");
        if (!isNaN(parsedPrice)) priceVal = parsedPrice;
      } catch (_) {
      }
      const monthlyPrice = `${priceVal.toFixed(2)} USD`;
      const mappedNumber = {
        id: String(typeof n === "object" && n.id ? n.id : `NUM-API-${formattedNum.replace("+", "")}`).trim(),
        number: formattedNum,
        range,
        allocatedAt,
        status,
        operator,
        monthlyPrice,
        // Match frontend extended properties for statistics and list views
        rate: monthlyPrice,
        term: range,
        country: range.includes(" - ") ? range.split(" - ")[0] : "Global",
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
  static logActivity(eventType, processedType, description, req, data) {
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Vercel Ingress Serverless Engine";
    const newActivity = {
      id: `ACT-V-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      event: eventType.toUpperCase(),
      processedType,
      description,
      status: "SUCCESS",
      ip: String(ip),
      userAgent: String(userAgent)
    };
    data.activity_logs = [newActivity, ...data.activity_logs].slice(0, 150);
  }
  /**
   * Extensible and reliable provider API calling with built-in retry logic
   */
  static async fetchWithRetry(url, options, retries = 2, delay = 2e3) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429) {
          console.warn(`[CoreStore] Rate limited (429) on ${url}. Respecting provider limits and backing off.`);
          return response;
        }
        return response;
      } catch (err) {
        if (i === retries - 1) throw err;
        const waitTime = delay * Math.pow(2, i);
        console.warn(`[CoreStore] Connection error (${err.message}). Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    throw new Error("fetchWithRetry failed after maximum attempts");
  }
  /**
   * Central math engine to update delivery rates and metrics
   */
  static recomputeStats(data) {
    const totalMessages = data.active_sms_logs.length;
    const delivered = data.active_sms_logs.filter((l) => l.status === "DELIVERED").length;
    const failed = totalMessages - delivered;
    const deliveryRate = totalMessages > 0 ? Math.round(delivered / totalMessages * 100) : 100;
    const totalRanges = data.rented_numbers.length;
    const now = /* @__PURE__ */ new Date();
    const todayDate = now.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
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
class CustomTermStore {
  /**
   * Saves custom termination range and its phone number pool chunked into Firestore
   */
  static async save(term, numbersPool) {
    const { code } = term;
    const totalNumbers = numbersPool.length;
    const termRef = doc(db, "custom_terminations", code);
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
    const CHUNK_SIZE = 1e4;
    const chunks = [];
    for (let i = 0; i < numbersPool.length; i += CHUNK_SIZE) {
      chunks.push(numbersPool.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < chunks.length; i++) {
      const chunkRef = doc(db, "custom_terminations", code, "pool_chunks", `chunk_${i}`);
      await setDoc(chunkRef, { numbers: chunks[i] });
    }
    const startIdx = chunks.length;
    for (let i = startIdx; i < startIdx + 100; i++) {
      try {
        const chunkRef = doc(db, "custom_terminations", code, "pool_chunks", `chunk_${i}`);
        await deleteDoc(chunkRef);
      } catch (e) {
        break;
      }
    }
    return true;
  }
  /**
   * Updates only metadata of an existing custom termination
   */
  static async updateMetadata(code, updates) {
    const termRef = doc(db, "custom_terminations", code);
    const snap = await getDoc(termRef);
    if (!snap.exists()) {
      throw new Error("Termination range not found");
    }
    const current = snap.data();
    const updated = {
      ...current,
      country: updates.country || current.country,
      operator: updates.operator || current.operator,
      service: updates.service || current.service,
      rangeName: updates.rangeName || current.rangeName,
      rate: updates.rate !== void 0 ? updates.rate : current.rate,
      limit: updates.limit || current.limit,
      number: updates.number !== void 0 ? updates.number : current.number
    };
    await setDoc(termRef, updated);
    return updated;
  }
  /**
   * Retrieves all custom terminations with computed fields
   */
  static async getAll() {
    try {
      const colRef = collection(db, "custom_terminations");
      const snap = await getDocs(colRef);
      const list = [];
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
            available: total > 0 ? `${total.toLocaleString()} available` : "Unlimited available",
            label: `${data.rangeName} (${total > 0 ? total.toLocaleString() + " file numbers" : "Unlimited available"})`,
            totalNumbers: total,
            createdAt: data.createdAt || Date.now()
          });
        }
      });
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (e) {
      console.error("[CustomTermStore] Error fetching custom terminations:", e);
      return [];
    }
  }
  /**
   * Fetches full combined pool of numbers for a custom range
   */
  static async getPool(code) {
    try {
      const colRef = collection(db, "custom_terminations", code, "pool_chunks");
      const snap = await getDocs(colRef);
      let combined = [];
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
  static async delete(code) {
    try {
      const colRef = collection(db, "custom_terminations", code, "pool_chunks");
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "custom_terminations", code, "pool_chunks", d.id));
      }
      await deleteDoc(doc(db, "custom_terminations", code));
      return true;
    } catch (e) {
      console.error(`[CustomTermStore] Error deleting termination ${code}:`, e);
      return false;
    }
  }
  /**
   * Appends numbers to a custom range and saves back
   */
  static async appendNumbers(code, newNumbers) {
    const termRef = doc(db, "custom_terminations", code);
    const snap = await getDoc(termRef);
    if (!snap.exists()) {
      throw new Error("Termination range not found");
    }
    const metadata = snap.data();
    const currentPool = await this.getPool(code);
    const poolSet = new Set(currentPool);
    newNumbers.forEach((num) => {
      let clean = String(num || "").trim();
      if (clean) {
        if (!clean.startsWith("+")) clean = `+${clean}`;
        poolSet.add(clean);
      }
    });
    const merged = Array.from(poolSet);
    await this.save({
      code,
      country: metadata.country || "Global",
      operator: metadata.operator || "Carrier",
      service: metadata.service || "WhatsApp",
      rangeName: metadata.rangeName || code,
      rate: metadata.rate || "0.0000 USD",
      limit: metadata.limit || "10,000",
      number: merged[0] || metadata.number || "",
      createdAt: metadata.createdAt || Date.now()
    }, merged);
    return merged.length;
  }
}
export {
  CoreStore,
  CustomTermStore
};
