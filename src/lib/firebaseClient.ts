import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, doc, collection, onSnapshot, query, orderBy, limit, setLogLevel, disableNetwork, enableNetwork } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Silence internal Firestore client logger to prevent streaming error logs when quota is exceeded
try {
  setLogLevel('silent');
} catch (err) {
  console.warn('Failed to set Firestore log level:', err);
}

export const clientDb = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Disable client network connection immediately if we already know the database quota is exhausted
if (typeof window !== 'undefined' && localStorage.getItem('firebase_quota_exhausted') === 'true') {
  disableNetwork(clientDb).catch(() => {});
}

export { doc, collection, onSnapshot, query, orderBy, limit, disableNetwork, enableNetwork };
