import fs from 'node:fs';
import path from 'node:path';

// File paths with /tmp fallback for Vercel Serverless environment
const getFilePath = (fileName: string): string => {
  const rootPath = path.join(process.cwd(), fileName);
  if (process.env.VERCEL) {
    const tmpPath = path.join('/tmp', fileName);
    // If file doesn't exist in /tmp, copy initial file from project root if it exists
    if (!fs.existsSync(tmpPath) && fs.existsSync(rootPath)) {
      try {
        fs.copyFileSync(rootPath, tmpPath);
      } catch {}
    }
    return tmpPath;
  }
  return rootPath;
};

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
  private static usersFile = getFilePath('registered_users.json');
  private static invitesFile = getFilePath('invitations.json');
  private static broadcastsFile = getFilePath('broadcast_notices.json');

  // Helper safe read
  private static readFile<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw) as T;
      }
    } catch (e) {
      console.warn(`[AuthStore] Error reading ${filePath}:`, e);
    }
    return fallback;
  }

  // Helper safe write
  private static writeFile<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn(`[AuthStore] Error writing ${filePath}:`, e);
    }
  }

  // USERS
  public static getUsers(): UserRecord[] {
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

    const existing = this.readFile<UserRecord[]>(this.usersFile, []);
    if (!Array.isArray(existing) || existing.length === 0) {
      this.writeFile(this.usersFile, defaultUsers);
      return defaultUsers;
    }
    return existing;
  }

  public static saveUser(user: UserRecord): void {
    const users = this.getUsers();
    const cleanEmail = user.email.toLowerCase().trim();
    const idx = users.findIndex(u => u.email.toLowerCase().trim() === cleanEmail);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.unshift(user);
    }
    this.writeFile(this.usersFile, users);
  }

  public static getPendingUsers(): UserRecord[] {
    const users = this.getUsers();
    return users.filter(u => u.status === 'Pending');
  }

  // INVITATIONS
  public static getInvitations(): InvitationRecord[] {
    return this.readFile<InvitationRecord[]>(this.invitesFile, []);
  }

  public static saveInvitation(inv: InvitationRecord): void {
    const list = this.getInvitations();
    const filtered = list.filter(i => i.token !== inv.token);
    filtered.unshift(inv);
    this.writeFile(this.invitesFile, filtered);
  }

  // BROADCASTS
  public static getBroadcasts(): BroadcastRecord[] {
    const defaults: BroadcastRecord[] = [
      {
        id: 'notice-welcome',
        title: 'স্বাগতম অফিশিয়াল নোটিশ',
        message: 'আমাদের অফিসিয়াল টেলিগ্রাম গ্রুপে যুক্ত থাকুন এবং সকল নতুন আপডেট সম্পর্কে অবহিত থাকুন।',
        category: 'Update',
        targetRole: 'all',
        pinned: true,
        author: 'Munna (Admin)',
        createdAt: '2026-09-15'
      }
    ];
    const existing = this.readFile<BroadcastRecord[]>(this.broadcastsFile, []);
    if (!Array.isArray(existing) || existing.length === 0) {
      this.writeFile(this.broadcastsFile, defaults);
      return defaults;
    }
    return existing;
  }

  public static saveBroadcast(b: BroadcastRecord): void {
    const list = this.getBroadcasts();
    const filtered = list.filter(item => item.id !== b.id);
    filtered.unshift(b);
    this.writeFile(this.broadcastsFile, filtered);
  }

  public static deleteBroadcast(id: string): void {
    const list = this.getBroadcasts();
    const filtered = list.filter(item => item.id !== id);
    this.writeFile(this.broadcastsFile, filtered);
  }
}
