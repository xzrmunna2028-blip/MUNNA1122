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

  const accountCode = '8492019384'; // 10-digit Active Account Code
  const apiKey = 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z'; // Live IPRN Production API Key

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
        {/* Top Header & Brand Area (Soft Harmonious Tone + Centered Logo + Title + Close Button) */}
        <div className="pt-5 px-5 pb-4 flex flex-col items-center justify-center relative shrink-0 bg-gradient-to-b from-slate-800/80 via-slate-850 to-slate-900/95 backdrop-blur-md text-white shadow-sm border-b border-slate-700/30">
          {/* Close Button Top Right */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Centered Brand Logo Badge with Uploaded Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white/95 border border-slate-700/60 shadow-lg shadow-cyan-500/10 p-1 flex items-center justify-center relative mb-2.5 shrink-0 overflow-hidden">
            <img
              src="/code_flow_logo.jpg"
              alt="Code Flow Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          {/* Website Name */}
          <h2 className="text-xl font-black tracking-tight flex items-center gap-1.5 leading-tight">
            <span className="text-white">Code Flow</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-pink-400 font-extrabold">
              SMS
            </span>
          </h2>
          <span className="text-[10px] font-extrabold text-cyan-400/90 tracking-widest uppercase mt-0.5">
            SMS PANEL
          </span>
        </div>

        {/* Animated Rainbow Border Line */}
        <div className="w-full h-[3.5px] rainbow-animated-border shrink-0 shadow-md" />

        {/* Navigation Categories and Links */}
        <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto custom-sidebar-scrollbar">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <span className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-widest block uppercase">
                {section.title}
              </span>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const hasSub = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedMenus[item.id];
                  const isActive = activeTab === item.id;
                  
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => {
                          if (hasSub) {
                            toggleMenu(item.id);
                          } else {
                            setActiveTab(item.id);
                            setOpen(false);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-[#65a30d] text-white shadow-md shadow-lime-950/50 font-black'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
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
                        <div className="pl-6 pr-2 py-1.5 space-y-1.5 ml-5 border-l-2 border-slate-800">
                          {item.subItems?.map((sub) => {
                            const isSubActive = activeTab === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveTab(sub.id);
                                  setOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold block transition-all duration-150 cursor-pointer ${
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
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 space-y-2.5">
          {/* Telegram Action */}
          <a
            href="https://t.me/super_x_sms_s"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 text-xs sm:text-sm font-bold text-white border border-slate-800 hover:border-lime-500/50 hover:bg-slate-800/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Send className="w-4 h-4 text-lime-400 -rotate-12" />
              <span>Telegram Channel</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          {/* Email Action */}
          <a
            href="mailto:codeflowsupport@gmail.com"
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/60 text-xs sm:text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition text-left cursor-pointer border border-transparent hover:border-slate-800"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-lime-400" />
              <span>Email</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition text-left cursor-pointer border border-transparent"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
