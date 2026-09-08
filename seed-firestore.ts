import { doc, setDoc } from 'firebase/firestore';
import { db } from './api/_lib/firebase.js';

async function seed() {
  console.log('Seeding settings/global with user API key...');
  const settingsRef = doc(db, 'settings', 'global');
  
  const initialData = {
    last_updated: new Date().toISOString(),
    iprn_api_key: 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z',
    metrics: {
      messages: 0,
      delivered: 0,
      failed: 0,
      todayCount: 0,
      deliveryRate: 100,
      todayDate: new Date().toLocaleDateString(),
      totalRanges: 0
    },
    realtime_counters: {
      totalMessages: 0,
      delivered: 0,
      failed: 0,
      charged: 0,
      totalRanges: 0
    },
    chart_data: []
  };

  try {
    await setDoc(settingsRef, initialData);
    console.log('Successfully seeded settings/global in Firestore!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

seed();
