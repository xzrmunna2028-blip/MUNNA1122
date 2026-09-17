import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Megaphone, X, RefreshCw, Database } from 'lucide-react';
import { TimeFilterBar } from './components/TimeFilterBar';
import { MetricCardsGrid } from './components/MetricCardsGrid';
import { RealtimeCountersCard } from './components/RealtimeCountersCard';
import { RevenueCard } from './components/RevenueCard';
import { BalanceCard } from './components/BalanceCard';
import { TrafficChartCard } from './components/TrafficChartCard';
import { MyNumbersView } from './components/MyNumbersView';
import { TestNumbersView } from './components/TestNumbersView';
import { SmsStatisticsView } from './components/SmsStatisticsView';
import { LiveTestSmsView } from './components/LiveTestSmsView';
import { SmsRecordsView } from './components/SmsRecordsView';
import { SidNotificationsView } from './components/SidNotificationsView';
import { MyInvoicesView } from './components/MyInvoicesView';
import { ClientActiveSmsView } from './components/ClientActiveSmsView';
import { SecurityView } from './components/SecurityView';
import { PaymentMethodsView } from './components/PaymentMethodsView';
import { ProfileView } from './components/ProfileView';
import { LoginView } from './components/LoginView';
import { OnboardingView } from './components/OnboardingView';
import { AdminPanelView } from './components/AdminPanelView';
import { OtpSessionModal } from './components/OtpSessionModal';
import { YourMessagesModal } from './components/YourMessagesModal';
import { WelcomeNoticeBanner } from './components/WelcomeNoticeBanner';

import {
  TimePeriod,
  MetricData,
  RealtimeCounters,
  NotificationItem,
  MessageLog,
  DailyChartPoint,
  RealSmsLog,
  RentedNumber,
} from './types';

import {
  initRealtimeSmsStore,
  ensureDefaultRentedNumbers,
  ensureDefaultTestNumbers,
  getRealSmsLogs,
} from './utils/realtimeSmsService';

import {
  syncUserWorkspaceFromServer,
  pushUserWorkspaceToServer,
} from './utils/userWorkspaceSync';

import { clientDb, doc, collection, onSnapshot, disableNetwork, enableNetwork } from './lib/firebaseClient';

import {
  emptyMetricData,
  emptyRealtimeCounters,
  sample7DaysData,
  sample30DaysData,
  sample90DaysData,
  sampleChart7Days,
  sampleChart30Days,
  sampleChart90Days,
} from './data/mockData';

const TAB_TO_HASH_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  profile: 'agent',
  live_test_sms: 'live-test',
  activesms: 'active-sms',
  mynumbers: 'my-numbers',
  test_numbers: 'test-numbers',
  statistics: 'statistics',
  sms_records: 'sms-records',
  sid_notifications: 'sid-notifications',
  my_invoices: 'my-invoices',
  security: 'security',
  payment_methods: 'payment-methods',
  admin_panel: 'admin',
  login: 'login',
  onboarding: 'onboarding',
};

const HASH_TO_TAB_MAP: Record<string, string> = {
  dashboard: 'dashboard',
  agent: 'profile',
  'agent-account': 'profile',
  profile: 'profile',
  'live-test': 'live_test_sms',
  live_test_sms: 'live_test_sms',
  'active-sms': 'activesms',
  activesms: 'activesms',
  'my-numbers': 'mynumbers',
  mynumbers: 'mynumbers',
  'test-numbers': 'test_numbers',
  test_numbers: 'test_numbers',
  statistics: 'statistics',
  'sms-records': 'sms_records',
  sms_records: 'sms_records',
  'sid-notifications': 'sid_notifications',
  sid_notifications: 'sid_notifications',
  'my-invoices': 'my_invoices',
  my_invoices: 'my_invoices',
  security: 'security',
  'payment-methods': 'payment_methods',
  payment_methods: 'payment_methods',
  admin: 'admin_panel',
  admin_panel: 'admin_panel',
  login: 'login',
  'create-account': 'login',
  createaccount: 'login',
  register: 'login',
  signup: 'login',
  onboarding: 'onboarding',
};

const getTabFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  const path = (window.location.pathname || '').toLowerCase();
  const rawHash = window.location.hash || '';
  const clean = rawHash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();

  if (
    clean.includes('onboarding') ||
    path.includes('/onboarding')
  ) {
    return 'onboarding';
  }

  if (
    clean.includes('create-account') ||
    clean.includes('createaccount') ||
    clean.includes('register') ||
    clean.includes('signup') ||
    path.includes('/create-account') ||
    path.includes('/register') ||
    path.includes('/login')
  ) {
    return 'login';
  }

  if (clean && HASH_TO_TAB_MAP[clean]) {
    return HASH_TO_TAB_MAP[clean];
  }
  return null;
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTabState] = useState<string>(() => {
    const fromUrl = getTabFromUrl();
    if (fromUrl) return fromUrl;
    return localStorage.getItem('codeflow_active_tab') || 'dashboard';
  });
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('codeflow_active_tab', tab);
    if (typeof window !== 'undefined') {
      const slug = TAB_TO_HASH_MAP[tab] || tab;
      const currentHash = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
      const currentToken = getOnboardingTokenFromUrl();
      if (currentHash !== slug && !currentToken) {
        window.history.replaceState(null, '', `/#/${slug}`);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const fromUrl = getTabFromUrl();
      if (fromUrl && fromUrl !== activeTab) {
        setActiveTabState(fromUrl);
        localStorage.setItem('codeflow_active_tab', fromUrl);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [activeTab]);

  useEffect(() => {
    const currentToken = getOnboardingTokenFromUrl();
    if (currentToken) return;
    const rawHash = (window.location.hash || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();
    if (
      rawHash.includes('create-account') ||
      rawHash.includes('register') ||
      rawHash.includes('signup') ||
      pathname.includes('create-account') ||
      pathname.includes('register') ||
      pathname.includes('signup')
    ) {
      return;
    }
    const slug = TAB_TO_HASH_MAP[activeTab] || activeTab;
    const currentHash = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0].trim().toLowerCase();
    if (currentHash !== slug) {
      window.history.replaceState(null, '', `/#/${slug}`);
    }
  }, [activeTab]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('codeflow_theme');
    if (saved) return saved === 'dark';
    return false;
  });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30 days');

  // Active SMS (Client Active SMS) initial filter for redirection
  const [activeSmsFilter, setActiveSmsFilter] = useState<'all' | 'delivered' | 'failed' | 'today' | null>(null);

  // Security Kickout & Ban Alert Modal
  const [kickedModal, setKickedModal] = useState<{ open: boolean; title: string; message: string } | null>(null);

  // Global Maintenance Mode State
  const [maintenanceState, setMaintenanceState] = useState<{
    enabled: boolean;
    title: string;
    message: string;
    estimatedEndTime?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('codeflow_maintenance_mode');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { enabled: false, title: 'System Maintenance', message: 'We are currently performing routine maintenance.' };
  });

  // IPRN Website Data Sync States
  const [syncedData, setSyncedData] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(() => localStorage.getItem('firebase_quota_exhausted') === 'true');

  useEffect(() => {
    if (isQuotaExhausted) {
      disableNetwork(clientDb).catch(() => {});
    } else {
      enableNetwork(clientDb).catch(() => {});
    }
  }, [isQuotaExhausted]);

  const fetchIprnMetrics = async (isManual = false) => {
    if (isManual) setIsSyncing(true);
    try {
      const res = await fetch(`/api/dashboard-metrics?userId=${encodeURIComponent(currentLoggedUser)}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        setSyncedData(json);
        
        // Dynamically track Firebase Firestore daily quota exhaustion
        if (json.firebase_quota_exhausted !== undefined) {
          const eq = !!json.firebase_quota_exhausted;
          setIsQuotaExhausted(eq);
          if (eq) {
            localStorage.setItem('firebase_quota_exhausted', 'true');
          } else {
            localStorage.removeItem('firebase_quota_exhausted');
          }
        }

        if (json.last_updated) {
          const d = new Date(json.last_updated);
          setLastSyncTime(d.toLocaleTimeString('en-US'));
        }
        if (isAdminUser) {
          if (json.metrics) {
            if (json.metrics.messages) localStorage.setItem('total_messages_stat', json.metrics.messages.toString());
            if (json.metrics.totalRanges) localStorage.setItem('ranges_stat', json.metrics.totalRanges.toString());
          }
          if (json.active_sms_logs && Array.isArray(json.active_sms_logs)) {
            localStorage.setItem('real_sms_logs', JSON.stringify(json.active_sms_logs));
            window.dispatchEvent(new Event('real_sms_updated'));
          }
          if (json.rented_numbers && Array.isArray(json.rented_numbers)) {
            localStorage.setItem('rented_numbers', JSON.stringify(json.rented_numbers));
            window.dispatchEvent(new Event('rented_numbers_updated'));
          }
        } else {
          // Regular user: do not overwrite local workspace with global logs
          const userNumRaw = localStorage.getItem(`rented_numbers_${currentLoggedUser}`);
          let userNums: string[] = [];
          if (userNumRaw) {
            try {
              const p = JSON.parse(userNumRaw);
              if (Array.isArray(p)) {
                userNums = p.map((n: any) => String(n.number || n).trim().replace(/[^0-9]/g, '')).filter(Boolean);
              }
            } catch(e) {}
          }
          if (json.active_sms_logs && Array.isArray(json.active_sms_logs) && userNums.length > 0) {
            const userMatched = json.active_sms_logs.filter((l: any) => {
              if (!l) return false;
              const clean = String(l.number || '').replace(/[^0-9]/g, '');
              return userNums.some(un => clean.includes(un) || un.includes(clean));
            });
            if (userMatched.length > 0) {
              localStorage.setItem(`real_sms_logs_${currentLoggedUser}`, JSON.stringify(userMatched));
              window.dispatchEvent(new Event('real_sms_updated'));
              window.dispatchEvent(new Event('user_sms_updated'));
            }
          }
        }
      }
    } catch (err: any) {
      // Graceful silent fallback to Firestore live subscription & localStorage
      console.warn('Dashboard metrics fetch notice (using real-time Firestore stream):', err?.message || err);
    } finally {
      if (isManual) setIsSyncing(false);
    }
  };

  const triggerIprnSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/trigger-sync', { 
         method: 'POST',
         headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSyncedData(json.data);
          
          // Dynamically track Firebase Firestore daily quota exhaustion
          if (json.data.firebase_quota_exhausted !== undefined) {
            const eq = !!json.data.firebase_quota_exhausted;
            setIsQuotaExhausted(eq);
            if (eq) {
              localStorage.setItem('firebase_quota_exhausted', 'true');
            } else {
              localStorage.removeItem('firebase_quota_exhausted');
            }
          }

          if (json.data.last_updated) {
            const d = new Date(json.data.last_updated);
            setLastSyncTime(d.toLocaleTimeString('en-US'));
          }
          if (isAdminUser) {
            if (json.data.metrics) {
              if (json.data.metrics.messages) localStorage.setItem('total_messages_stat', json.data.metrics.messages.toString());
              if (json.data.metrics.totalRanges) localStorage.setItem('ranges_stat', json.data.metrics.totalRanges.toString());
            }
            if (json.data.active_sms_logs && Array.isArray(json.data.active_sms_logs)) {
              localStorage.setItem('real_sms_logs', JSON.stringify(json.data.active_sms_logs));
              window.dispatchEvent(new Event('real_sms_updated'));
            }
            if (json.data.rented_numbers && Array.isArray(json.data.rented_numbers)) {
              localStorage.setItem('rented_numbers', JSON.stringify(json.data.rented_numbers));
              window.dispatchEvent(new Event('rented_numbers_updated'));
            }
          }
        }
        // Push a fresh notification
        const newNotif: NotificationItem = {
          id: `NOTIF-SYNC-${Date.now()}`,
          title: 'IPRN Real-Time Sync',
          message: json.message || 'Successfully synchronized metrics with IPRN API.',
          time: 'Just now',
          read: false,
          type: 'success',
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    } catch (err: any) {
      console.warn('Sync notice:', err?.message || err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchIprnMetrics();

    // Attach real-time Firestore listeners for immediate database updates across sessions
    let unsubscribeGlobal: (() => void) | null = null;

    if (!isQuotaExhausted) {
      try {
        // Global Metrics, Active Numbers & Real-Time SMS Doc Listener
        const globalDocRef = doc(clientDb, 'settings', 'global');
        unsubscribeGlobal = onSnapshot(globalDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const json = snapshot.data();
            if (json) {
              setSyncedData(json);
              if (json.last_updated) {
                const d = new Date(json.last_updated);
                setLastSyncTime(d.toLocaleTimeString('en-US'));
              }
              if (isAdminUser) {
                if (json.metrics) {
                  if (json.metrics.messages) localStorage.setItem('total_messages_stat', json.metrics.messages.toString());
                  if (json.metrics.totalRanges) localStorage.setItem('ranges_stat', json.metrics.totalRanges.toString());
                }
                if (json.active_sms_logs && Array.isArray(json.active_sms_logs)) {
                  localStorage.setItem('real_sms_logs', JSON.stringify(json.active_sms_logs));
                  window.dispatchEvent(new Event('real_sms_updated'));
                }
                if (json.rented_numbers && Array.isArray(json.rented_numbers)) {
                  localStorage.setItem('rented_numbers', JSON.stringify(json.rented_numbers));
                  window.dispatchEvent(new Event('rented_numbers_updated'));
                }
              } else {
                // Regular user: do not overwrite local workspace with global logs
                const userNumRaw = localStorage.getItem(`rented_numbers_${currentLoggedUser}`);
                let userNums: string[] = [];
                if (userNumRaw) {
                  try {
                    const p = JSON.parse(userNumRaw);
                    if (Array.isArray(p)) {
                      userNums = p.map((n: any) => String(n.number || n).trim().replace(/[^0-9]/g, '')).filter(Boolean);
                    }
                  } catch(e) {}
                }
                if (json.active_sms_logs && Array.isArray(json.active_sms_logs) && userNums.length > 0) {
                  const userMatched = json.active_sms_logs.filter((l: any) => {
                    if (!l) return false;
                    const clean = String(l.number || '').replace(/[^0-9]/g, '');
                    return userNums.some(un => clean.includes(un) || un.includes(clean));
                  });
                  if (userMatched.length > 0) {
                    localStorage.setItem(`real_sms_logs_${currentLoggedUser}`, JSON.stringify(userMatched));
                    window.dispatchEvent(new Event('real_sms_updated'));
                    window.dispatchEvent(new Event('user_sms_updated'));
                  }
                }
              }
            }
          }
        }, (error) => {
          if (unsubscribeGlobal) {
            try { unsubscribeGlobal(); } catch (_) {}
            unsubscribeGlobal = null;
          }
          const isExhausted = error?.message?.includes('RESOURCE_EXHAUSTED') || error?.code === 'resource-exhausted' || error?.message?.includes('Quota');
          if (isExhausted) {
            setIsQuotaExhausted(true);
            localStorage.setItem('firebase_quota_exhausted', 'true');
            disableNetwork(clientDb).catch(() => {});
          } else {
            console.warn('Real-time listener notice (falling back to REST sync):', error?.message || error);
          }
        });
      } catch (e) {
        console.warn('Firestore real-time subscription fallback:', e);
      }
    }

    // Establish real-time WebSocket connection to the backend server with automatic reconnection
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let failedWsAttempts = 0;
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

    const connectWebSocket = () => {
      if (isVercel) {
        // Vercel serverless environment does not support persistent WebSockets.
        // Smoothly operate with REST polling instead of throwing connection errors.
        setIsWsConnected(true);
        return;
      }

      if (failedWsAttempts >= 3) {
        return;
      }

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          failedWsAttempts = 0;
          setIsWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);

            // Handle real-time broadcast notices
            if (payload && (payload.type === 'broadcasts_updated' || payload.broadcasts)) {
              const bList = payload.broadcasts;
              if (Array.isArray(bList)) {
                setBroadcasts(bList);
                localStorage.setItem('codeflow_broadcasts', JSON.stringify(bList));
                localStorage.removeItem('codeflow_dismissed_notice_id');
                setDismissedNoticeId(null);
              }
            }

            // Handle real-time maintenance updates
            if (payload && (payload.type === 'maintenance_updated' || payload.maintenance)) {
              const maint = payload.maintenance;
              if (maint) {
                setMaintenanceState(maint);
                localStorage.setItem('codeflow_maintenance_mode', JSON.stringify(maint));
              }
            }

            // Handle real-time user status changes & kickout/ban detection
            if (payload && (payload.type === 'users_updated' || payload.type === 'user_pending_registered' || payload.registeredUsers)) {
              window.dispatchEvent(new CustomEvent('codeflow_users_updated', { detail: payload }));

              const myEmail = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
              if (myEmail && payload.users && Array.isArray(payload.users)) {
                const me = payload.users.find((u: any) => u.email?.toLowerCase().trim() === myEmail);
                if (me && (me.status === 'Banned' || me.status === 'Suspended')) {
                  localStorage.removeItem('codeflow_logged_in');
                  localStorage.removeItem('codeflow_user');
                  setIsLoggedIn(false);
                  setActiveTab('login');
                  setKickedModal({
                    open: true,
                    title: me.status === 'Banned' ? 'Account Banned' : 'Account Suspended',
                    message: `Your account status has been changed to ${me.status} by Administrator. Current session terminated immediately.`,
                  });
                }
              }
            }

            // Handle direct user kick / ban / deletion broadcast across all open tabs/devices
            if (payload && (payload.type === 'user_kicked' || payload.type === 'user_banned' || payload.type === 'user_deleted')) {
              const myEmail = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
              const targetKicked = (payload.kickedEmail || payload.bannedEmail || payload.deletedEmail || '').toLowerCase().trim();

              if (myEmail && targetKicked && myEmail === targetKicked) {
                localStorage.removeItem('codeflow_logged_in');
                localStorage.removeItem('codeflow_user');
                setIsLoggedIn(false);
                setActiveTab('login');
                setKickedModal({
                  open: true,
                  title: payload.type === 'user_banned' ? 'Account Banned' : payload.type === 'user_deleted' ? 'Account Deleted' : 'Session Terminated',
                  message: payload.reason === 'ACCOUNT_BANNED'
                    ? 'Your account has been banned by Administrator. Access is blocked.'
                    : payload.reason === 'ACCOUNT_SUSPENDED'
                    ? 'Your account has been suspended by Administrator.'
                    : payload.reason === 'ACCOUNT_DELETED'
                    ? 'Your account has been deleted by Administrator.'
                    : 'Your session was terminated by Administrator.',
                });
              }
            }

            // Handle real-time push notifications sent from admin to user
            if (payload && (payload.type === 'user_notification' || payload.notification)) {
              const notif = payload.notification;
              if (notif) {
                const target = (payload.targetEmail || notif.recipient || 'all').toLowerCase().trim();
                const myEmail = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
                if (target === 'all' || target === myEmail) {
                  setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
                  try {
                    const existing = localStorage.getItem('codeflow_user_notifications');
                    const parsed = existing ? JSON.parse(existing) : [];
                    localStorage.setItem('codeflow_user_notifications', JSON.stringify([notif, ...parsed.filter((n: any) => n.id !== notif.id)]));
                    window.dispatchEvent(new Event('codeflow_notifications_updated'));
                  } catch (e) {}
                }
              }
            }

            // Handle real-time user workspace synchronization across sessions/devices
            if (payload && payload.type === 'user_workspace_updated') {
              const targetEmail = (payload.email || '').toLowerCase().trim();
              const myEmail = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
              if (targetEmail && targetEmail === myEmail && payload.workspace) {
                const ws = payload.workspace;
                if (Array.isArray(ws.rented_numbers)) {
                  localStorage.setItem('rented_numbers', JSON.stringify(ws.rented_numbers));
                  window.dispatchEvent(new Event('rented_numbers_updated'));
                }
                if (Array.isArray(ws.test_numbers)) {
                  localStorage.setItem('test_numbers', JSON.stringify(ws.test_numbers));
                  window.dispatchEvent(new Event('test_numbers_updated'));
                }
                if (Array.isArray(ws.sms_logs)) {
                  localStorage.setItem('real_sms_logs', JSON.stringify(ws.sms_logs));
                  window.dispatchEvent(new Event('real_sms_updated'));
                }
                if (Array.isArray(ws.notifications)) {
                  localStorage.setItem('codeflow_user_notifications', JSON.stringify(ws.notifications));
                  window.dispatchEvent(new Event('codeflow_notifications_updated'));
                }
              }
            }

            if (payload && (payload.type === 'snapshot' || payload.type === 'update')) {
              const json = payload.data;
              if (json) {
                setSyncedData(json);
                if (json.last_updated) {
                  const d = new Date(json.last_updated);
                  setLastSyncTime(d.toLocaleTimeString('en-US'));
                }
                if (isAdminUser) {
                  if (json.metrics) {
                    if (json.metrics.messages) localStorage.setItem('total_messages_stat', json.metrics.messages.toString());
                    if (json.metrics.totalRanges) localStorage.setItem('ranges_stat', json.metrics.totalRanges.toString());
                  }
                  if (json.active_sms_logs && Array.isArray(json.active_sms_logs)) {
                    localStorage.setItem('real_sms_logs', JSON.stringify(json.active_sms_logs));
                    window.dispatchEvent(new Event('real_sms_updated'));
                  }
                  if (json.rented_numbers && Array.isArray(json.rented_numbers)) {
                    localStorage.setItem('rented_numbers', JSON.stringify(json.rented_numbers));
                    window.dispatchEvent(new Event('rented_numbers_updated'));
                  }
                } else {
                  // Regular user
                  const userNumRaw = localStorage.getItem(`rented_numbers_${currentLoggedUser}`);
                  let userNums: string[] = [];
                  if (userNumRaw) {
                    try {
                      const p = JSON.parse(userNumRaw);
                      if (Array.isArray(p)) {
                        userNums = p.map((n: any) => String(n.number || n).trim().replace(/[^0-9]/g, '')).filter(Boolean);
                      }
                    } catch(e) {}
                  }
                  if (json.active_sms_logs && Array.isArray(json.active_sms_logs) && userNums.length > 0) {
                    const userMatched = json.active_sms_logs.filter((l: any) => {
                      if (!l) return false;
                      const clean = String(l.number || '').replace(/[^0-9]/g, '');
                      return userNums.some(un => clean.includes(un) || un.includes(clean));
                    });
                    if (userMatched.length > 0) {
                      localStorage.setItem(`real_sms_logs_${currentLoggedUser}`, JSON.stringify(userMatched));
                      window.dispatchEvent(new Event('real_sms_updated'));
                      window.dispatchEvent(new Event('user_sms_updated'));
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('[WebSocketClient] Error parsing message:', err);
          }
        };

        socket.onclose = () => {
          failedWsAttempts++;
          setIsWsConnected(false);
          if (failedWsAttempts < 3) {
            reconnectTimeout = setTimeout(connectWebSocket, 10000);
          }
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (err) {
        console.warn('[WebSocketClient] Connection failed:', err);
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Poll for real-time API metrics synchronization every 12 seconds as backup
    const interval = setInterval(() => {
      fetchIprnMetrics();
    }, 12000);

    return () => {
      if (unsubscribeGlobal) unsubscribeGlobal();
      clearInterval(interval);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [isQuotaExhausted]);

  // Deep OTP Session Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [modalInitialNumber, setModalInitialNumber] = useState<RentedNumber | null>(null);
  const [modalInitialLog, setModalInitialLog] = useState<RealSmsLog | null>(null);

  // Initialize storage on mount (ensuring clean rented/test numbers)
  useEffect(() => {
    initRealtimeSmsStore();
    ensureDefaultRentedNumbers();
    ensureDefaultTestNumbers();

    // Purge any legacy demo broadcast announcements or notifications
    try {
      localStorage.removeItem('user_sms_logs');
      localStorage.removeItem('real_sms_logs');
      localStorage.removeItem('total_messages_stat');
      localStorage.removeItem('ranges_stat');

      const user = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
      if (user) {
        const userNumRaw = localStorage.getItem(`rented_numbers_${user}`);
        if (!userNumRaw || userNumRaw === '[]') {
          localStorage.removeItem(`real_sms_logs_${user}`);
        }
      }

      const bData = localStorage.getItem('codeflow_broadcasts');
      if (bData && (bData.includes('BRD-1') || bData.includes('SMS Gateway System v3.4.0 Live'))) {
        localStorage.removeItem('codeflow_broadcasts');
        setBroadcasts([]);
      }
      const nData = localStorage.getItem('codeflow_user_notifications');
      if (nData && (nData.includes('NOTIF-INIT-1') || nData.includes('SMS Gateway System Ready'))) {
        localStorage.removeItem('codeflow_user_notifications');
        setNotifications([]);
      }
    } catch (e) {}
  }, []);

  // Synchronize Dark Mode with DOM and localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('codeflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('codeflow_theme', 'light');
    }
  }, [darkMode]);
  
  // Authentication State - secure real-time authentication lock
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('codeflow_logged_in') === 'true';
  });

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('login');
    localStorage.setItem('codeflow_logged_in', 'false');
  };

  const handleLoginSuccess = (user: string) => {
    setIsLoggedIn(true);
    setActiveTab('dashboard');
    localStorage.setItem('codeflow_logged_in', 'true');
    localStorage.setItem('codeflow_user', user);
    syncUserWorkspaceFromServer(user);
  };
  
  const currentLoggedUser = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
  const isAdminUser = currentLoggedUser === 'xzrmunna7788@gmail.com' || currentLoggedUser === 'xzrmunna7788';

  // Real-Time Workspace Synchronization Across Devices & Server Restarts
  useEffect(() => {
    if (currentLoggedUser) {
      syncUserWorkspaceFromServer(currentLoggedUser);
    }

    let saveTimeout: any = null;
    const handleDataChanged = () => {
      if (!currentLoggedUser) return;
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        pushUserWorkspaceToServer(currentLoggedUser);
      }, 300);
    };

    window.addEventListener('rented_numbers_updated', handleDataChanged);
    window.addEventListener('test_numbers_updated', handleDataChanged);
    window.addEventListener('real_sms_updated', handleDataChanged);
    window.addEventListener('codeflow_notifications_updated', handleDataChanged);
    window.addEventListener('codeflow_profile_updated', handleDataChanged);

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout);
      window.removeEventListener('rented_numbers_updated', handleDataChanged);
      window.removeEventListener('test_numbers_updated', handleDataChanged);
      window.removeEventListener('real_sms_updated', handleDataChanged);
      window.removeEventListener('codeflow_notifications_updated', handleDataChanged);
      window.removeEventListener('codeflow_profile_updated', handleDataChanged);
    };
  }, [currentLoggedUser]);

  // Security Lock Guard: Redirect non-admin users away from admin panel
  useEffect(() => {
    if (activeTab === 'admin_panel' && !isAdminUser) {
      console.warn('[Security Shield] Unauthorized access attempt to Admin Panel blocked.');
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdminUser]);

  // isDemoMode is completely and permanently disabled - pure live IPRN API data
  const isDemoMode = false;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('2:05:41 PM');
  const [isSimulating, setIsSimulating] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('codeflow_user_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some((n: any) => n.id === 'NOTIF-INIT-1')) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const [broadcasts, setBroadcasts] = useState<any[]>(() => {
    const bData = localStorage.getItem('codeflow_broadcasts');
    if (bData) {
      try {
        const parsed = JSON.parse(bData);
        if (Array.isArray(parsed) && !parsed.some((b: any) => b.id === 'BRD-1')) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const [dismissedNoticeId, setDismissedNoticeId] = useState<string | null>(() => {
    return localStorage.getItem('codeflow_dismissed_notice_id');
  });

  useEffect(() => {
    localStorage.setItem('codeflow_user_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    // Initial fetch of Broadcast Notices from permanent server endpoint
    fetch('/api/broadcasts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.broadcasts)) {
          setBroadcasts(data.broadcasts);
          localStorage.setItem('codeflow_broadcasts', JSON.stringify(data.broadcasts));
        }
      })
      .catch((e) => console.warn('[Broadcasts] Initial fetch notice:', e));
  }, []);

  useEffect(() => {
    const handleNotifUpdate = () => {
      const saved = localStorage.getItem('codeflow_user_notifications');
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {}
      }
    };
    const handleBroadcastUpdate = () => {
      const bData = localStorage.getItem('codeflow_broadcasts');
      if (bData) {
        try {
          setBroadcasts(JSON.parse(bData));
        } catch (e) {}
      }
      setDismissedNoticeId(localStorage.getItem('codeflow_dismissed_notice_id'));
    };

    window.addEventListener('codeflow_notifications_updated', handleNotifUpdate);
    window.addEventListener('codeflow_broadcasts_updated', handleBroadcastUpdate);
    window.addEventListener('storage', handleNotifUpdate);
    window.addEventListener('storage', handleBroadcastUpdate);

    return () => {
      window.removeEventListener('codeflow_notifications_updated', handleNotifUpdate);
      window.removeEventListener('codeflow_broadcasts_updated', handleBroadcastUpdate);
      window.removeEventListener('storage', handleNotifUpdate);
      window.removeEventListener('storage', handleBroadcastUpdate);
    };
  }, []);

  const activeNotice = broadcasts.find((b) => b.active);

  const handleDismissNotice = (noticeId: string) => {
    localStorage.setItem('codeflow_dismissed_notice_id', noticeId);
    setDismissedNoticeId(noticeId);
  };

  const [realtimeCounters, setRealtimeCounters] = useState<RealtimeCounters>(emptyRealtimeCounters);

  const activeRealtimeCounters = useMemo(() => {
    return {
      totalMessages: realtimeCounters.totalMessages,
      delivered: realtimeCounters.delivered,
      failed: realtimeCounters.failed,
      charged: realtimeCounters.totalMessages,
    };
  }, [realtimeCounters]);

  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);

  // Synchronize state with real-time user_sms_logs database
  useEffect(() => {
    const syncWithLocalStorage = () => {
      const userNumRaw = localStorage.getItem(`rented_numbers_${currentLoggedUser}`);
      let userNums: string[] = [];
      if (userNumRaw) {
        try {
          const p = JSON.parse(userNumRaw);
          if (Array.isArray(p)) {
            userNums = p.map((n: any) => String(n.number || n).trim().replace(/[^0-9]/g, '')).filter(Boolean);
          }
        } catch(e) {}
      }

      let logs: any[] = [];
      if (userNums.length > 0) {
        const userSaved = localStorage.getItem(`real_sms_logs_${currentLoggedUser}`);
        if (userSaved) {
          try {
            const parsed = JSON.parse(userSaved);
            if (Array.isArray(parsed)) {
              logs = parsed.filter((l: any) => {
                if (!l) return false;
                const clean = String(l.number || '').replace(/[^0-9]/g, '');
                return userNums.some(un => clean.includes(un) || un.includes(clean));
              });
            }
          } catch(e) {}
        }
      }
      
      const total = logs.length;
      const delivered = logs.filter((l: any) => l.status === 'DELIVERED').length;
      const failed = logs.filter((l: any) => l.status === 'FAILED').length;
      
      setRealtimeCounters({
        totalMessages: total,
        delivered: delivered,
        failed: failed,
        charged: total,
      });

      // Map raw user SMS logs to Dashboard MessageLog structures
      const mappedLogs: MessageLog[] = logs.slice(0, 15).map((l: any, idx: number) => {
        const timePart = l.timestamp ? new Date(l.timestamp).toTimeString().split(' ')[0] : 'Just now';
        return {
          id: `MSG-${10000 + idx}`,
          recipient: l.number,
          status: l.status,
          type: 'OTP',
          timestamp: timePart,
          cost: l.cost || '0.0096 USD',
        };
      });
      setMessageLogs(mappedLogs);
    };

    syncWithLocalStorage();

    window.addEventListener('storage', syncWithLocalStorage);
    window.addEventListener('user_sms_updated', syncWithLocalStorage);
    window.addEventListener('real_sms_updated', syncWithLocalStorage);
    return () => {
      window.removeEventListener('storage', syncWithLocalStorage);
      window.removeEventListener('user_sms_updated', syncWithLocalStorage);
      window.removeEventListener('real_sms_updated', syncWithLocalStorage);
    };
  }, [isAdminUser, currentLoggedUser]);

  // Update HTML root element dark class when darkMode state toggles
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Helper to retrieve strictly user-scoped active logs based on user's rented numbers
  const getUserActiveLogs = (): any[] => {
    if (!currentLoggedUser) return [];

    const userNumRaw = localStorage.getItem(`rented_numbers_${currentLoggedUser}`);
    let userNums: string[] = [];
    if (userNumRaw) {
      try {
        const p = JSON.parse(userNumRaw);
        if (Array.isArray(p)) {
          userNums = p.map((n: any) => String(n.number || n).trim().replace(/[^0-9]/g, '')).filter(Boolean);
        }
      } catch (e) {}
    }

    // Every user without rented numbers strictly starts at 0
    if (userNums.length === 0) return [];

    const userSaved = localStorage.getItem(`real_sms_logs_${currentLoggedUser}`);
    if (userSaved) {
      try {
        const parsed = JSON.parse(userSaved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: any) => {
            if (!l) return false;
            const clean = String(l.number || '').replace(/[^0-9]/g, '');
            return userNums.some(un => clean.includes(un) || un.includes(clean));
          });
        }
      } catch (e) {}
    }
    return [];
  };

  // Determine current metric data dynamically based on user's personal logs
  const getActiveMetricData = (): MetricData => {
    const logs = getUserActiveLogs();
    const totalCount = logs.length;
    const deliveredCount = logs.filter((l: any) => l.status === 'DELIVERED').length;
    const failedCount = logs.filter((l: any) => l.status === 'FAILED').length;
    
    // Check messages today
    const todayPrefix = new Date().toISOString().split('T')[0];
    const todayCount = logs.filter((l: any) => l.timestamp && l.timestamp.startsWith(todayPrefix)).length;

    const rate = totalCount > 0 ? parseFloat(((deliveredCount / totalCount) * 100).toFixed(1)) : 0;
    const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });

    return {
      messages: totalCount,
      delivered: deliveredCount,
      failed: failedCount,
      todayCount: todayCount,
      deliveryRate: rate,
      todayDate: today,
    };
  };

  const metricData = getActiveMetricData();

  // Open "Your Messages" full white interface display inside Client Active SMS
  const handleOpenYourMessages = (
    filter: 'all' | 'delivered' | 'failed' | 'today' = 'all'
  ) => {
    setActiveSmsFilter(filter);
    setActiveTab('activesms');
  };

  // Deep OTP Session Handlers
  const handleOpenOtpSession = (type?: string, number?: RentedNumber, log?: RealSmsLog) => {
    if (log) {
      setModalInitialLog(log);
      setModalInitialNumber(null);
    } else if (number) {
      setModalInitialNumber(number);
      setModalInitialLog(null);
    } else {
      const logs = getRealSmsLogs();
      if (logs.length > 0) {
        setModalInitialLog(logs[0]);
        setModalInitialNumber(null);
      } else {
        const numbers = ensureDefaultRentedNumbers();
        setModalInitialNumber(numbers[0] || null);
        setModalInitialLog(null);
      }
    }
    setIsOtpModalOpen(true);
  };

  // Chart data calculation - strictly derived from user personal logs
  const getChartData = (): DailyChartPoint[] => {
    const logs = getUserActiveLogs();

    const now = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return {
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isoPrefix: d.toISOString().split('T')[0]
      };
    });

    return dates.map(({ dateStr, isoPrefix }) => {
      const dayLogs = logs.filter(l => l.timestamp && l.timestamp.startsWith(isoPrefix));
      return {
        date: dateStr,
        total: dayLogs.length,
        delivered: dayLogs.filter(l => l.status === 'DELIVERED').length,
        failed: dayLogs.filter(l => l.status === 'FAILED').length,
      };
    });
  };

  // Handle Refresh action - directly triggers live IPRN API synchronization
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerIprnSync();
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString('en-US'));
      window.dispatchEvent(new Event('real_sms_updated'));
      window.dispatchEvent(new Event('rented_numbers_updated'));
    } catch (e) {
      console.error('Refresh sync error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Send a simulated message
  const handleSendSimulatedMsg = (
    recipient: string,
    type: 'Transactional' | 'OTP' | 'Marketing'
  ) => {
    const isSuccess = Math.random() > 0.08; // 92% success rate
    const now = new Date();

    const routeMapping = {
      'Transactional': 'United Kingdom - Vodafone',
      'OTP': 'Bangladesh - Grameenphone',
      'Marketing': 'Algeria - Mobilis 101'
    };

    const newLog = {
      timestamp: now.toISOString(),
      status: isSuccess ? 'DELIVERED' : 'FAILED',
      termination: routeMapping[type] || 'Bangladesh - Grameenphone',
      number: recipient.replace(/\s+/g, ''),
      sid: type === 'OTP' ? 'QuickOTP' : 'KsiSms'
    };

    const existing = localStorage.getItem('real_sms_logs');
    const parsed = existing ? JSON.parse(existing) : [];
    const updated = [newLog, ...parsed];
    localStorage.setItem('real_sms_logs', JSON.stringify(updated));

    // Notify other components (statistics, records)
    window.dispatchEvent(new Event('real_sms_updated'));
  };

  // Auto traffic simulation loop is disabled to ensure 100% real-time data ONLY

  // Check for onboarding token in search, hash or full URL
  const getOnboardingTokenFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const href = window.location.href || '';
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      const searchParams = new URLSearchParams(search);
      let token = searchParams.get('token') || searchParams.get('ref') || searchParams.get('code');
      if (token && token.trim()) return token.trim();

      if (hash.includes('?')) {
        const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?') + 1));
        token = hashParams.get('token') || hashParams.get('ref') || hashParams.get('code');
        if (token && token.trim()) return token.trim();
      }

      const fullMatch = href.match(/[?&#](?:token|ref|code)=([a-zA-Z0-9_-]+)/i);
      if (fullMatch && fullMatch[1]) return fullMatch[1].trim();

      const lowerHash = hash.toLowerCase();
      const lowerHref = href.toLowerCase();
      if (
        lowerHash.includes('onboarding') ||
        lowerHash.includes('create-account') ||
        lowerHash.includes('createaccount') ||
        lowerHash.includes('register') ||
        lowerHash.includes('signup') ||
        lowerHash.includes('portal') ||
        lowerHash.includes('access') ||
        lowerHash.includes('connect') ||
        lowerHash.includes('auth-direct') ||
        lowerHash.includes('vip') ||
        lowerHref.includes('onboarding') ||
        lowerHref.includes('create-account') ||
        lowerHref.includes('createaccount') ||
        lowerHref.includes('register') ||
        lowerHref.includes('signup') ||
        lowerHref.includes('token=')
      ) {
        return 'inv_active_onboarding';
      }
    } catch (e) {
      console.warn('Error reading token from URL:', e);
    }
    return null;
  };

  const [onboardingToken, setOnboardingToken] = useState<string | null>(() => getOnboardingTokenFromUrl());

  useEffect(() => {
    const handleUrlChange = () => {
      const token = getOnboardingTokenFromUrl();
      setOnboardingToken(token);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // If user arrives via a 5-minute onboarding invitation link, render the 4-Step Onboarding view
  if (onboardingToken) {
    return (
      <OnboardingView
        token={onboardingToken}
        onComplete={(userEmail, userName) => {
          setOnboardingToken(null);
          window.location.hash = '';
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url.pathname);

          // Mark user as logged in
          localStorage.setItem('codeflow_logged_in', 'true');
          localStorage.setItem('codeflow_user', userEmail);
          localStorage.setItem('codeflow_username', userName);
          setIsLoggedIn(true);
          setActiveTab('dashboard');
        }}
        onGoToLogin={() => {
          setOnboardingToken(null);
          window.location.hash = '';
          const url = new URL(window.location.href);
          url.searchParams.delete('token');
          window.history.replaceState({}, '', url.pathname);
          setIsLoggedIn(false);
          setActiveTab('login');
        }}
        darkMode={darkMode}
      />
    );
  }

  // Render Login Screen if user is logged out or on 'login' tab
  if (!isLoggedIn || activeTab === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-[#f1f5f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200`}>
      {/* Navigation Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        notifications={notifications}
        setNotifications={setNotifications}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isWsConnected={isWsConnected}
      />

      {/* Drawer Sidebar */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'admin_panel' && isAdminUser ? (
          <AdminPanelView
            onBackToUserPanel={() => setActiveTab('dashboard')}
            darkMode={darkMode}
          />
        ) : activeTab === 'activesms' ? (
          <ClientActiveSmsView
            initialFilter={activeSmsFilter}
            onClearFilter={() => setActiveSmsFilter(null)}
          />
        ) : activeTab === 'mynumbers' ? (
          <MyNumbersView />
        ) : activeTab === 'test_numbers' ? (
          <TestNumbersView />
        ) : activeTab === 'statistics' ? (
          <SmsStatisticsView />
        ) : activeTab === 'live_test_sms' ? (
          <LiveTestSmsView />
        ) : activeTab === 'sms_records' ? (
          <SmsRecordsView />
        ) : activeTab === 'sid_notifications' ? (
          <SidNotificationsView />
        ) : activeTab === 'my_invoices' ? (
          <MyInvoicesView />
        ) : activeTab === 'security' ? (
          <SecurityView />
        ) : activeTab === 'payment_methods' ? (
          <PaymentMethodsView />
        ) : activeTab === 'profile' ? (
          <ProfileView onNavigate={(tab) => setActiveTab(tab)} />
        ) : (
          <>
            {/* Sleek, Compact Notice Bar with Small Border & Corner Close ('X') Button */}
            {activeNotice && dismissedNoticeId !== activeNotice.id && (
              <div
                id="dashboard-notice-bar"
                className="mb-4 sm:mb-5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-cyan-500/40 dark:border-cyan-500/30 bg-cyan-50/80 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-xs flex items-center justify-between gap-3 animate-fade-in"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    <Megaphone className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-2 flex-wrap min-w-0 text-xs sm:text-sm">
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                      {activeNotice.type || 'Notice'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {activeNotice.title}
                    </span>
                    <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-bold">·</span>
                    <span className="text-slate-600 dark:text-slate-300 text-xs truncate max-w-sm sm:max-w-xl">
                      {activeNotice.message}
                    </span>
                    {activeNotice.image && (
                      <a
                        href={activeNotice.image}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold border border-cyan-500/30 transition"
                        title="View Notice Attachment Photo"
                      >
                        <img
                          src={activeNotice.image}
                          alt="Notice"
                          className="w-3.5 h-3.5 object-cover rounded"
                        />
                        <span>View Photo</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {activeNotice.createdAt && (
                    <span className="hidden md:inline-block text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {activeNotice.createdAt}
                    </span>
                  )}
                  <button
                    type="button"
                    id="btn-dismiss-notice-bar"
                    onClick={() => handleDismissNotice(activeNotice.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Dismiss Notice"
                    aria-label="Dismiss Notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Top Time Filter Bar & Title */}
            <TimeFilterBar
              timePeriod={timePeriod}
              setTimePeriod={setTimePeriod}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              lastRefreshed={lastRefreshed}
            />

            {/* 1. Top Compact Metric Cards Grid (Tap opens "Your Messages" full white interface) */}
            <MetricCardsGrid
              data={metricData}
              onCardClick={(type) => handleOpenYourMessages(type as any)}
            />

            {/* 2. Middle Row: Traffic Trend Chart */}
            <div className="mb-6">
              <TrafficChartCard
                chartData={getChartData()}
                isDemoMode={isDemoMode}
              />
            </div>

            {/* 3. Bottom Row: Revenue by Currency & Available Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RevenueCard
                isDemoMode={isDemoMode}
                totalMessages={metricData.messages}
              />

              <BalanceCard isDemoMode={isDemoMode} />
            </div>
          </>
        )}
      </main>

      {/* Global Real-time OTP Session Modal */}
      <OtpSessionModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        initialNumber={modalInitialNumber}
        initialLog={modalInitialLog}
      />

      {/* Global Welcome / Telegram Updates Notice Popup Banner */}
      <WelcomeNoticeBanner darkMode={darkMode} />

      {/* Global Maintenance Mode Lock Screen for Non-Admin Users */}
      {maintenanceState.enabled && !isAdminUser && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-5 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
                System Under Maintenance
              </span>
              <h2 className="text-2xl font-black text-white">{maintenanceState.title || 'Scheduled System Maintenance'}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                {maintenanceState.message || 'We are currently upgrading server systems and database optimizations. Access will resume shortly.'}
              </p>
              {maintenanceState.estimatedEndTime && (
                <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-amber-300/90 font-mono">
                  Estimated Completion: {maintenanceState.estimatedEndTime}
                </div>
              )}
            </div>
            <div className="pt-2 text-xs text-slate-500">
              Live updates are running automatically. You do not need to refresh.
            </div>
          </div>
        </div>
      )}

      {/* Kickout / Ban Real-Time Notice Modal */}
      {kickedModal?.open && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <X className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{kickedModal.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{kickedModal.message}</p>
            </div>
            <button
              onClick={() => {
                setKickedModal(null);
                setActiveTab('login');
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Acknowledge & Return to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
