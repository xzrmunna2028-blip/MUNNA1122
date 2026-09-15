import React, { useState } from 'react';
import { getUserDisplayName } from '../utils/userProfileHelper';
import {
  Menu,
  Moon,
  Sun,
  Bell,
  X,
  User,
  CreditCard,
  Shield,
  LogOut,
  CheckCircle,
  AlertCircle,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { NotificationItem } from '../types';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onLogout?: () => void;
  isWsConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  setDarkMode,
  notifications,
  setNotifications,
  activeTab,
  setActiveTab,
  onLogout,
  isWsConnected = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const currentLoggedUser = (localStorage.getItem('codeflow_user') || 'xzrmunna7788@gmail.com').trim();
  const isAdminUser =
    currentLoggedUser.toLowerCase() === 'xzrmunna7788@gmail.com' ||
    currentLoggedUser.toLowerCase() === 'xzrmunna7788';

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('codeflow_user_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markSingleRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('codeflow_user_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'security':
        return 'Security Settings';
      case 'payment_methods':
        return 'Payment Methods';
      case 'profile':
        return 'My Profile';
      case 'activesms':
        return 'Client Active SMS';
      case 'mynumbers':
        return 'My Numbers';
      case 'statistics':
        return 'My SMS Statistics';
      case 'live_test_sms':
        return 'Live Test SMS';
      case 'test_numbers':
        return 'Test Numbers';
      case 'sms_records':
        return 'SMS Records';
      case 'sid_notifications':
        return 'SID Notifications';
      case 'my_invoices':
        return 'My Invoices';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Hamburger & App Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {getHeaderTitle()}
            </h1>
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isWsConnected 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              {isWsConnected ? 'WebSocket Live' : 'Connecting WebSocket...'}
            </span>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markSingleRead(n.id)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                          !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'success' && (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                          {n.type === 'warning' && (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          {n.type === 'info' && (
                            <Activity className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            {n.recipient && n.recipient !== 'all' && (
                              <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                Direct
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {n.time}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Badge / Avatar (Matches Green Box icon 'X' from screenshot) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
              title="User Profile Menu"
            >
              {/* Green square avatar with X inside as shown in screenshot top right */}
              <div className="w-8 h-8 rounded-lg bg-lime-600 hover:bg-lime-700 text-white flex items-center justify-center font-extrabold text-sm shadow-xs transition">
                X
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {/* Profile Header */}
                <div className="p-4 bg-white dark:bg-slate-900">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {getUserDisplayName(currentLoggedUser)}
                  </p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {currentLoggedUser}
                  </p>
                </div>

                {/* Profile Menu Items */}
                <div className="py-2 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAdminUser && (
                    <button
                      onClick={() => {
                        setActiveTab?.('admin_panel');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center gap-3 transition cursor-pointer font-bold"
                    >
                      <ShieldAlert className="w-4 h-4 text-cyan-500" />
                      <span>Master Admin Panel</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTab?.('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-3 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab?.('my_invoices');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-3 transition cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Payment methods</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab?.('security');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-3 transition cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Security</span>
                  </button>
                </div>

                {/* Sign Out Action */}
                <div className="p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) {
                        onLogout();
                      } else if (setActiveTab) {
                        setActiveTab('login');
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-3 transition text-xs font-semibold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
