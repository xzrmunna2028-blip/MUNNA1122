import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let firebaseConfig: any = null;

try {
  // 1. Try resolving relative to this module's directory (highly reliable on Vercel)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const relPath = path.join(__dirname, '..', '..', 'firebase-applet-config.json');
  if (fs.existsSync(relPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(relPath, 'utf8'));
  }
} catch (e) {
  console.warn('[FirebaseConfig] Failed to resolve via __dirname:', e);
}

if (!firebaseConfig) {
  try {
    // 2. Try process.cwd() as fallback
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.warn('[FirebaseConfig] Failed to resolve via process.cwd():', e);
  }
}

// 3. Fallback hardcoded static configuration to ensure 100% liveness on any serverless edge/cold-start
if (!firebaseConfig) {
  firebaseConfig = {
    projectId: "micro-technique-dszp9",
    appId: "1:438422593575:web:e29e63832c531c377f6e02",
    apiKey: "AIzaSyBqoSTfXl7ZVQrqZsdLqmQxEk2T_Ujy4WI",
    authDomain: "micro-technique-dszp9.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-trafficanalytics-c3719589-3818-47dc-afeb-11ccf9019472",
    storageBucket: "micro-technique-dszp9.firebasestorage.app",
    messagingSenderId: "438422593575",
    measurementId: "",
    oAuthClientId: "438422593575-a0qgk7p5ut4b6o5dkp1u2eblhia1vh9m.apps.googleusercontent.com",
    recaptchaSiteKey: ""
  };
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const quotaFilePath = path.join(process.cwd(), '.firestore_quota');
let quotaExhaustedUntil = 0;
try {
  if (fs.existsSync(quotaFilePath)) {
    const val = parseInt(fs.readFileSync(quotaFilePath, 'utf8').trim(), 10);
    if (!isNaN(val) && val > Date.now()) {
      quotaExhaustedUntil = val;
    }
  }
} catch {}

export function isFirebaseQuotaExhausted(): boolean {
  return Date.now() < quotaExhaustedUntil;
}

export function markFirebaseQuotaExhausted(): void {
  quotaExhaustedUntil = Date.now() + 24 * 60 * 60 * 1000;
  try {
    fs.writeFileSync(quotaFilePath, quotaExhaustedUntil.toString(), 'utf8');
  } catch {}
}

export function handleFirebaseError(error: any): void {
  const errMsg = String(error?.message || error?.code || '');
  if (
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota') ||
    error?.code === 8 ||
    error?.code === 'resource-exhausted'
  ) {
    markFirebaseQuotaExhausted();
    console.warn('[Firebase] Firestore daily write quota limit reached. Safely persisting via local memory & JSON engine.');
  }
}
