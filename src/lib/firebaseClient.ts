import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const clientDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { doc, collection, onSnapshot, query, orderBy, limit };
