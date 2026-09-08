import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Mail,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Radio,
  Clock,
  Download,
  Trash2,
} from 'lucide-react';
import { RealSmsLog } from '../types';
import { getRealSmsLogs } from '../utils/realtimeSmsService';

interface YourMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: 'all' | 'delivered' | 'failed' | 'today';
  targetNumber?: string | null;
  inlineView?: boolean;
}

export const YourMessagesModal: React.FC<YourMessagesModalProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
  targetNumber = null,
  inlineView = false,
}) => {
  const [logs, setLogs] = useState<RealSmsLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'delivered' | 'failed' | 'today'>(initialFilter);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync logs from API and local state
  const syncLogs = async () => {
    try {
      const res = await fetch('/api/active-sms');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
          localStorage.setItem('real_sms_logs', JSON.stringify(data.logs));
          return;
        }
      }
    } catch (e) {}

    const rawLogs = getRealSmsLogs();
    setLogs(rawLogs);
  };

  useEffect(() => {
    if (isOpen) {
      syncLogs();
      setActiveFilter(initialFilter);
    }

    const handleUpdate = () => {
      syncLogs();
    };

    window.addEventListener('real_sms_updated', handleUpdate);
    const interval = setInterval(() => {
      if (isOpen) syncLogs();
    }, 10000);

    return () => {
      window.removeEventListener('real_sms_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [isOpen, initialFilter]);

  // Filtering logic
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by number if provided
    if (targetNumber) {
      const cleanTarget = targetNumber.replace(/\s+/g, '');
      result = result.filter((l) => {
        const cleanLogNum = l.number.replace(/\s+/g, '');
        return cleanLogNum.includes(cleanTarget) || cleanTarget.includes(cleanLogNum);
      });
    }

    // Filter by status/tab
    if (activeFilter === 'delivered') {
      result = result.filter((l) => l.status === 'DELIVERED');
    } else if (activeFilter === 'failed') {
      result = result.filter((l) => l.status === 'FAILED');
    } else if (activeFilter === 'today') {
      const todayPrefix = new Date().toISOString().split('T')[0];
      result = result.filter((l) => l.timestamp && l.timestamp.startsWith(todayPrefix));
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          (l.number || '').toLowerCase().includes(query) ||
          (l.text || '').toLowerCase().includes(query) ||
          (l.sid && l.sid.toLowerCase().includes(query)) ||
          (l.termination && l.termination.toLowerCase().includes(query)) ||
          (l.otp && l.otp.includes(query))
      );
    }

    return result;
  }, [logs, targetNumber, activeFilter, searchTerm]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 1800);
  };

  // Clear all messages
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all received messages? (সব মেসেজ মুছে ফেলতে চান?)')) {
      localStorage.setItem('real_sms_logs', JSON.stringify([]));
      setLogs([]);
      window.dispatchEvent(new Event('real_sms_updated'));
    }
  };

  // Export CSV
  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const header = 'ID,Timestamp,Status,Termination,Number,Sender,OTP,Text\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.status}","${l.termination}","${l.number}","${l.sid || ''}","${l.otp || ''}","${(l.text || '').replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `your_messages_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Time formatter
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 5) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  const totalDelivered = logs.filter((l) => l.status === 'DELIVERED').length;
  const totalFailed = logs.filter((l) => l.status === 'FAILED').length;

  if (inlineView) {
    return (
      <div
        id="your-messages-inline-display"
        className="w-full flex flex-col bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]"
      >
        {/* HEADER BAR - CLEAN WHITE INTERFACE */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Client Active SMS</span>
                </h2>
                {targetNumber && (
                  <span className="px-2.5 py-0.5 rounded-md bg-lime-100 border border-lime-300 text-lime-800 text-xs font-mono font-bold">
                    Filter: {targetNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time inbound SMS streams · All verified live data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
              title="Export visible messages as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 text-xs font-bold text-rose-600 transition cursor-pointer"
              title="Clear all messages"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & STATUS FILTER ROW */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sender, number, OTP or text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Messages ({logs.length})
            </button>
            <button
              onClick={() => setActiveFilter('delivered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Delivered ({totalDelivered})
            </button>
            <button
              onClick={() => setActiveFilter('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'failed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              Failed ({totalFailed})
            </button>
            <button
              onClick={() => setActiveFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* MESSAGE STREAM BODY - BORDERED FORMAT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white custom-sidebar-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="py-16 sm:py-24 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                <Mail className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-850">
                No Messages Received Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                {searchTerm
                  ? 'No messages matched your search query.'
                  : 'এখনও কোনো মেসেজ আসেনি। যখন আপনার নম্বরে এসএমএস আসবে তখন এখানে রিয়েল-টাইমে বর্ডার আকারে দেখতে পারবেন।'}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 shadow-2xs">
                  <span>Total Messages:</span>
                  <span className="font-mono text-lime-700">0</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col gap-3 group animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-800 shrink-0">
                        {log.sid ? log.sid.substring(0, 2).toUpperCase() : 'SM'}
                      </div>
                      <span className="text-sm font-black text-slate-900 group-hover:text-lime-700 transition-colors">
                        {log.sid || log.brand || 'Service'}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        {log.number}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
                        {log.termination}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          log.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimeAgo(log.timestamp)}</span>
                      </span>
                    </div>
                  </div>

                  {log.otp && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          OTP CODE
                        </span>
                        <span className="font-mono text-base sm:text-lg font-black tracking-widest text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          {log.otp}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(log.otp!, log.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-mono select-all">
                    {log.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="your-messages-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col p-2 sm:p-4 md:p-6 animate-fade-in"
    >
      {/* FULL DISPLAY WHITE INTERFACE CONTAINER */}
      <div
        id="your-messages-display"
        className="w-full max-w-6xl mx-auto h-full flex flex-col bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden"
      >
        {/* HEADER BAR - CLEAN WHITE INTERFACE */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Client Active SMS</span>
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-lime-100 border border-lime-300 text-lime-800">
                  <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse" />
                  Live Receiver
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 border border-slate-200 text-slate-700">
                  {logs.length} Messages
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {targetNumber ? `Displaying messages for ${targetNumber}` : 'Real-time feed of all received SMS & verification codes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-600 transition cursor-pointer"
                  title="Clear all messages"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Close (বন্ধ করুন)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by phone, sender, code, or text..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/30 focus:border-lime-500 transition shadow-2xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setActiveFilter('delivered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Delivered ({totalDelivered})
            </button>
            <button
              onClick={() => setActiveFilter('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'failed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              Failed ({totalFailed})
            </button>
            <button
              onClick={() => setActiveFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* MESSAGE STREAM BODY - BORDERED FORMAT (বর্ডার আকারে) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white custom-sidebar-scrollbar">
          {filteredLogs.length === 0 ? (
            /* EMPTY ZERO STATE - PRISTINE WHITE BORDERED BOX */
            <div className="py-16 sm:py-24 px-6 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                <Mail className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-850">
                No Messages Received Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                {searchTerm
                  ? 'No messages matched your search query.'
                  : 'এখনও কোনো মেসেজ আসেনি। যখন আপনার নম্বরে এসএমএস আসবে তখন এখানে রিয়েল-টাইমে বর্ডার আকারে দেখতে পারবেন।'}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-600 shadow-2xs">
                  <span>Total Messages:</span>
                  <span className="font-mono text-lime-700">0</span>
                </span>
              </div>
            </div>
          ) : (
            /* BORDERED MESSAGE CARDS (যেমন লাইভ টেস্টে বর্ডার আকারে দেখতে পাচ্ছো) */
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col gap-3 group animate-fade-in"
                >
                  {/* Top metadata row with sender, recipient, route, status, time */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-800 shrink-0">
                        {log.sid ? log.sid.substring(0, 2).toUpperCase() : 'SM'}
                      </div>

                      <span className="text-sm font-black text-slate-900 group-hover:text-lime-700 transition-colors">
                        {log.sid || log.brand || 'Service'}
                      </span>

                      <span className="text-xs font-mono font-bold text-slate-700 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                        {log.number}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200">
                        {log.termination}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          log.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {log.status}
                      </span>

                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTimeAgo(log.timestamp)}</span>
                      </span>
                    </div>
                  </div>

                  {/* OTP Code Badge & Quick 1-Click Copy */}
                  {log.otp && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-lime-50 border border-lime-300 text-lime-900 font-mono font-black text-xs shadow-2xs">
                        <span className="text-[10px] uppercase font-black text-lime-700 font-sans tracking-wide">
                          OTP CODE:
                        </span>
                        <span className="text-sm font-mono tracking-widest text-slate-900">
                          {log.otp}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopy(log.otp!, log.id + '_otp')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                        title="Copy OTP Code"
                      >
                        {copiedId === log.id + '_otp' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            <span className="text-emerald-700 font-black">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message Content in Distinct Bordered Box (Live Test Style) */}
                  <div className="relative p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 leading-relaxed font-sans select-text">
                    <p>{log.text}</p>

                    <button
                      onClick={() => handleCopy(log.text, log.id + '_txt')}
                      className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Copy full message text"
                    >
                      {copiedId === log.id + '_txt' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bottom info: ID and exact timestamp */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                    <span>ID: {log.id}</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-800">{filteredLogs.length}</strong> of{' '}
              <strong className="text-slate-800">{logs.length}</strong> total messages
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
