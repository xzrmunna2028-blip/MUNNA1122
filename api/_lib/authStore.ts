import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseQuotaExhausted, handleFirebaseError } from './firebase.js';

export interface UserRecord {
  id?: string;
  name: string;
  email: string;
  password?: string;
  pass?: string;
  role?: string;
  status: 'Active' | 'Pending' | 'Suspended' | 'Rejected';
  createdAt?: string;
  created?: string;
  lastLogin?: string;
}

export interface InvitationRecord {
  token: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  inviter: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'used' | 'revoked';
  link: string;
}

export interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  category: string;
  targetRole: string;
  pinned: boolean;
  author: string;
  createdAt: string;
}

export class AuthStore {
  // USERS
  public static async getUsers(): Promise<UserRecord[]> {
    try {
      if (isFirebaseQuotaExhausted()) {
        return [];
      }
      const colRef = collection(db, 'registered_users');
      const snap = await getDocs(colRef);
      const list: UserRecord[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as UserRecord);
      });

      if (list.length === 0) {
        // Initialize default users
        const defaultUsers: UserRecord[] = [
          {
            id: 'usr-master',
            name: 'Munna',
            email: 'xzrmunna7788@gmail.com',
            password: 'XZRMUNNA12061',
            role: 'Master Admin',
            status: 'Active',
            createdAt: '2026-09-01'
          },
          {
            id: 'usr-admin-alt',
            name: 'Munna Admin',
            email: 'xzrmunna974@gmail.com',
            password: 'MUNNA11',
            role: 'Admin',
            status: 'Active',
            createdAt: '2026-09-01'
          },
          {
            id: 'usr-demo',
            name: 'Demo Operator',
            email: 'user@codeflow.com',
            password: 'codeflow123',
            role: 'User',
            status: 'Active',
            createdAt: '2026-09-01'
          }
        ];
        for (const u of defaultUsers) {
          await this.saveUser(u);
        }
        return defaultUsers;
      }
      return list;
    } catch (e: any) {
      handleFirebaseError(e);
      return [];
    }
  }

  public static async saveUser(user: UserRecord): Promise<void> {
    if (isFirebaseQuotaExhausted()) {
      return;
    }
    try {
      const cleanEmail = user.email.toLowerCase().trim();
      const userRef = doc(db, 'registered_users', cleanEmail);
      await setDoc(userRef, {
        ...user,
        email: cleanEmail
      }, { merge: true });
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }

  public static async saveUsers(users: UserRecord[]): Promise<void> {
    try {
      await Promise.all(users.map(u => this.saveUser(u)));
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }

  public static async deleteUser(email: string): Promise<void> {
    if (isFirebaseQuotaExhausted()) {
      return;
    }
    try {
      const cleanEmail = email.toLowerCase().trim();
      const userRef = doc(db, 'registered_users', cleanEmail);
      await deleteDoc(userRef);
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }

  public static async getPendingUsers(): Promise<UserRecord[]> {
    const users = await this.getUsers();
    return users.filter(u => u.status === 'Pending');
  }

  // INVITATIONS
  public static async getInvitations(): Promise<InvitationRecord[]> {
    try {
      if (isFirebaseQuotaExhausted()) {
        return [];
      }
      const colRef = collection(db, 'invitations');
      const snap = await getDocs(colRef);
      const list: InvitationRecord[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as InvitationRecord);
      });
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e: any) {
      handleFirebaseError(e);
      return [];
    }
  }

  public static async saveInvitation(inv: InvitationRecord): Promise<void> {
    if (isFirebaseQuotaExhausted()) {
      return;
    }
    try {
      const token = inv.token.trim();
      const ref = doc(db, 'invitations', token);
      await setDoc(ref, inv, { merge: true });
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }

  public static async saveInvitations(invites: InvitationRecord[]): Promise<void> {
    try {
      await Promise.all(invites.map(i => this.saveInvitation(i)));
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }

  // BROADCASTS
  public static async getBroadcasts(): Promise<BroadcastRecord[]> {
    try {
      if (isFirebaseQuotaExhausted()) {
        return [];
      }
      const colRef = collection(db, 'broadcast_notices');
      const snap = await getDocs(colRef);
      const list: BroadcastRecord[] = [];
      snap.forEach(doc => {
        list.push(doc.data() as BroadcastRecord);
      });

      if (list.length === 0) {
        const defaultNotice: BroadcastRecord = {
          id: 'notice-welcome',
          title: 'স্বাগতম অফিশিয়াল নোটিশ',
          message: 'আমাদের অফিসিয়াল নোটিশ বোর্ডে আপনাকে স্বাগতম। সকল আপডেট পেতে চোখ রাখুন।',
          category: 'Update',
          targetRole: 'all',
          pinned: true,
          author: 'Munna (Admin)',
          createdAt: '2026-09-15'
        };
        await this.saveBroadcast(defaultNotice);
        return [defaultNotice];
      }
      return list;
    } catch (e: any) {
      handleFirebaseError(e);
      return [];
    }
  }

  public static async saveBroadcast(b: BroadcastRecord): Promise<void> {
    if (isFirebaseQuotaExhausted()) {
      return;
    }
    try {
      const ref = doc(db, 'broadcast_notices', b.id);
      await setDoc(ref, b, { merge: true });
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }

  public static async deleteBroadcast(id: string): Promise<void> {
    if (isFirebaseQuotaExhausted()) {
      return;
    }
    try {
      const ref = doc(db, 'broadcast_notices', id);
      await deleteDoc(ref);
    } catch (e: any) {
      handleFirebaseError(e);
    }
  }
}
