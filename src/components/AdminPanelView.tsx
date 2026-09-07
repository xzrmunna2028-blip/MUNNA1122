import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  UserPlus,
  Key,
  Radio,
  Headphones,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  UserCheck,
  Shield,
  Sliders,
  DollarSign,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Megaphone,
  Globe,
  Ban,
  Wifi,
  WifiOff,
  Monitor,
  Laptop,
  Smartphone,
  KeyRound,
  MessageSquare,
  Filter,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Upload,
  Crown,
} from 'lucide-react';
import { RegisteredUser } from './ActivationChatBot';
import { MasterKeyManager } from './MasterKeyManager';
import { NotificationItem } from '../types';

export interface AdminUserRecord extends RegisteredUser {
  id: string;
  role: 'User' | 'VIP' | 'Sub-Admin' | 'Admin';
  balance: number;
  status: 'Active' | 'Suspended' | 'Banned' | 'Pending';
  assignedNumbers: number;
  ipAddress?: string;
  location?: string;
  device?: string;
  isOnline?: boolean;
  lastActive?: string;
  personalNotes?: string;
  customNotifications?: {
    id: string;
    title: string;
    message: string;
    date: string;
    read: boolean;
  }[];
}

interface SubAdminRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: {
    canApproveUsers: boolean;
    canManageNumbers: boolean;
    canEditApiKeys: boolean;
    canViewFinance: boolean;
    canSendBroadcasts: boolean;
  };
  lastActive: string;
}

interface SupportTicket {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'Open' | 'Replied' | 'Resolved';
  timestamp: string;
  replies?: string[];
}

interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  active: boolean;
  image?: string;
  author?: string;
  createdAt: string;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  user: string;
  rateLimit: string;
  created: string;
  status: 'Active' | 'Revoked';
}

interface AdminPanelViewProps {
  onBackToUserPanel?: () => void;
  darkMode?: boolean;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  onBackToUserPanel,
  darkMode,
}) => {
  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'users'
    | 'pending_activations'
    | 'manual_create'
    | 'sub_admins'
    | 'master_key'
    | 'apikeys'
    | 'support'
    | 'updates'
    | 'notifications'
  >('overview');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Online' | 'Active' | 'Suspended' | 'Banned'>('All');

  // Modal states for user actions
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<AdminUserRecord | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);

  const [selectedUserForNotify, setSelectedUserForNotify] = useState<AdminUserRecord | null>(null);
  const [personalNotifTitle, setPersonalNotifTitle] = useState<string>('');
  const [personalNotifMessage, setPersonalNotifMessage] = useState<string>('');

  const [showUserDetailsModal, setShowUserDetailsModal] = useState<AdminUserRecord | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1. Initial Enhanced Users List
  const [users, setUsers] = useState<AdminUserRecord[]>(() => {
    const saved = localStorage.getItem('codeflow_admin_users_list_v2');
    if (saved) return JSON.parse(saved);

    return [
      {
        id: 'USR-101',
        name: 'Munna Admin',
        email: 'xzrmunna7788@gmail.com',
        pass: 'MUNNA11',
        role: 'Admin',
        balance: 500.0,
        status: 'Active',
        assignedNumbers: 12,
        ipAddress: '103.114.98.24',
        location: 'Dhaka, Bangladesh',
        device: 'Windows 11 / Chrome 128',
        isOnline: true,
        lastActive: 'Active now (Live Working)',
        activatedAt: new Date().toISOString(),
        customNotifications: [],
      },
      {
        id: 'USR-102',
        name: 'Dev Gateway Enterprise',
        email: 'dev@enterprise.io',
        pass: 'CodeFlow2026!',
        role: 'VIP',
        balance: 150.0,
        status: 'Active',
        assignedNumbers: 5,
        ipAddress: '54.210.14.89',
        location: 'Virginia, United States',
        device: 'MacBook Pro / Safari 18',
        isOnline: true,
        lastActive: '2 mins ago (API polling)',
        activatedAt: new Date(Date.now() - 86400000).toISOString(),
        customNotifications: [],
      },
      {
        id: 'USR-103',
        name: 'Alex Johnson',
        email: 'alex.j@techmail.com',
        pass: 'AlexPass99#',
        role: 'User',
        balance: 25.0,
        status: 'Active',
        assignedNumbers: 1,
        ipAddress: '185.220.101.5',
        location: 'Frankfurt, Germany',
        device: 'Ubuntu Linux / Firefox 130',
        isOnline: false,
        lastActive: '35 mins ago',
        activatedAt: new Date(Date.now() - 172800000).toISOString(),
        customNotifications: [],
      },
      {
        id: 'USR-104',
        name: 'Carlos Mendez',
        email: 'carlos.sms@latam.net',
        pass: 'CarlosOTP2026',
        role: 'User',
        balance: 0.0,
        status: 'Suspended',
        assignedNumbers: 0,
        ipAddress: '190.145.22.11',
        location: 'Bogota, Colombia',
        device: 'Android 14 / Mobile Chrome',
        isOnline: false,
        lastActive: '3 days ago',
        activatedAt: new Date(Date.now() - 432000000).toISOString(),
        customNotifications: [],
      },
    ];
  });

  // Real-time live online simulation heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) => {
          // Keep admin and active live dev always online, occasionally toggle random test users
          if (u.role === 'Admin') return { ...u, isOnline: true, lastActive: 'Active now (Live Working)' };
          if (u.id === 'USR-102') return { ...u, isOnline: true, lastActive: 'Active now (Live Traffic)' };
          return u;
        })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // 2. Pending Activations Queue
  const [pendingActivations, setPendingActivations] = useState<AdminUserRecord[]>(() => {
    const saved = localStorage.getItem('codeflow_pending_activations');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'PEND-301',
        name: 'Rahim Telecom',
        email: 'rahim.sms@gmail.com',
        pass: 'RahimPass78#',
        role: 'User',
        balance: 10.0,
        status: 'Pending',
        assignedNumbers: 0,
        ipAddress: '103.205.71.18',
        location: 'Chittagong, Bangladesh',
        device: 'Windows 10 / Edge',
        isOnline: true,
        lastActive: 'Awaiting Activation',
        activatedAt: new Date().toISOString(),
      },
      {
        id: 'PEND-302',
        name: 'Nexus OTP System',
        email: 'nexus.verify@cloudmail.net',
        pass: 'NexusSecure88$',
        role: 'User',
        balance: 10.0,
        status: 'Pending',
        assignedNumbers: 0,
        ipAddress: '45.33.32.156',
        location: 'California, US',
        device: 'MacOS / Chrome',
        isOnline: false,
        lastActive: '1 hr ago',
        activatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  });

  // 3. Sub-Admins List
  const [subAdmins, setSubAdmins] = useState<SubAdminRecord[]>(() => {
    const saved = localStorage.getItem('codeflow_sub_admins');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'SUB-01',
        name: 'Tariq Rahman',
        email: 'tariq.support@codeflow.io',
        role: 'Support Manager',
        permissions: {
          canApproveUsers: true,
          canManageNumbers: true,
          canEditApiKeys: false,
          canViewFinance: false,
          canSendBroadcasts: true,
        },
        lastActive: 'Online now',
      },
      {
        id: 'SUB-02',
        name: 'Sarah Finance',
        email: 'sarah.billing@codeflow.io',
        role: 'Billing Moderator',
        permissions: {
          canApproveUsers: true,
          canManageNumbers: false,
          canEditApiKeys: false,
          canViewFinance: true,
          canSendBroadcasts: false,
        },
        lastActive: '40 mins ago',
      },
    ];
  });

  // 4. API Keys List
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => {
    const saved = localStorage.getItem('codeflow_admin_apikeys');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'KEY-1',
        name: 'Master Production Gateway',
        key: 'cf_live_9a87f21b4e9812ad88f192',
        user: 'xzrmunna7788@gmail.com',
        rateLimit: '1000 req/min',
        created: '2026-08-15',
        status: 'Active',
      },
      {
        id: 'KEY-2',
        name: 'Dev Sandbox Rest Key',
        key: 'cf_test_471b09ca881ef09c112bfa',
        user: 'dev@enterprise.io',
        rateLimit: '200 req/min',
        created: '2026-09-01',
        status: 'Active',
      },
    ];
  });

  // 5. Support Tickets
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('codeflow_support_tickets');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'TCK-801',
        userName: 'Alex Johnson',
        userEmail: 'alex.j@techmail.com',
        subject: 'Need additional US Virtual Numbers',
        message: 'Hello Admin, I want to rent 5 dedicated US phone numbers for OTP verification.',
        status: 'Open',
        timestamp: '20 mins ago',
        replies: [],
      },
      {
        id: 'TCK-802',
        userName: 'Nexus OTP System',
        userEmail: 'nexus.verify@cloudmail.net',
        subject: 'Account Activation Inquiry',
        message: 'My account request has been submitted. Please approve my panel access.',
        status: 'Open',
        timestamp: '1 hour ago',
        replies: [],
      },
    ];
  });

  // 6. Broadcast Updates
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>(() => {
    const saved = localStorage.getItem('codeflow_broadcasts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'BRD-1',
        title: 'SMS Gateway System v3.4.0 Live',
        message: 'High-speed routing algorithms and live websocket webhooks are now active.',
        type: 'info',
        active: true,
        createdAt: '2026-09-06',
      },
    ];
  });

  // LocalStorage Sync
  useEffect(() => {
    localStorage.setItem('codeflow_admin_users_list_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('codeflow_pending_activations', JSON.stringify(pendingActivations));
  }, [pendingActivations]);

  useEffect(() => {
    localStorage.setItem('codeflow_sub_admins', JSON.stringify(subAdmins));
  }, [subAdmins]);

  useEffect(() => {
    localStorage.setItem('codeflow_admin_apikeys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem('codeflow_support_tickets', JSON.stringify(supportTickets));
  }, [supportTickets]);

  useEffect(() => {
    localStorage.setItem('codeflow_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  // 7. Global / User Notifications State
  const [globalNotifRecipient, setGlobalNotifRecipient] = useState<string>('all');
  const [globalNotifTitle, setGlobalNotifTitle] = useState<string>('');
  const [globalNotifMessage, setGlobalNotifMessage] = useState<string>('');
  const [globalNotifType, setGlobalNotifType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [dispatchedNotifs, setDispatchedNotifs] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('codeflow_user_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const handleNotifsSync = () => {
      try {
        const saved = localStorage.getItem('codeflow_user_notifications');
        if (saved) {
          setDispatchedNotifs(JSON.parse(saved));
        }
      } catch (e) {}
    };
    window.addEventListener('codeflow_notifications_updated', handleNotifsSync);
    return () => {
      window.removeEventListener('codeflow_notifications_updated', handleNotifsSync);
    };
  }, []);

  // Real-time calculation counts
  const totalCreatedUsers = users.length + pendingActivations.length;
  const onlineUsersCount = users.filter((u) => u.isOnline).length;
  const offlineUsersCount = users.filter((u) => !u.isOnline).length;
  const activeWorkingNowCount = users.filter((u) => u.isOnline && u.status === 'Active').length;
  const suspendedUsersCount = users.filter((u) => u.status === 'Suspended').length;
  const bannedUsersCount = users.filter((u) => u.status === 'Banned').length;

  // Actions on Users
  const handleApprovePendingUser = (user: AdminUserRecord) => {
    setPendingActivations((prev) => prev.filter((u) => u.id !== user.id));
    const approvedUser: AdminUserRecord = {
      ...user,
      status: 'Active',
      isOnline: true,
      lastActive: 'Active now',
      activatedAt: new Date().toISOString(),
    };
    setUsers((prev) => [approvedUser, ...prev]);

    // Update global registered users for login
    const regStr = localStorage.getItem('codeflow_registered_users');
    const regList: RegisteredUser[] = regStr ? JSON.parse(regStr) : [];
    regList.push({
      name: user.name,
      email: user.email,
      pass: user.pass,
      activatedAt: new Date().toISOString(),
    });
    localStorage.setItem('codeflow_registered_users', JSON.stringify(regList));
    showToast(`Account Approved & Activated for ${user.email}!`);
  };

  const handleRejectPendingUser = (id: string, email: string) => {
    setPendingActivations((prev) => prev.filter((u) => u.id !== id));
    showToast(`Rejected activation for ${email}`);
  };

  // Change / Reset Password
  const handleSaveNewPassword = () => {
    if (!selectedUserForPassword || !newPasswordInput.trim()) {
      showToast('Please enter a new password');
      return;
    }

    const updatedPass = newPasswordInput.trim();

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUserForPassword.id) {
          return { ...u, pass: updatedPass };
        }
        return u;
      })
    );

    // Update in codeflow_registered_users as well
    const regStr = localStorage.getItem('codeflow_registered_users');
    if (regStr) {
      const regList: RegisteredUser[] = JSON.parse(regStr);
      const updatedList = regList.map((r) => {
        if (r.email.toLowerCase() === selectedUserForPassword.email.toLowerCase()) {
          return { ...r, pass: updatedPass };
        }
        return r;
      });
      localStorage.setItem('codeflow_registered_users', JSON.stringify(updatedList));
    }

    showToast(`Password successfully updated for ${selectedUserForPassword.email}`);
    setSelectedUserForPassword(null);
    setNewPasswordInput('');
  };

  // Send Personal Notification to specific User
  const handleSendPersonalNotification = () => {
    if (!selectedUserForNotify || !personalNotifTitle.trim() || !personalNotifMessage.trim()) {
      showToast('Please provide both notification title and message');
      return;
    }

    const newNotifItem = {
      id: `NOTIF-${Date.now()}`,
      title: personalNotifTitle.trim(),
      message: personalNotifMessage.trim(),
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today',
      read: false,
    };

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUserForNotify.id) {
          return {
            ...u,
            customNotifications: [newNotifItem, ...(u.customNotifications || [])],
          };
        }
        return u;
      })
    );

    // Also dispatch to codeflow_user_notifications so it instantly appears in the notification bell!
    const newGlobalNotif: NotificationItem = {
      id: newNotifItem.id,
      title: personalNotifTitle.trim(),
      message: personalNotifMessage.trim(),
      time: 'Just now',
      read: false,
      type: 'info',
      recipient: selectedUserForNotify.email,
    };

    try {
      const existingNotifs = localStorage.getItem('codeflow_user_notifications');
      const parsedNotifs: NotificationItem[] = existingNotifs ? JSON.parse(existingNotifs) : [];
      const updatedNotifs = [newGlobalNotif, ...parsedNotifs];
      localStorage.setItem('codeflow_user_notifications', JSON.stringify(updatedNotifs));
      setDispatchedNotifs(updatedNotifs);
      window.dispatchEvent(new Event('codeflow_notifications_updated'));
    } catch (e) {}

    showToast(`Personal Notification dispatched to ${selectedUserForNotify.name}!`);
    setSelectedUserForNotify(null);
    setPersonalNotifTitle('');
    setPersonalNotifMessage('');
  };

  // Suspend User
  const handleSuspendUser = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Suspended' ? 'Active' : 'Suspended';
          return { ...u, status: nextStatus, isOnline: nextStatus === 'Active' ? u.isOnline : false };
        }
        return u;
      })
    );
    showToast('User suspension status toggled');
  };

  // Ban User from Website
  const handleBanUser = (id: string, email: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const isBanned = u.status === 'Banned';
          return {
            ...u,
            status: isBanned ? 'Active' : 'Banned',
            isOnline: false,
            lastActive: isBanned ? 'Reactivated' : 'BANNED by Admin',
          };
        }
        return u;
      })
    );
    showToast(`Security Ban status updated for ${email}`);
  };

  // Delete User permanently
  const handleDeleteUserPermanently = (id: string, email: string) => {
    if (window.confirm(`Are you sure you want to permanently DELETE user ${email}?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      
      // Also delete from registered users
      const regStr = localStorage.getItem('codeflow_registered_users');
      if (regStr) {
        const regList: RegisteredUser[] = JSON.parse(regStr);
        const filtered = regList.filter((r) => r.email.toLowerCase() !== email.toLowerCase());
        localStorage.setItem('codeflow_registered_users', JSON.stringify(filtered));
      }
      showToast(`User ${email} deleted permanently.`);
    }
  };

  // Generate a random strong password for user
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(res);
  };

  // Manual User Creation State
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPass, setManualPass] = useState('');
  const [manualRole, setManualRole] = useState<'User' | 'VIP' | 'Sub-Admin'>('User');
  const [manualBalance, setManualBalance] = useState('50.00');
  const [manualLocation, setManualLocation] = useState('Dhaka, Bangladesh');

  const handleManualCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim() || !manualPass.trim()) {
      showToast('Please fill all required fields');
      return;
    }

    const newUser: AdminUserRecord = {
      id: `USR-${Math.floor(100 + Math.random() * 900)}`,
      name: manualName.trim(),
      email: manualEmail.trim().toLowerCase(),
      pass: manualPass.trim(),
      role: manualRole,
      balance: parseFloat(manualBalance) || 0,
      status: 'Active',
      assignedNumbers: manualRole === 'VIP' ? 3 : 1,
      ipAddress: `103.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}.12`,
      location: manualLocation,
      device: 'Chrome / Desktop',
      isOnline: true,
      lastActive: 'Active now (Manual Created)',
      activatedAt: new Date().toISOString(),
      customNotifications: [],
    };

    setUsers((prev) => [newUser, ...prev]);

    const regStr = localStorage.getItem('codeflow_registered_users');
    const regList: RegisteredUser[] = regStr ? JSON.parse(regStr) : [];
    regList.push({
      name: newUser.name,
      email: newUser.email,
      pass: newUser.pass,
      activatedAt: newUser.activatedAt,
    });
    localStorage.setItem('codeflow_registered_users', JSON.stringify(regList));

    setManualName('');
    setManualEmail('');
    setManualPass('');
    setManualBalance('50.00');
    showToast(`Account Created & Activated for ${newUser.email}`);
    setActiveSection('users');
  };

  // Sub-Admin State
  const [subName, setSubName] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subRole, setSubRole] = useState('SMS Gate Moderator');
  const [subCanApprove, setSubCanApprove] = useState(true);
  const [subCanNumbers, setSubCanNumbers] = useState(true);
  const [subCanApi, setSubCanApi] = useState(false);
  const [subCanFinance, setSubCanFinance] = useState(false);
  const [subCanBroadcast, setSubCanBroadcast] = useState(true);

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim() || !subEmail.trim()) return;

    const newSub: SubAdminRecord = {
      id: `SUB-0${subAdmins.length + 1}`,
      name: subName.trim(),
      email: subEmail.trim(),
      role: subRole,
      permissions: {
        canApproveUsers: subCanApprove,
        canManageNumbers: subCanNumbers,
        canEditApiKeys: subCanApi,
        canViewFinance: subCanFinance,
        canSendBroadcasts: subCanBroadcast,
      },
      lastActive: 'Online now',
    };

    setSubAdmins((prev) => [newSub, ...prev]);
    setSubName('');
    setSubEmail('');
    showToast(`Sub-Admin ${newSub.name} created with assigned permissions.`);
  };

  // API Key State & Generation Logic
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyUser, setNewKeyUser] = useState('');
  const [newKeyRate, setNewKeyRate] = useState('1000 req/min');

  const handleGenerateApiKey = (e?: React.FormEvent, directUserEmail?: string) => {
    if (e) e.preventDefault();
    const targetEmail = (directUserEmail || newKeyUser).trim();
    if (!targetEmail) {
      showToast('Please enter or select a valid user email address');
      return;
    }

    const generatedKey = `cf_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`;
    const label = newKeyName.trim() || `Gateway - ${targetEmail.split('@')[0]}`;
    
    const newApiKey: ApiKeyItem = {
      id: `KEY-${Date.now().toString().slice(-4)}`,
      name: label,
      key: generatedKey,
      user: targetEmail,
      rateLimit: newKeyRate,
      created: new Date().toISOString().split('T')[0],
      status: 'Active',
    };

    // If key for user already exists, replace or prepend
    setApiKeys((prev) => {
      const filtered = prev.filter((k) => k.user.toLowerCase() !== targetEmail.toLowerCase());
      return [newApiKey, ...filtered];
    });

    setNewKeyName('');
    setNewKeyUser('');
    showToast(`API Key successfully generated & assigned to ${targetEmail}!`);
    window.dispatchEvent(new Event('storage'));
  };

  // Website Update Broadcast Creation State
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateType, setUpdateType] = useState<'info' | 'warning' | 'urgent' | 'maintenance'>('info');
  const [updateActive, setUpdateActive] = useState(true);
  const [updateImage, setUpdateImage] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image size exceeds 2MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateImage(reader.result as string);
        showToast('Update photo attached successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateBroadcastUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateMessage.trim()) {
      showToast('Please provide both notice title and announcement text');
      return;
    }

    const newBroadcast: SystemBroadcast = {
      id: `BRD-${Date.now()}`,
      title: updateTitle.trim(),
      message: updateMessage.trim(),
      type: updateType,
      active: updateActive,
      image: updateImage || undefined,
      author: 'Master Admin',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBroadcasts((prev) => [
      newBroadcast,
      ...prev.map((b) => (updateActive ? { ...b, active: false } : b)),
    ]);

    // Clear dismissed notice so all users see this notice bar on their dashboard!
    localStorage.removeItem('codeflow_dismissed_notice_id');
    window.dispatchEvent(new Event('codeflow_broadcasts_updated'));

    setUpdateTitle('');
    setUpdateMessage('');
    setUpdateImage('');
    setUpdateActive(true);
    showToast('Live Notice Bar updated & broadcast to all users!');
  };

  const handleEditBroadcast = (brd: SystemBroadcast) => {
    setUpdateTitle(brd.title);
    setUpdateMessage(brd.message);
    setUpdateType(brd.type as any);
    setUpdateActive(brd.active);
    setUpdateImage(brd.image || '');
    showToast(`Loaded "${brd.title}" into Notice Bar editor.`);
  };

  const handleToggleBroadcastStatus = (id: string) => {
    setBroadcasts((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
    localStorage.removeItem('codeflow_dismissed_notice_id');
    window.dispatchEvent(new Event('codeflow_broadcasts_updated'));
    showToast('Notice Bar live status toggled.');
  };

  const handleDeleteBroadcast = (id: string) => {
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    window.dispatchEvent(new Event('codeflow_broadcasts_updated'));
    showToast('Notice removed.');
  };

  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalNotifTitle.trim() || !globalNotifMessage.trim()) {
      showToast('Please provide both notification title and message');
      return;
    }

    const newNotifItem: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: globalNotifTitle.trim(),
      message: globalNotifMessage.trim(),
      time: 'Just now',
      read: false,
      type: globalNotifType,
      recipient: globalNotifRecipient,
    };

    try {
      const existingNotifs = localStorage.getItem('codeflow_user_notifications');
      const parsedNotifs: NotificationItem[] = existingNotifs ? JSON.parse(existingNotifs) : [];
      const updatedNotifs = [newNotifItem, ...parsedNotifs];
      localStorage.setItem('codeflow_user_notifications', JSON.stringify(updatedNotifs));
      setDispatchedNotifs(updatedNotifs);
      window.dispatchEvent(new Event('codeflow_notifications_updated'));
    } catch (e) {}

    // If specific user was targeted, also add to their user record in users list
    if (globalNotifRecipient !== 'all') {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.email.toLowerCase() === globalNotifRecipient.toLowerCase()) {
            return {
              ...u,
              customNotifications: [
                {
                  id: newNotifItem.id,
                  title: newNotifItem.title,
                  message: newNotifItem.message,
                  date: 'Just now',
                  read: false,
                },
                ...(u.customNotifications || []),
              ],
            };
          }
          return u;
        })
      );
    }

    showToast(
      `Notification dispatched to ${
        globalNotifRecipient === 'all' ? 'All Users' : globalNotifRecipient
      }!`
    );
    setGlobalNotifTitle('');
    setGlobalNotifMessage('');
  };

  const handleDeleteNotification = (id: string) => {
    try {
      const existingNotifs = localStorage.getItem('codeflow_user_notifications');
      const parsedNotifs: NotificationItem[] = existingNotifs ? JSON.parse(existingNotifs) : [];
      const updatedNotifs = parsedNotifs.filter((n) => n.id !== id);
      localStorage.setItem('codeflow_user_notifications', JSON.stringify(updatedNotifs));
      setDispatchedNotifs(updatedNotifs);
      window.dispatchEvent(new Event('codeflow_notifications_updated'));
      showToast('Notification deleted from user notifications.');
    } catch (e) {}
  };

  // Support replies
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const handleReplyTicket = (ticketId: string) => {
    const text = replyText[ticketId];
    if (!text || !text.trim()) return;

    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'Replied',
            replies: [...(t.replies || []), `[Admin]: ${text}`],
          };
        }
        return t;
      })
    );

    setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
    showToast(`Replied to ticket ${ticketId}`);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.ipAddress && u.ipAddress.includes(searchQuery)) ||
      (u.location && u.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === 'Online') return matchesSearch && u.isOnline;
    if (filterStatus === 'Active') return matchesSearch && u.status === 'Active';
    if (filterStatus === 'Suspended') return matchesSearch && u.status === 'Suspended';
    if (filterStatus === 'Banned') return matchesSearch && u.status === 'Banned';
    return matchesSearch;
  });

  const navItems = [
    { id: 'overview', label: 'Admin Overview', icon: Activity, count: null },
    {
      id: 'users',
      label: 'User Management & Security',
      icon: Users,
      count: users.length,
      highlight: false,
    },
    {
      id: 'pending_activations',
      label: 'Pending Accounts',
      icon: Clock,
      count: pendingActivations.length > 0 ? pendingActivations.length : null,
      highlight: pendingActivations.length > 0,
    },
    { id: 'manual_create', label: 'Manual Account Create', icon: UserPlus, count: null },
    { id: 'sub_admins', label: 'Sub-Admin Accounts', icon: Shield, count: subAdmins.length },
    { id: 'master_key', label: 'মাস্টার কি (Master Key)', icon: Crown, count: 'PRO', highlight: true },
    { id: 'apikeys', label: 'API Keys & Gateway', icon: Key, count: apiKeys.length },
    {
      id: 'support',
      label: 'Live Chat Support',
      icon: Headphones,
      count: supportTickets.filter((t) => t.status === 'Open').length || null,
    },
    { id: 'updates', label: 'Website Updates', icon: Megaphone, count: broadcasts.length },
    { id: 'notifications', label: 'Notification Center', icon: Bell, count: null },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100 font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-950 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Panel Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-700/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50 shrink-0">
            <ShieldAlert className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Code Flow <span className="text-cyan-400">Master Admin Panel</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                ROOT ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time User Tracking, IP Intelligence, Credential Management, Bans & Personal Notifications
            </p>
          </div>
        </div>

        {/* Back to User Dashboard Switcher */}
        {onBackToUserPanel && (
          <button
            onClick={onBackToUserPanel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Switch to User View</span>
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          </button>
        )}
      </div>

      {/* Real-time Telemetry Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Total Users</span>
            <p className="text-lg font-black text-white">{totalCreatedUsers}</p>
          </div>
          <Users className="w-4 h-4 text-slate-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase">Online Now</span>
            <p className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {onlineUsersCount}
            </p>
          </div>
          <Wifi className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase">Offline</span>
            <p className="text-lg font-black text-slate-300">{offlineUsersCount}</p>
          </div>
          <WifiOff className="w-4 h-4 text-slate-500" />
        </div>

        <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-cyan-400 uppercase">Live Working</span>
            <p className="text-lg font-black text-cyan-300">{activeWorkingNowCount}</p>
          </div>
          <Activity className="w-4 h-4 text-cyan-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase">Pending Review</span>
            <p className="text-lg font-black text-amber-400">{pendingActivations.length}</p>
          </div>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-rose-400 uppercase">Suspended/Banned</span>
            <p className="text-lg font-black text-rose-400">{suspendedUsersCount + bannedUsersCount}</p>
          </div>
          <Ban className="w-4 h-4 text-rose-400" />
        </div>
      </div>

      {/* Admin Navigation Pills / Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-sidebar-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
              <span>{item.label}</span>
              {item.count !== null && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    item.highlight
                      ? 'bg-amber-400 text-slate-950 animate-pulse'
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: OVERVIEW TAB */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase">Live Active Sessions</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <Wifi className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">{onlineUsersCount} Online</p>
              <p className="text-[11px] text-slate-400 mt-1">Real-time active web socket sessions</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase">Pending Activations</span>
                <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">{pendingActivations.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Requires admin approval</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase">API Keys Active</span>
                <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                  <Key className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-2">{apiKeys.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">REST SMS Gateway endpoints</p>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase">Open Support Chats</span>
                <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
                  <Headphones className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white mt-2">
                {supportTickets.filter((t) => t.status === 'Open').length}
              </p>
              <p className="text-[11px] text-purple-400 font-semibold mt-1">Live customer requests</p>
            </div>
          </div>

          {/* Quick Shortcuts to User Management */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Quick User Security & Real-Time Monitoring</span>
              </h3>
              <button
                onClick={() => setActiveSection('users')}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Users</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.slice(0, 3).map((u) => (
                <div key={u.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{u.name}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        u.isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      {u.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{u.email}</p>
                  <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    IP: {u.ipAddress || '103.114.98.24'} ({u.location || 'Bangladesh'})
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Master Key Gateway Quick Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Crown className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>মাস্টার কি কন্ট্রোল ও লাইভ এপিআই রুলস</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                    HOT
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  একটিমাত্র মাস্টার কি বসালেই সমস্ত লাইভ নাম্বার, এসএমএস রুলস এবং টেস্ট মেসেজ প্ল্যাটফর্মে ইনপুট হয়ে যাবে।
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSection('master_key')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950 flex items-center gap-2 cursor-pointer transition shrink-0"
            >
              <Key className="w-4 h-4" />
              <span>মাস্টার কি প্যানেলে যান</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: USER MANAGEMENT & SECURITY */}
      {activeSection === 'users' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>User Management & Security Control ({users.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time IP logs, live online activity, password resetting, personal notifications & account banning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <button
                onClick={() => setActiveSection('manual_create')}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by User Name, Email, IP Address or Country..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['All', 'Online', 'Active', 'Suspended', 'Banned'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                    filterStatus === st
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* User Table with IP, Password, Status, Actions */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-3">User & Identity</th>
                  <th className="py-3 px-3">IP Address & Location</th>
                  <th className="py-3 px-3">Live Status</th>
                  <th className="py-3 px-3">Password</th>
                  <th className="py-3 px-3">Balance</th>
                  <th className="py-3 px-3 text-right">Security Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{u.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold text-[9px]">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* IP & Location */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <p className="font-mono text-cyan-400 text-[11px] font-semibold flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {u.ipAddress || '103.114.98.24'}
                        </p>
                        <p className="text-[10px] text-slate-400">{u.location || 'Dhaka, Bangladesh'}</p>
                      </div>
                    </td>

                    {/* Live Online Tracking Status */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            u.isOnline
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                          {u.isOnline ? 'Online Now' : 'Offline'}
                        </span>
                        <p className="text-[10px] text-slate-500">{u.lastActive || 'Today'}</p>
                      </div>
                    </td>

                    {/* Password */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[11px]">
                          {u.pass}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedUserForPassword(u);
                            setNewPasswordInput('');
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer"
                          title="Change Password"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-emerald-400">${u.balance.toFixed(2)}</span>
                    </td>

                    {/* Actions: Notify, Suspend, Ban, Delete */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Personal Notification */}
                        <button
                          onClick={() => {
                            setSelectedUserForNotify(u);
                            setPersonalNotifTitle('');
                            setPersonalNotifMessage('');
                          }}
                          className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-800 text-blue-400 cursor-pointer"
                          title="Send Personal Notification"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspend Toggle */}
                        <button
                          onClick={() => handleSuspendUser(u.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                            u.status === 'Suspended'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Suspend Account"
                        >
                          {u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>

                        {/* Ban Toggle */}
                        <button
                          onClick={() => handleBanUser(u.id, u.email)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            u.status === 'Banned'
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-rose-950/50 hover:bg-rose-900 border-rose-900 text-rose-400'
                          }`}
                          title={u.status === 'Banned' ? 'Remove Ban' : 'Ban User from Website'}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Permanently */}
                        <button
                          onClick={() => handleDeleteUserPermanently(u.id, u.email)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Delete User Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: PENDING ACTIVATIONS QUEUE */}
      {activeSection === 'pending_activations' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Pending Account Activation Queue</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real-time queue of new users registered through the Activation Chatbot or Web portal.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-950 border border-amber-800 text-amber-400 font-bold rounded-xl text-xs">
              {pendingActivations.length} Pending
            </span>
          </div>

          {pendingActivations.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">No Pending Activations!</h4>
              <p className="text-xs text-slate-400">All registered user accounts are verified and approved.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingActivations.map((pending) => (
                <div
                  key={pending.id}
                  className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-lg border border-cyan-800">
                        {pending.id}
                      </span>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Awaiting Approval
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white">{pending.name}</h4>

                    <div className="space-y-1 text-xs text-slate-300">
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{pending.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400">Password:</span>
                        <span className="font-mono text-cyan-300">{pending.pass}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-400">IP:</span>
                        <span className="font-mono text-cyan-400">{pending.ipAddress || '103.205.71.18'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleApprovePendingUser(pending)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Account</span>
                    </button>
                    <button
                      onClick={() => handleRejectPendingUser(pending.id, pending.email)}
                      className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: MANUAL ACCOUNT CREATION */}
      {activeSection === 'manual_create' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-2xl mx-auto space-y-5">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <span>Manually Create & Activate New Account</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Admin can instantly provision users without waiting for manual verification steps.
            </p>
          </div>

          <form onSubmit={handleManualCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Master Reseller"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="e.g. client@reseller.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Custom Password</label>
                <input
                  type="text"
                  value={manualPass}
                  onChange={(e) => setManualPass(e.target.value)}
                  placeholder="e.g. SecretPass2026#"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Initial Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualBalance}
                  onChange={(e) => setManualBalance(e.target.value)}
                  placeholder="50.00"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-300">Location / Region</label>
                <input
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['User', 'VIP', 'Sub-Admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setManualRole(role)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      manualRole === role
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>CREATE & ACTIVATE ACCOUNT IMMEDIATELY</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 5: SUB-ADMIN ACCOUNTS */}
      {activeSection === 'sub_admins' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span>Sub-Admin Roles & Granular Permissions</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subAdmins.map((sub) => (
                <div key={sub.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{sub.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">{sub.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-extrabold">
                      {sub.role}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-300 pt-2 border-t border-slate-800">
                    <p className="font-bold text-slate-400 uppercase text-[10px]">Assigned Privileges:</p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <span className={sub.permissions.canApproveUsers ? 'text-emerald-400' : 'text-slate-600'}>
                        {sub.permissions.canApproveUsers ? '✓' : '✗'} Approve Users
                      </span>
                      <span className={sub.permissions.canManageNumbers ? 'text-emerald-400' : 'text-slate-600'}>
                        {sub.permissions.canManageNumbers ? '✓' : '✗'} Manage Numbers
                      </span>
                      <span className={sub.permissions.canEditApiKeys ? 'text-emerald-400' : 'text-slate-600'}>
                        {sub.permissions.canEditApiKeys ? '✓' : '✗'} API Keys
                      </span>
                      <span className={sub.permissions.canSendBroadcasts ? 'text-emerald-400' : 'text-slate-600'}>
                        {sub.permissions.canSendBroadcasts ? '✓' : '✗'} Broadcasts
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Sub Admin Form */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add New Sub-Admin</span>
            </h4>

            <form onSubmit={handleCreateSubAdmin} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="Sub Admin Name"
                  required
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="email"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={subRole}
                  onChange={(e) => setSubRole(e.target.value)}
                  placeholder="Designation Role"
                  className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subCanApprove}
                    onChange={(e) => setSubCanApprove(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Can Approve User Accounts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subCanNumbers}
                    onChange={(e) => setSubCanNumbers(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Can Manage Numbers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subCanBroadcast}
                    onChange={(e) => setSubCanBroadcast(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Can Send Broadcasts</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md mt-2"
              >
                Create Sub-Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION: MASTER KEY ROOT TELECOM INGESTION */}
      {activeSection === 'master_key' && (
        <MasterKeyManager onNotify={showToast} />
      )}

      {/* SECTION 6: API KEYS & GATEWAY */}
      {activeSection === 'apikeys' && (
        <div className="space-y-6">
          {/* Top Info & Quick Auto-Generate for Registered User */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <span>Developer & System API Gateway Keys</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-throughput REST API credentials and Webhook endpoints for automated SMS dispatch.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-xs self-start sm:self-auto">
                {apiKeys.length} Active Keys
              </span>
            </div>

            {/* Quick Generate for Specific User Email Input */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Sparkles className="w-4 h-4" />
                <span>Instant User API Key Provisioning (Email Driven)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enter any user email address below to automatically generate and assign a live SMS gateway API Key to their profile.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newKeyUser}
                    onChange={(e) => setNewKeyUser(e.target.value)}
                    placeholder="Enter user email (e.g. xzrmunna7788@gmail.com)..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key Label (Optional)"
                  className="sm:w-48 px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleGenerateApiKey(undefined, newKeyUser)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer shrink-0"
                >
                  <Key className="w-4 h-4" />
                  <span>Generate & Push Key</span>
                </button>
              </div>

              {/* Quick Preset Buttons for Registered Users */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Select:</span>
                {users.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setNewKeyUser(u.email);
                      setNewKeyName(`Gateway - ${u.name}`);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition cursor-pointer border border-slate-700"
                  >
                    {u.email}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Keys Table / Cards */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Active Provisioned Keys ({apiKeys.length})
              </span>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{key.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        {key.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {key.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-cyan-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 inline-block font-bold">
                        {key.key}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Assigned User: <strong className="text-cyan-300 font-mono">{key.user}</strong> · Rate Limit: {key.rateLimit} · Created: {key.created}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(key.key);
                        showToast('API Key copied to clipboard!');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => {
                        setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
                        showToast(`API Key ${key.name} revoked and deleted.`);
                      }}
                      className="p-2 rounded-xl bg-slate-850 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 cursor-pointer border border-slate-800"
                      title="Revoke / Delete Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: LIVE CHAT SUPPORT */}
      {activeSection === 'support' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Headphones className="w-5 h-5 text-purple-400" />
                <span>Live Chat Support & Ticket Desk</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Respond to inquiries and support chats sent by registered users.
              </p>
            </div>

            <div className="space-y-4">
              {supportTickets.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded-md border border-purple-800">
                        {t.id}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{t.subject}</h4>
                      <p className="text-xs text-slate-400">
                        From: <strong className="text-slate-200">{t.userName}</strong> ({t.userEmail}) · {t.timestamp}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        t.status === 'Open'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-200">
                    "{t.message}"
                  </div>

                  {t.replies && t.replies.length > 0 && (
                    <div className="space-y-1.5 pl-4 border-l-2 border-cyan-500">
                      {t.replies.map((r, i) => (
                        <p key={i} className="text-xs text-cyan-300 font-semibold bg-cyan-950/40 p-2 rounded-lg">
                          {r}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={replyText[t.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [t.id]: e.target.value })}
                      placeholder="Type admin response..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleReplyTicket(t.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: WEBSITE NOTICE BAR & UPDATES */}
      {activeSection === 'updates' && (
        <div className="space-y-6">
          {/* Live Dashboard Notice Bar Preview */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Live Dashboard Notice Bar Preview (ইউজারদের প্রদর্শিত নোটিশ বার)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ইউজাররা কর্নারের ক্রস (X) অপশনে চাপ দিয়ে এটি কেটে দিতে পারবে
              </span>
            </div>

            {(() => {
              const activeNotice = broadcasts.find((b) => b.active);
              if (!activeNotice) {
                return (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950 text-center text-xs text-slate-500">
                    বর্তমানে কোনো সক্রিয় নোটিশ বার চালু নেই (No active notice bar currently visible).
                  </div>
                );
              }
              return (
                <div className="px-3.5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-slate-200 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Megaphone className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-2 flex-wrap min-w-0 text-xs sm:text-sm">
                      <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {activeNotice.type || 'Notice'}
                      </span>
                      <span className="font-bold text-white truncate">
                        {activeNotice.title}
                      </span>
                      <span className="hidden sm:inline text-slate-500 font-bold">·</span>
                      <span className="text-slate-300 text-xs truncate max-w-sm sm:max-w-xl">
                        {activeNotice.message}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {activeNotice.createdAt && (
                      <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
                        {activeNotice.createdAt}
                      </span>
                    )}
                    <span className="p-1 rounded-lg text-slate-400 bg-slate-800/80 border border-slate-700 text-[10px] font-bold">
                      ✕ Cross Button
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Create & Post Website Update Banner Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-cyan-400" />
                  <span>Update & Publish Dashboard Notice Bar</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ছোট বর্ডারের ড্যাশবোর্ড নোটিশ বার আপডেট করুন। এখান থেকে আমাদের সকল আপডেট নোটিশ প্রদান করা যাবে।
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateBroadcastUpdate} className="space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300">Notice Title / Headline</label>
                  <input
                    type="text"
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    placeholder="e.g. System Notice: Dedicated US/BD Routes & Realtime Webhooks Active"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Notice Category</label>
                  <select
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="info">Information Notice</option>
                    <option value="warning">System Advisory</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="urgent">Urgent Announcement</option>
                  </select>
                </div>
              </div>

              {/* Message Details */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Notice Announcement Text / Content</label>
                <textarea
                  rows={3}
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Type notice message details (সকল আপডেট নোটিশ এখানে প্রদান করুন)..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Photo Upload & Visibility Switch Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Photo Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Attach Notice Photo / Banner (Optional)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-cyan-500 text-slate-300 text-xs font-bold cursor-pointer transition">
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>{updateImage ? 'Change Attached Photo' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {updateImage && (
                      <div className="relative">
                        <img
                          src={updateImage}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-xl border border-cyan-500 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => setUpdateImage('')}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visibility Switch */}
                <div className="space-y-1.5 sm:border-l sm:border-slate-800 sm:pl-4 flex flex-col justify-center">
                  <label className="text-xs font-bold text-slate-300">Live Notice Switch (Visibility)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setUpdateActive(!updateActive)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                        updateActive
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {updateActive ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-400" />
                          <span>LIVE & ACTIVE</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-slate-500" />
                          <span>OFFLINE / DRAFT</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {updateActive ? 'Visible to all users on Dashboard' : 'Hidden from users'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Post Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Save & Broadcast Notice Bar Now</span>
                </button>
              </div>
            </form>

            {/* List of Published Updates */}
            <div className="space-y-3 pt-4">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Published Updates & Announcements ({broadcasts.length})
              </span>
              {broadcasts.map((brd) => (
                <div
                  key={brd.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          brd.type === 'maintenance'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : brd.type === 'urgent'
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                        }`}
                      >
                        {brd.type}
                      </span>
                      <h4 className="text-sm font-bold text-white">{brd.title}</h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleEditBroadcast(brd)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer flex items-center gap-1"
                        title="Load into form to edit"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleBroadcastStatus(brd.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border flex items-center gap-1 ${
                          brd.active
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {brd.active ? <Check className="w-3 h-3" /> : null}
                        <span>{brd.active ? 'ACTIVE' : 'DISABLED'}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">{brd.createdAt}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBroadcast(brd.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-850 cursor-pointer"
                        title="Delete Update"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{brd.message}</p>

                  {brd.image && (
                    <div className="pt-2">
                      <img
                        src={brd.image}
                        alt={brd.title}
                        className="max-h-48 rounded-xl border border-slate-800 object-cover shadow-md"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: USER NOTIFICATIONS CENTER */}
      {activeSection === 'notifications' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <span>Dispatch User Notification (ইউজারকে মেসেজ ও নোটিফিকেশন আপডেট)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                এখানে কোনো ইউজারকে মেসেজ পাঠালে তা সরাসরি সেই ইউজারের টপবারের নোটিফিকেশন বেল আইকনে তাৎক্ষণিকভাবে যুক্ত হবে।
              </p>
            </div>

            <form onSubmit={handleDispatchNotification} className="space-y-3.5 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Recipient Selector */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select Target Recipient (মেসেজ প্রাপক নির্বাচন করুন)</span>
                  </label>
                  <select
                    value={globalNotifRecipient}
                    onChange={(e) => setGlobalNotifRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="all">📢 All Users (Broadcast to Every Dashboard)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.email}>
                        👤 {u.name} — {u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notification Category */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Category / Type</label>
                  <select
                    value={globalNotifType}
                    onChange={(e) => setGlobalNotifType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="info">Information (Info)</option>
                    <option value="success">Success / Confirmation</option>
                    <option value="warning">System Advisory</option>
                    <option value="error">Critical / Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Notification Title / Headline</label>
                <input
                  type="text"
                  value={globalNotifTitle}
                  onChange={(e) => setGlobalNotifTitle(e.target.value)}
                  placeholder="e.g. Account Notice: High-Speed Route Assigned"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Message Content</label>
                <textarea
                  rows={3}
                  value={globalNotifMessage}
                  onChange={(e) => setGlobalNotifMessage(e.target.value)}
                  placeholder="Type the message to be delivered into user's notification bell..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>DISPATCH NOTIFICATION TO USER (নোটিফিকেশন পাঠান)</span>
              </button>
            </form>
          </div>

          {/* Dispatched Notifications List */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Recent Dispatched Notifications ({dispatchedNotifs.length})
              </h4>
              <span className="text-[10px] text-slate-500">Live in user notification dropdown</span>
            </div>

            {dispatchedNotifs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                No dispatched notifications yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dispatchedNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 text-cyan-400">
                        <Bell className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">
                            {n.title}
                          </span>
                          <span className="px-2 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {n.recipient === 'all' || !n.recipient
                              ? 'To: All Users'
                              : `To: ${n.recipient}`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 break-words leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(n.id)}
                      className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 cursor-pointer transition"
                      title="Remove notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CHANGE / CREATE USER PASSWORD */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Reset / Change Password</h4>
                  <p className="text-[11px] text-slate-400">{selectedUserForPassword.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Current Password</label>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-400 flex items-center justify-between">
                  <span>{selectedUserForPassword.pass}</span>
                  <span className="text-[10px] text-slate-500">Live Database</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">New Password</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForPassword(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewPassword}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND PERSONAL NOTIFICATION */}
      {selectedUserForNotify && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Send Personal Notification</h4>
                  <p className="text-[11px] text-slate-400">To: {selectedUserForNotify.name} ({selectedUserForNotify.email})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForNotify(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Notification Title</label>
                <input
                  type="text"
                  value={personalNotifTitle}
                  onChange={(e) => setPersonalNotifTitle(e.target.value)}
                  placeholder="e.g. Your Dedicated SMS Route is Active"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Personal Message Details</label>
                <textarea
                  rows={3}
                  value={personalNotifMessage}
                  onChange={(e) => setPersonalNotifMessage(e.target.value)}
                  placeholder="Write direct message to this user..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForNotify(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendPersonalNotification}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Deliver Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
