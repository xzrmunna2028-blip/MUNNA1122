import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Hash,
  BarChart3,
  FlaskConical,
  FileText,
  Send,
  Mail,
  LogOut,
  X,
  Code2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Headphones,
  Radio,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string;
  hasChevron?: boolean;
  subItems?: { id: string; label: string }[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  setOpen,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedApiKey, setCopiedApiKey] = useState<boolean>(false);
  const [copiedAccountCode, setCopiedAccountCode] = useState<boolean>(false);

  // Real-time Sidebar Live Stream Widget state
  const [latestSms, setLatestSms] = useState<any | null>(null);
  const [liveMsgCount, setLiveMsgCount] = useState<number>(0);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/active-sms');
        if (res.ok) {
          const data = await res.json();
          if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
            setLatestSms(data.logs[0]);
            setLiveMsgCount(data.logs.length);
          }
        }
      } catch (e) {}
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 2500);

    const handleSmsUpdated = () => {
      fetchLatest();
    };

    window.addEventListener('real_sms_updated', handleSmsUpdated);
    window.addEventListener('real_sms_updated_event', handleSmsUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener('real_sms_updated', handleSmsUpdated);
      window.removeEventListener('real_sms_updated_event', handleSmsUpdated);
    };
  }, []);

  const currentLoggedUser = (localStorage.getItem('codeflow_user') || 'xzrmunna7788@gmail.com').trim().toLowerCase();
  const userHash = currentLoggedUser.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000000, 12345678).toString(36);
  const accountCode = (Math.abs(currentLoggedUser.split('').reduce((acc, char) => acc * 33 + char.charCodeAt(0), 5381)) % 9000000000 + 1000000000).toString();
  const apiKey = `sk_live_${userHash}_${accountCode.slice(0, 8)}`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  const handleCopyAccountCode = () => {
    navigator.clipboard.writeText(accountCode);
    setCopiedAccountCode(true);
    setTimeout(() => setCopiedAccountCode(false), 2000);
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: MenuSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'CLIENT SYSTEM',
      items: [
        { id: 'activesms', label: 'Client Active SMS', icon: MessageSquare },
        { id: 'mynumbers', label: 'My Numbers', icon: Hash },
        { id: 'statistics', label: 'My SMS Statistics', icon: BarChart3 },
      ],
    },
    {
      title: 'TOOLS',
      items: [
        {
          id: 'testsystem',
          label: 'Test System',
          icon: FlaskConical,
          hasChevron: true,
          subItems: [
            { id: 'live_test_sms', label: 'Live Test SMS' },
            { id: 'test_numbers', label: 'Test Numbers' },
            { id: 'sms_records', label: 'SMS Records' },
            { id: 'sid_notifications', label: 'SID Notifications' },
          ],
        },
        {
          id: 'invoices',
          label: 'Invoices System',
          icon: FileText,
          hasChevron: true,
          subItems: [
            { id: 'my_invoices', label: 'My Invoices' },
          ],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-200 ease-in-out flex flex-col shadow-2xl ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand Area: Premium Warm Amber/Yellow Header Accent matching Brand Logo */}
        <div className="pt-6 px-5 pb-5 flex flex-col items-center justify-center relative shrink-0 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 text-white shadow-sm border-b border-amber-500/20">
          {/* Close Button Top Right */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Centered Brand Logo Badge with Radiant Gold/Amber Glow and Crisp Border */}
          <div className="w-18 h-18 rounded-2xl bg-amber-400/15 border-2 border-amber-400/50 shadow-xl shadow-amber-500/20 p-1.5 flex items-center justify-center relative mb-3 shrink-0 overflow-hidden group">
            <div className="w-full h-full rounded-xl bg-white p-0.5 shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src="/code_flow_logo.jpg"
                alt="Code Flow Logo"
                className="w-full h-full object-contain rounded-lg transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Website Name */}
          <h2 className="text-xl font-black tracking-tight flex items-center gap-1.5 leading-tight text-white">
            <span>Code Flow</span>
            <span className="text-amber-400 font-extrabold drop-shadow-sm">
              SMS
            </span>
          </h2>
          <span className="text-[10px] font-black text-amber-300/90 tracking-[0.25em] uppercase mt-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            SMS PANEL
          </span>
        </div>

        {/* Clean Modern Solid Amber/Gold Striped Border Line */}
        <div className="w-full h-[3px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shrink-0 shadow-sm" />

        {/* Navigation Categories and Links - Generous, perfectly spaced buttons filling the drawer beautifully */}
        <nav className="flex-1 px-3.5 py-5 space-y-6 overflow-y-auto custom-sidebar-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <span className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-400 tracking-wider block uppercase">
                {section.title}
              </span>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const hasSub = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedMenus[item.id];
                  const isActive = activeTab === item.id;
                  
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <button
                        onClick={() => {
                          if (hasSub) {
                            toggleMenu(item.id);
                          } else {
                            setActiveTab(item.id);
                            setOpen(false);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-[#65a30d] text-white shadow-lg shadow-lime-950/60 font-black scale-[1.01]'
                            : 'text-slate-200 hover:bg-slate-800/90 hover:text-white border border-transparent hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="text-[13px] sm:text-sm">{item.label}</span>
                        </div>
                        
                        {/* Badge or Chevron check */}
                        {item.badge ? (
                          <span className="text-[10px] font-black bg-lime-950/80 text-lime-400 px-2 py-0.5 rounded-md border border-lime-800/60">
                            {item.badge}
                          </span>
                        ) : hasSub ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )
                        ) : item.hasChevron ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : null}
                      </button>

                      {/* Sub Items Accordion */}
                      {hasSub && isExpanded && (
                        <div className="pl-6 pr-2 py-2 space-y-2 ml-5 border-l-2 border-slate-800">
                          {item.subItems?.map((sub) => {
                            const isSubActive = activeTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab(sub.id);
                                  setOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold block transition-all duration-150 cursor-pointer ${
                                  isSubActive
                                    ? 'bg-lime-950/60 text-lime-400 border-l-2 border-[#65a30d] rounded-l-none font-extrabold'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer with Quick Links */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 space-y-2">
          {/* Telegram Action */}
          <a
            href="https://t.me/super_x_sms_support"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-xs sm:text-sm font-bold text-white border border-[#0088cc]/40 hover:border-[#0088cc] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 fill-[#0088cc]" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.55 3.93-1.64 4.74-1.93 5.27-1.94.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/>
              </svg>
              <span>Telegram Support</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Skype Action (Teams chat inside) */}
          <a
            href="https://teams.microsoft.com/l/chat/0/0?users=codeflowsupport%40gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#00aff0]/15 hover:bg-[#00aff0]/25 text-xs sm:text-sm font-bold text-white border border-[#00aff0]/40 hover:border-[#00aff0] transition cursor-pointer"
            title="Open Teams Account (codeflowsupport@gmail.com)"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 fill-[#00aff0]" viewBox="0 0 24 24">
                <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.257.234 2.46.662 3.568A9.99 9.99 0 0 0 2 19c0 .552.448 1 1 1a9.99 9.99 0 0 0 3.432-.662C7.54 19.766 8.743 20 10.001 20c5.522 0 10-4.478 10-10 0-1.257-.234-2.46-.662-3.568A9.99 9.99 0 0 0 20 5c0-.552-.448-1-1-1a9.99 9.99 0 0 0-3.432.662C14.46 4.234 13.257 4 12.001 2zm3.328 12.637c-.637.795-1.637 1.264-2.887 1.346-1.428.093-2.618-.328-3.447-1.222-.507-.547-.795-1.25-.83-2.032a.75.75 0 0 1 .746-.782h1.562a.75.75 0 0 1 .744.665c.08.718.59 1.157 1.364 1.157.653 0 1.187-.315 1.187-.805 0-.414-.372-.647-1.127-.866l-1.156-.335c-1.61-.468-2.39-1.29-2.39-2.523 0-1.275.98-2.296 2.532-2.492 1.314-.166 2.457.26 3.193 1.05.474.508.736 1.152.756 1.86a.75.75 0 0 1-.749.771h-1.572a.75.75 0 0 1-.745-.678c-.067-.577-.478-.934-1.115-.934-.582 0-1.047.284-1.047.727 0 .393.35.592 1.054.795l1.096.317c1.782.518 2.593 1.353 2.593 2.627 0 1.272-.924 2.378-2.563 2.592z"/>
              </svg>
              <span>Skype Manager</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Logout Action */}
          <button
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                setActiveTab('login');
              }
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left cursor-pointer border border-transparent"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
