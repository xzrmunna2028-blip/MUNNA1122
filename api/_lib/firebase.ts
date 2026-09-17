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
    projectId: "code-flow-52eb1",
    appId: "1:573701428732:web:c827e6bdc2a8a597d40e79",
    apiKey: "AIzaSyCuUXjxF9pNdLuI8fEUIeat7I_exLgvDWI",
    authDomain: "code-flow-52eb1.firebaseapp.com",
    firestoreDatabaseId: "(default)",
    storageBucket: "code-flow-52eb1.firebasestorage.app",
    messagingSenderId: "573701428732",
    measurementId: "G-STKJGZR882"
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
    errMsg.includes('PERMISSION_DENIED') ||
    errMsg.includes('permission-denied') ||
    errMsg.includes('Cloud Firestore API') ||
    errMsg.includes('Quota') ||
    error?.code === 8 ||
    error?.code === 7 ||
    error?.code === 'resource-exhausted' ||
    error?.code === 'permission-denied'
  ) {
    markFirebaseQuotaExhausted();
    console.warn('[Firebase] Firestore unavailable or limit reached. Safely using local memory & REST JSON engine.');
  }
}
