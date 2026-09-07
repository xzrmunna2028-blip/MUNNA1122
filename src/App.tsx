import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Megaphone, X } from 'lucide-react';
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
import { AdminPanelView } from './components/AdminPanelView';
import { OtpSessionModal } from './components/OtpSessionModal';
import { YourMessagesModal } from './components/YourMessagesModal';

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
  emptyMetricData,
  emptyRealtimeCounters,
  sample7DaysData,
  sample30DaysData,
  sample90DaysData,
  sampleChart7Days,
  sampleChart30Days,
  sampleChart90Days,
  initialNotifications,
  initialMessageLogs,
} from './data/mockData';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('codeflow_theme');
    if (saved) return saved === 'dark';
    return false;
  });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30 days');

  // Your Messages Full Display White Interface Modal State
  const [isYourMessagesOpen, setIsYourMessagesOpen] = useState(false);
  const [yourMessagesFilter, setYourMessagesFilter] = useState<'all' | 'delivered' | 'failed' | 'today'>('all');
  const [yourMessagesTargetNumber, setYourMessagesTargetNumber] = useState<string | null>(null);

  // Deep OTP Session Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [modalInitialNumber, setModalInitialNumber] = useState<RentedNumber | null>(null);
  const [modalInitialLog, setModalInitialLog] = useState<RealSmsLog | null>(null);

  // Initialize storage on mount (ensuring zero demo messages and clean rented/test numbers)
  useEffect(() => {
    initRealtimeSmsStore();
    ensureDefaultRentedNumbers();
    ensureDefaultTestNumbers();
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
  
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('codeflow_logged_in') !== 'false';
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
  };
  
  // Default to false so initial view renders exact zero state with no mock/demo values
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('2:05:41 PM');
  const [isSimulating, setIsSimulating] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('codeflow_user_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'NOTIF-INIT-1',
        title: 'SMS Gateway System Ready',
        message: 'All carrier routes and live websocket listeners are operational.',
        time: 'Just now',
        read: false,
        type: 'info',
      },
    ];
  });

  const [broadcasts, setBroadcasts] = useState<any[]>(() => {
    const bData = localStorage.getItem('codeflow_broadcasts');
    if (bData) {
      try {
        return JSON.parse(bData);
      } catch (e) {}
    }
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

  const [dismissedNoticeId, setDismissedNoticeId] = useState<string | null>(() => {
    return localStorage.getItem('codeflow_dismissed_notice_id');
  });

  useEffect(() => {
    localStorage.setItem('codeflow_user_notifications', JSON.stringify(notifications));
  }, [notifications]);

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
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);

  // Synchronize state with real-time localStorage database
  useEffect(() => {
    // One-time cleanup to wipe out legacy mock/simulated data from previous testing runs
    const legacyCleared = localStorage.getItem('legacy_mock_cleared_v4');
    if (!legacyCleared) {
      localStorage.removeItem('rented_numbers');
      localStorage.removeItem('my_invoices_list');
      localStorage.setItem('real_sms_logs', JSON.stringify([]));
      localStorage.setItem('legacy_mock_cleared_v4', 'true');
    }

    const syncWithLocalStorage = () => {
      const existing = localStorage.getItem('real_sms_logs');
      const logs = existing ? JSON.parse(existing) : [];
      
      const total = logs.length;
      const delivered = logs.filter((l: any) => l.status === 'DELIVERED').length;
      const failed = logs.filter((l: any) => l.status === 'FAILED').length;
      
      setRealtimeCounters({
        totalMessages: total,
        delivered: delivered,
        failed: failed,
        charged: delivered,
      });

      // Map raw SMS logs to Dashboard MessageLog structures
      const mappedLogs: MessageLog[] = logs.slice(0, 15).map((l: any, idx: number) => {
        const timePart = l.timestamp ? new Date(l.timestamp).toTimeString().split(' ')[0] : 'Just now';
        return {
          id: `MSG-${10000 + idx}`,
          recipient: l.number,
          status: l.status,
          type: 'OTP',
          timestamp: timePart,
          cost: '$0.0000',
        };
      });
      setMessageLogs(mappedLogs);
    };

    syncWithLocalStorage();

    window.addEventListener('storage', syncWithLocalStorage);
    window.addEventListener('real_sms_updated', syncWithLocalStorage);
    return () => {
      window.removeEventListener('storage', syncWithLocalStorage);
      window.removeEventListener('real_sms_updated', syncWithLocalStorage);
    };
  }, []);

  // Update HTML root element dark class when darkMode state toggles
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Determine current metric data dynamically based on real-time logs
  const getActiveMetricData = (): MetricData => {
    const rawLogs = getRealSmsLogs();
    const totalCount = rawLogs.length;
    const deliveredCount = rawLogs.filter((l) => l.status === 'DELIVERED').length;
    const failedCount = rawLogs.filter((l) => l.status === 'FAILED').length;
    
    // Check messages today
    const todayPrefix = new Date().toISOString().split('T')[0];
    const todayCount = rawLogs.filter((l) => l.timestamp && l.timestamp.startsWith(todayPrefix)).length;

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

  // Open "Your Messages" full white interface display
  const handleOpenYourMessages = (
    filter: 'all' | 'delivered' | 'failed' | 'today' = 'all',
    number?: string | null
  ) => {
    setYourMessagesFilter(filter);
    setYourMessagesTargetNumber(number || null);
    setIsYourMessagesOpen(true);
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

  // Chart data calculation
  const getChartData = (): DailyChartPoint[] => {
    let baseChart: DailyChartPoint[];
    if (!isDemoMode) {
      baseChart = [
        { date: 'Sep 1', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 2', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 3', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 4', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 5', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 6', total: 0, delivered: 0, failed: 0 },
        { date: 'Sep 7', total: 0, delivered: 0, failed: 0 },
      ];
    } else {
      if (timePeriod === '7 days') baseChart = sampleChart7Days;
      else if (timePeriod === '90 days') baseChart = sampleChart90Days;
      else baseChart = sampleChart30Days;
    }

    return baseChart.map((pt, idx) => {
      if (idx === baseChart.length - 1) {
        return {
          ...pt,
          total: pt.total + realtimeCounters.totalMessages,
          delivered: pt.delivered + realtimeCounters.delivered,
          failed: pt.failed + realtimeCounters.failed,
        };
      }
      return pt;
    });
  };

  // Handle Refresh action
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString('en-US'));

      // Fetch existing logs from localStorage and notify other components
      window.dispatchEvent(new Event('real_sms_updated'));

      // Push a real-time sync completed notification
      const newNotification: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        title: 'Gateway Connection Synced',
        message: 'Successfully checked and synced SMS gateway status. Active channels are online.',
        time: 'Just now',
        read: false,
        type: 'info',
      };
      setNotifications((prev) => [newNotification, ...prev]);
    }, 600);
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
        {activeTab === 'admin_panel' ? (
          <AdminPanelView
            onBackToUserPanel={() => setActiveTab('dashboard')}
            darkMode={darkMode}
          />
        ) : activeTab === 'yourmessages' ? (
          <div className="space-y-6">
            <YourMessagesModal
              isOpen={true}
              inlineView={true}
              onClose={() => setActiveTab('dashboard')}
              initialFilter="all"
            />
          </div>
        ) : activeTab === 'activesms' ? (
          <ClientActiveSmsView />
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

            {/* 2. Middle Row: Realtime Counters & Traffic Trend Chart Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-1">
                <RealtimeCountersCard
                  counters={realtimeCounters}
                  onResetCounters={() => setRealtimeCounters(emptyRealtimeCounters)}
                  onCounterClick={(counterType) =>
                    handleOpenYourMessages(counterType === 'charged' ? 'all' : (counterType as any))
                  }
                />
              </div>
              <div className="lg:col-span-2">
                <TrafficChartCard
                  chartData={getChartData()}
                  isDemoMode={isDemoMode}
                />
              </div>
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

      {/* "Your Messages" Full White Interface Modal (Bordered Format) */}
      <YourMessagesModal
        isOpen={isYourMessagesOpen}
        onClose={() => setIsYourMessagesOpen(false)}
        initialFilter={yourMessagesFilter}
        targetNumber={yourMessagesTargetNumber}
      />

      {/* Global Real-time OTP Session Modal */}
      <OtpSessionModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        initialNumber={modalInitialNumber}
        initialLog={modalInitialLog}
      />
    </div>
  );
}
