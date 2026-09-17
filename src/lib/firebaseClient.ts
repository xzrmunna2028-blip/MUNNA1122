import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, doc, collection, onSnapshot, query, orderBy, limit, setLogLevel, disableNetwork, enableNetwork, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Silence internal Firestore client logger to prevent streaming error logs when quota is exceeded or API is uninitialized
try {
  setLogLevel('silent');
} catch (err) {
  console.warn('Failed to set Firestore log level:', err);
}

// Initialize native clientDb instance
export const clientDb = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Disable client network connection immediately if we know the database is unavailable or uninitialized
if (typeof window !== 'undefined') {
  const isDisabled =
    localStorage.getItem('firebase_quota_exhausted') === 'true' ||
    localStorage.getItem('firebase_uninitialized') === 'true';
  if (isDisabled) {
    disableNetwork(clientDb).catch(() => {});
  }
}

export function handleClientFirebaseError(error: any): void {
  const errMsg = String(error?.message || error?.code || '');
  if (
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('PERMISSION_DENIED') ||
    errMsg.includes('permission-denied') ||
    errMsg.includes('Cloud Firestore API') ||
    errMsg.includes('Quota') ||
    error?.code === 'resource-exhausted' ||
    error?.code === 'permission-denied'
  ) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebase_quota_exhausted', 'true');
      localStorage.setItem('firebase_uninitialized', 'true');
    }
    try {
      disableNetwork(clientDb).catch(() => {});
    } catch (_) {}
  }
}

const nativeOnSnapshot = onSnapshot;

const safeOnSnapshot = (ref: any, onNext: any, onError?: any) => {
  if (typeof window !== 'undefined') {
    const isExhausted =
      localStorage.getItem('firebase_quota_exhausted') === 'true' ||
      localStorage.getItem('firebase_uninitialized') === 'true';
    if (isExhausted) {
      return () => {};
    }
  }

  try {
    return nativeOnSnapshot(ref, onNext, (error: any) => {
      handleClientFirebaseError(error);
      if (onError) onError(error);
    });
  } catch (err) {
    handleClientFirebaseError(err);
    if (onError) onError(err);
    return () => {};
  }
};

export function enableFirebaseCloudSync(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('firebase_uninitialized');
    localStorage.removeItem('firebase_quota_exhausted');
    localStorage.setItem('firebase_enabled', 'true');
    window.location.reload();
  }
}

export { doc, collection, safeOnSnapshot as onSnapshot, query, orderBy, limit, disableNetwork, enableNetwork };

