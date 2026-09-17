import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseQuotaExhausted, handleFirebaseError } from './firebase.js';

export interface UserWorkspace {
  email: string;
  rented_numbers: any[];
  test_numbers: any[];
  sms_logs: any[];
  notifications: any[];
  profile?: any;
  lastUpdated?: string;
}

export class WorkspaceStore {
  public static async get(email: string): Promise<UserWorkspace> {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail) {
      return {
        email: '',
        rented_numbers: [],
        test_numbers: [],
        sms_logs: [],
        notifications: [],
        profile: null,
      };
    }

    if (isFirebaseQuotaExhausted()) {
      return {
        email: cleanEmail,
        rented_numbers: [],
        test_numbers: [],
        sms_logs: [],
        notifications: [],
        profile: null,
      };
    }

    try {
      const docRef = doc(db, 'user_workspaces', cleanEmail);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserWorkspace;
        return {
          email: cleanEmail,
          rented_numbers: Array.isArray(data.rented_numbers) ? data.rented_numbers : [],
          test_numbers: Array.isArray(data.test_numbers) ? data.test_numbers : [],
          sms_logs: Array.isArray(data.sms_logs) ? data.sms_logs : [],
          notifications: Array.isArray(data.notifications) ? data.notifications : [],
          profile: data.profile || null,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };
      }
    } catch (e: any) {
      handleFirebaseError(e);
    }

    return {
      email: cleanEmail,
      rented_numbers: [],
      test_numbers: [],
      sms_logs: [],
      notifications: [],
      profile: null,
    };
  }

  public static async save(email: string, partial: Partial<UserWorkspace>): Promise<boolean> {
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail) return false;

    if (isFirebaseQuotaExhausted()) {
      return true;
    }

    try {
      const current = await this.get(cleanEmail);
      const updated: UserWorkspace = {
        email: cleanEmail,
        rented_numbers: partial.rented_numbers !== undefined ? partial.rented_numbers : current.rented_numbers,
        test_numbers: partial.test_numbers !== undefined ? partial.test_numbers : current.test_numbers,
        sms_logs: partial.sms_logs !== undefined ? partial.sms_logs : current.sms_logs,
        notifications: partial.notifications !== undefined ? partial.notifications : current.notifications,
        profile: partial.profile !== undefined ? partial.profile : current.profile,
        lastUpdated: new Date().toISOString(),
      };

      const docRef = doc(db, 'user_workspaces', cleanEmail);
      await setDoc(docRef, updated);
      return true;
    } catch (e: any) {
      handleFirebaseError(e);
      return false;
    }
  }
}
