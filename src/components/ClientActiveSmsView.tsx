import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Mail, 
  Inbox,
  Pause,
  Play,
  Zap,
  Copy,
  Check,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { dispatchIncomingOtp } from '../utils/realtimeSmsService';
import { OtpSessionModal } from './OtpSessionModal';
import { YourMessagesModal } from './YourMessagesModal';
import { RealSmsLog } from '../types';

interface SmsLog {
  timestamp: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  termination: string;
  number: string;
  sid: string;
  cost?: string;
  text: string;
  otp?: string;
  service?: string;
}

interface ClientActiveSmsViewProps {
  initialFilter?: 'all' | 'delivered' | 'failed' | 'today' | null;
  onClearFilter?: () => void;
}

export const ClientActiveSmsView: React.FC<ClientActiveSmsViewProps> = ({
  initialFilter,
  onClearFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [liveLogs, setLiveLogs] = useState<SmsLog[]>([]);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState<string | null>(null);

  // Inner session white dashboard filter
  const [innerSessionFilter, setInnerSessionFilter] = useState<'all' | 'delivered' | 'failed' | 'today' | null>(null);

  useEffect(() => {
    if (initialFilter) {
      setInnerSessionFilter(initialFilter);
    }
  }, [initialFilter]);

  // OTP Session Modal
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  const [selectedLogForModal, setSelectedLogForModal] = useState<RealSmsLog | null>(null);
  const [isReceivingOtp, setIsReceivingOtp] = useState(false);
  const [isApiSyncing, setIsApiSyncing] = useState(false);
  const [lastApiSync, setLastApiSync] = useState<string>('');

  // Sync with real-time logs in backend API and localStorage
  const loadLogs = async () => {
    try {
      const res = await fetch('/api/active-sms');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLiveLogs(data.logs.map((l: any) => ({ ...l, cost: '0.0000 USD' })));
          localStorage.setItem('real_sms_logs', JSON.stringify(data.logs));
          if (data.last_updated) {
            setLastApiSync(new Date(data.last_updated).toLocaleTimeString('en-US'));
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Backend /api/active-sms fetch failed, checking local cache:', e);
    }

    const existing = localStorage.getItem('real_sms_logs');
    if (existing) {
      try {
        const parsed: SmsLog[] = JSON.parse(existing);
        setLiveLogs(parsed.map(l => ({ ...l, cost: '0.0000 USD' })));
        return;
      } catch (e) {}
    }
    setLiveLogs([]);
  };

  const handleSyncWithIprn = async () => {
    setIsApiSyncing(true);
    try {
      await fetch('/api/trigger-sync', { method: 'POST' });
      await loadLogs();
    } catch (e) {
      console.error('IPRN API trigger-sync error:', e);
    } finally {
      setIsApiSyncing(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleSync = () => loadLogs();
    window.addEventListener('real_sms_updated', handleSync);
    
    // Auto-poll live active SMS feed every 10 seconds
    const interval = setInterval(() => {
      loadLogs();
    }, 10000);

    return () => {
      window.removeEventListener('real_sms_updated', handleSync);
      clearInterval(interval);
    };
  }, []);

  const handleClear = () => {
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
    window.dispatchEvent(new Event('real_sms_updated'));
  };

  const handleReceiveLiveOtp = async () => {
    setIsReceivingOtp(true);
    try {
      const res = await fetch('/api/trigger-sync', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.active_sms_logs && json.data.active_sms_logs.length > 0) {
          const latestLog = json.data.active_sms_logs[0];
          localStorage.setItem('real_sms_logs', JSON.stringify(json.data.active_sms_logs));
          window.dispatchEvent(new Event('real_sms_updated'));
          setSelectedLogForModal(latestLog as RealSmsLog);
          setInspectorModalOpen(true);
          setIsReceivingOtp(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Sync trigger error:', e);
    }

    const newLog = dispatchIncomingOtp();
    setIsReceivingOtp(false);
    setSelectedLogForModal(newLog);
    setInspectorModalOpen(true);
  };

  // Helper to extract OTP code
  const getOtpCode = (log: SmsLog): string | null => {
    if (log.otp) return log.otp;
    const match = log.text.match(/\b\d{4,8}\b/);
    return match ? match[0] : null;
  };

  const handleCopyOtp = (e: React.MouseEvent, otp: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(otp);
    setCopiedOtp(otp);
    setTimeout(() => setCopiedOtp(null), 1500);
  };

  // Counters
  const totalCount = liveLogs.length;
  const deliveredCount = liveLogs.filter(l => l.status === 'DELIVERED').length;
  const pendingCount = liveLogs.filter(l => l.status === 'PENDING').length;
  const failedCount = liveLogs.filter(l => l.status === 'FAILED').length;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return liveLogs.filter(log => {
      const matchesSearch = 
        !searchTerm ||
        log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.number.includes(searchTerm) ||
        log.termination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sid.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [liveLogs, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredLogs.length / perPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLogs.slice(start, start + perPage);
  }, [filteredLogs, currentPage, perPage]);

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 5) return 'Just now';
      if (diffSec < 60) return `${diffSec}s`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m`;
      return date.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '1s';
    }
  };

  if (innerSessionFilter) {
    return (
      <div className="space-y-6 pb-12">
        {/* Breadcrumb section matching user screenshot */}
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <span>Dashboard</span>
          <span className="text-slate-300 dark:text-slate-600">&gt;</span>
          <span>Client System</span>
          <span className="text-slate-300 dark:text-slate-600">&gt;</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">Client Active SMS</span>
        </div>

        <YourMessagesModal
          isOpen={true}
          inlineView={true}
          initialFilter={innerSessionFilter}
          onClose={() => {
            setInnerSessionFilter(null);
            if (onClearFilter) onClearFilter();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb section matching user screenshot */}
      <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <span>Dashboard</span>
        <span className="text-slate-300 dark:text-slate-600">&gt;</span>
        <span>Client System</span>
        <span className="text-slate-300 dark:text-slate-600">&gt;</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">Client Active SMS</span>
      </div>

      {/* Main Page Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Live SMS feed
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
          Inbound traffic · 500-message buffer
        </p>
      </div>

      {/* 4 Square Cards Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5">
        {/* Card 1: TOTAL MESSAGES */}
        <div 
          onClick={() => setInnerSessionFilter('all')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xs flex flex-col justify-between h-36 sm:h-40 cursor-pointer hover:shadow-md hover:border-lime-500/40 transition-all active:scale-[0.99] group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#65a30d]" />
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-[#65a30d] transition-colors">
              TOTAL MESSAGES
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#ecfccb] dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none block">
              {totalCount}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Real Time</span>
            <span className="text-[10px] text-lime-600 dark:text-lime-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
          </p>
        </div>

        {/* Card 2: DELIVERED */}
        <div 
          onClick={() => setInnerSessionFilter('delivered')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xs flex flex-col justify-between h-36 sm:h-40 cursor-pointer hover:shadow-md hover:border-emerald-500/40 transition-all active:scale-[0.99] group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#10b981]" />
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-[#10b981] transition-colors">
              DELIVERED
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#d1fae5] dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none block">
              {deliveredCount}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Confirmed by receipt</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
          </p>
        </div>

        {/* Card 3: PENDING / TODAY */}
        <div 
          onClick={() => setInnerSessionFilter('today')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xs flex flex-col justify-between h-36 sm:h-40 cursor-pointer hover:shadow-md hover:border-amber-500/40 transition-all active:scale-[0.99] group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#f59e0b]" />
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-[#f59e0b] transition-colors">
              PENDING
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fef3c7] dark:bg-amber-950/50 text-[#d97706] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none block">
              {pendingCount}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Awaiting a receipt</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
          </p>
        </div>

        {/* Card 4: FAILED */}
        <div 
          onClick={() => setInnerSessionFilter('failed')}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xs flex flex-col justify-between h-36 sm:h-40 cursor-pointer hover:shadow-md hover:border-rose-500/40 transition-all active:scale-[0.99] group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#ef4444]" />
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-[#ef4444] transition-colors">
              FAILED
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fee2e2] dark:bg-rose-950/50 text-[#dc2626] dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="my-1">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none block">
              {failedCount}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Not delivered</span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
          </p>
        </div>
      </div>

      {/* Message Stream Card Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Message stream
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              newest first
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncWithIprn}
              disabled={isApiSyncing}
              title="Synchronize live SMS directly from IPRN API"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isApiSyncing ? 'animate-spin' : ''}`} />
              <span>{isApiSyncing ? 'Syncing...' : 'Sync IPRN API'}</span>
            </button>

            <button
              onClick={() => setIsLivePaused(!isLivePaused)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dcfce7] dark:bg-emerald-950/60 border border-[#bbf7d0] dark:border-emerald-800/80 text-[#166534] dark:text-emerald-300 text-xs font-extrabold cursor-pointer hover:opacity-90 transition"
            >
              {isLivePaused ? (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>RESUMED</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-black tracking-tighter">||</span>
                  <span>LIVE</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 space-y-3">
          {/* Status Dropdown with Green Lime Border matching screenshot */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white dark:bg-slate-900 border-2 border-[#84cc16] dark:border-lime-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none transition cursor-pointer"
            >
              <option value="ALL">All status</option>
              <option value="DELIVERED">Delivered</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Clear All Button centered under select */}
          <div className="flex justify-center pt-1">
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b91c1c] hover:text-rose-700 dark:text-rose-400 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Pagination & Metrics Bar */}
        <div className="px-4 py-3 bg-[#f8fafc] dark:bg-slate-950/60 border-y border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <span className="uppercase text-[10px] tracking-wider font-extrabold text-slate-400">PER PAGE</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 transition font-bold"
            >
              &lt; Prev
            </button>
            <span className="text-slate-600 dark:text-slate-400 font-bold px-1">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 transition font-bold"
            >
              Next &gt;
            </button>
          </div>

          <div className="text-slate-500 dark:text-slate-400 font-bold">
            <span>{filteredLogs.length} total</span>
          </div>
        </div>

        {/* Message Stream Body */}
        {paginatedLogs.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No messages yet
            </h4>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
              Live messages will appear here when they arrive
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedLogs.map((log, idx) => {
              const otpCode = getOtpCode(log);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedLogForModal(log as RealSmsLog);
                    setInspectorModalOpen(true);
                  }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start gap-3.5 cursor-pointer group animate-fade-in"
                >
                  <div className="w-10 h-10 rounded-xl bg-lime-100 dark:bg-lime-950/40 text-lime-700 dark:text-lime-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform">
                    {log.sid.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                          {log.sid}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          ({log.number})
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {log.termination.split(' - ')[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {otpCode && (
                          <div
                            onClick={(e) => handleCopyOtp(e, otpCode)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs shadow-xs hover:bg-emerald-500/25 transition cursor-pointer"
                            title="Click to copy OTP"
                          >
                            <span>OTP:</span>
                            <span className="tracking-wider">{otpCode}</span>
                            {copiedOtp === otpCode ? (
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-slate-400">
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 leading-relaxed">
                      {log.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deep OTP Inspector Session Modal */}
      <OtpSessionModal
        isOpen={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
        initialLog={selectedLogForModal}
      />
    </div>
  );
};
