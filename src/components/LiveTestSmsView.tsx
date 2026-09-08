import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Trash2, 
  Download, 
  Search, 
  Layers, 
  Mail, 
  Radio, 
  Plus, 
  Check,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  Clipboard,
  Zap,
  RefreshCw
} from 'lucide-react';

interface SmsLog {
  id?: string;
  timestamp: string;
  status: 'DELIVERED' | 'FAILED';
  termination: string;
  number: string;
  sid: string;
  cost?: string;
  text: string;
  otp?: string;
}

export const LiveTestSmsView: React.FC = () => {
  // Live controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('iprn_api_key') || '');
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem('iprn_api_key') || '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [liveLogs, setLiveLogs] = useState<SmsLog[]>(() => {
    try {
      const saved = localStorage.getItem('real_sms_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((log: any) => {
            if (!log || typeof log !== 'object') return false;
            const id = String(log.id || '');
            return !id.startsWith('MSG-LIVE-') && !id.startsWith('MSG-MOCK-') && !id.startsWith('MSG-DEMO-') && !id.startsWith('MSG-SIM-');
          });
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic real-time counters
  const [totalMessagesStat, setTotalMessagesStat] = useState<number>(() => {
    try {
      const val = localStorage.getItem('total_messages_stat');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [rangesStat, setRangesStat] = useState<number>(() => {
    try {
      const val = localStorage.getItem('ranges_stat');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  });

  const prevFirstIdRef = useRef<string>('');

  // Fetch active server API key on mount
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await fetch('/api/get-api-key');
        if (res.ok) {
          const data = await res.json();
          if (data.apiKey) {
            setApiKey(data.apiKey);
            setApiKeyInput(data.apiKey);
            localStorage.setItem('iprn_api_key', data.apiKey);
          }
        }
      } catch (e) {}
    };
    fetchKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeySaveMessage({ text: 'Please enter or paste a valid API key.', type: 'error' });
      return;
    }
    setIsSavingKey(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() })
      });
      if (res.ok) {
        setApiKey(apiKeyInput.trim());
        localStorage.setItem('iprn_api_key', apiKeyInput.trim());
        setKeySaveMessage({ text: 'API Key saved! Live real-time SMS stream connected.', type: 'success' });
        fetchLatestData();
      } else {
        const errData = await res.json();
        setKeySaveMessage({ text: errData.message || 'Failed to update API key.', type: 'error' });
      }
    } catch (e) {
      setKeySaveMessage({ text: 'Network error while updating API key.', type: 'error' });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKeyInput(text.trim());
      }
    } catch (e) {}
  };

  // Audio tone generator for incoming SMS ping
  const playSmsSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 note
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio fallback
    }
  };

  // Listen for real-time update events dispatched globally
  useEffect(() => {
    const handleSmsUpdated = () => {
      try {
        const saved = localStorage.getItem('real_sms_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const freshLogs: SmsLog[] = parsed.map((l: any) => ({
              ...l,
              cost: l.cost || '0.0100 USD'
            }));
            const newestId = freshLogs[0]?.id || freshLogs[0]?.timestamp || '';
            if (prevFirstIdRef.current && newestId !== prevFirstIdRef.current) {
              playSmsSound();
            }
            prevFirstIdRef.current = newestId;
            setLiveLogs(freshLogs);
          }
        }

        const savedMessages = localStorage.getItem('total_messages_stat');
        if (savedMessages) {
          setTotalMessagesStat(parseInt(savedMessages, 10));
        }
        const savedRanges = localStorage.getItem('ranges_stat');
        if (savedRanges) {
          setRangesStat(parseInt(savedRanges, 10));
        }
      } catch (err) {
        console.warn('Error syncing live test SMS logs from custom event:', err);
      }
    };

    window.addEventListener('real_sms_updated', handleSmsUpdated);
    window.addEventListener('real_sms_updated_event', handleSmsUpdated);
    return () => {
      window.removeEventListener('real_sms_updated', handleSmsUpdated);
      window.removeEventListener('real_sms_updated_event', handleSmsUpdated);
    };
  }, [soundEnabled]);

  // Sync logs and metrics via direct fetch
  const fetchLatestData = async () => {
    if (!isLiveActive) return;
    try {
      // 1. Fetch dashboard metrics for live counters
      const metricsRes = await fetch('/api/dashboard-metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        if (data?.metrics?.messages !== undefined) {
          setTotalMessagesStat(data.metrics.messages);
          localStorage.setItem('total_messages_stat', data.metrics.messages.toString());
        }
        if (data?.metrics?.totalRanges !== undefined) {
          setRangesStat(data.metrics.totalRanges);
          localStorage.setItem('ranges_stat', data.metrics.totalRanges.toString());
        }
      }

      // 2. Fetch active live SMS logs
      const smsRes = await fetch('/api/active-sms');
      if (smsRes.ok) {
        const smsData = await smsRes.json();
        if (smsData.logs && Array.isArray(smsData.logs)) {
          const freshLogs: SmsLog[] = smsData.logs.map((l: any) => ({
            ...l,
            cost: l.cost || '0.0100 USD'
          }));

          const newestId = freshLogs[0]?.id || freshLogs[0]?.timestamp || '';
          if (prevFirstIdRef.current && newestId !== prevFirstIdRef.current) {
            playSmsSound();
          }
          prevFirstIdRef.current = newestId;

          setLiveLogs(freshLogs);
          localStorage.setItem('real_sms_logs', JSON.stringify(freshLogs));
          setIsConnected(true);
          if (smsData.last_updated) {
            setLastSyncTime(new Date(smsData.last_updated).toLocaleTimeString('en-US', { hour12: false }));
          }
        }
      }
    } catch (e) {
      console.warn('Live test SMS sync notice:', e);
    }
  };

  // Real-Time EventSource (SSE) listener for instant sub-second push
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream-updates');
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onerror = () => setIsConnected(false);
      eventSource.onmessage = (event) => {
        if (!isLiveActive) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            if (payload.metrics?.messages !== undefined) {
              setTotalMessagesStat(payload.metrics.messages);
            }
            if (payload.metrics?.totalRanges !== undefined) {
              setRangesStat(payload.metrics.totalRanges);
            }
            if (payload.active_sms_logs && Array.isArray(payload.active_sms_logs)) {
              const freshLogs: SmsLog[] = payload.active_sms_logs.map((l: any) => ({
                ...l,
                cost: l.cost || '0.0100 USD'
              }));
              const newestId = freshLogs[0]?.id || freshLogs[0]?.timestamp || '';
              if (prevFirstIdRef.current && newestId !== prevFirstIdRef.current) {
                playSmsSound();
              }
              prevFirstIdRef.current = newestId;
              setLiveLogs(freshLogs);
              localStorage.setItem('real_sms_logs', JSON.stringify(freshLogs));
              if (payload.last_updated) {
                setLastSyncTime(new Date(payload.last_updated).toLocaleTimeString('en-US', { hour12: false }));
              }
            }
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };
    } catch (err) {
      console.warn('SSE fallback:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isLiveActive]);

  // Polling fallback every 2.5 seconds to guarantee active feed
  useEffect(() => {
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 2500);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Mask OTP codes in text body as seen in official panel (XXXXXX)
  const maskSmsOtp = (text: string): string => {
    if (!text) return '';
    let masked = text.replace(/\b\d{6}\b/g, 'XXXXXX');
    masked = masked.replace(/\b\d{4,5}\b/g, 'XXXX');
    masked = masked.replace(/(\d{2})\s*minutes/i, 'XX minutes');
    return masked;
  };

  const handleClear = () => {
    setLiveLogs([]);
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const headers = 'Timestamp,Number,Route/Termination,SenderID,Cost,Status,Message\n';
    const rows = filteredLogs.map(m => 
      `"${m.timestamp}","${m.number}","${m.termination}","${m.sid}","${m.cost || '0.0100 USD'}","${m.status}","${(m.text || '').replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `live_sms_stream_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (log: SmsLog, logKey: string) => {
    const cleanNum = log.number ? log.number.replace(/^\+/, '') : '';
    const content = `${cleanNum} | ${log.termination} | ${log.sid}: ${log.text}`;
    navigator.clipboard.writeText(content);
    setCopiedId(logKey);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Dynamic available countries from live logs
  const availableCountries = useMemo(() => {
    const list = new Set<string>(['Bolivia', 'Cambodia', 'Ecuador', 'Benin', 'Azerbaijan', 'Algeria', 'United Kingdom']);
    liveLogs.forEach(l => {
      if (l.termination) {
        const countryName = l.termination.split(' - ')[0].trim();
        if (countryName) list.add(countryName);
      }
    });
    return Array.from(list).sort();
  }, [liveLogs]);

  // Country Flag Renderer with authentic flag colors matching the panel
  const renderFlag = (termination: string) => {
    const term = (termination || '').toLowerCase();
    
    // Bolivia Flag (Red, Yellow, Green horizontal stripes)
    if (term.includes('bolivia')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
          <div className="h-1/3 bg-[#D52B1E]" />
          <div className="h-1/3 bg-[#F9E300]" />
          <div className="h-1/3 bg-[#007934]" />
        </div>
      );
    }
    // Benin Flag (Green vertical left bar, yellow top right, red bottom right)
    if (term.includes('benin')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
          <div className="w-[40%] bg-[#008751]" />
          <div className="w-[60%] flex flex-col h-full">
            <div className="h-1/2 bg-[#FCD116]" />
            <div className="h-1/2 bg-[#E8112D]" />
          </div>
        </div>
      );
    }
    // Cambodia Flag (Blue, Red with temple, Blue)
    if (term.includes('cambodia')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200 dark:border-slate-700 relative">
          <div className="h-[25%] bg-[#032EA6]" />
          <div className="h-[50%] bg-[#ED1B24] flex items-center justify-center">
            <div className="w-3 h-2 bg-white/90 rounded-2xs" />
          </div>
          <div className="h-[25%] bg-[#032EA6]" />
        </div>
      );
    }
    // Ecuador Flag (Yellow top 50%, Blue 25%, Red 25%)
    if (term.includes('ecuador')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
          <div className="h-1/2 bg-[#FFD100]" />
          <div className="h-1/4 bg-[#0033A0]" />
          <div className="h-1/4 bg-[#DA291C]" />
        </div>
      );
    }
    // Azerbaijan Flag (Blue, Red, Green horizontal)
    if (term.includes('azerbaijan')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
          <div className="h-1/3 bg-[#0092BC]" />
          <div className="h-1/3 bg-[#E4002B]" />
          <div className="h-1/3 bg-[#009944]" />
        </div>
      );
    }
    // Algeria Flag (Green left, White right)
    if (term.includes('algeria')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
          <div className="w-1/2 bg-[#006233]" />
          <div className="w-1/2 bg-white" />
        </div>
      );
    }
    // United Kingdom (UK)
    if (term.includes('united kingdom') || term.includes('uk')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden bg-[#012169] relative shadow-xs shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <div className="absolute w-full h-[3px] bg-red-600" />
          <div className="absolute h-full w-[3px] bg-red-600" />
        </div>
      );
    }
    // Default Flag
    return (
      <div className="w-10 h-7 rounded-xs bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs shadow-xs shrink-0">
        🌐
      </div>
    );
  };

  // Filter logs based on search and country
  const filteredLogs = useMemo(() => {
    return liveLogs.filter(log => {
      const termMatch = 
        !searchTerm ||
        (log.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.number || '').includes(searchTerm) ||
        (log.termination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.sid || '').toLowerCase().includes(searchTerm.toLowerCase());

      const countryMatch = selectedCountry === 'All' || (log.termination || '').toLowerCase().includes(selectedCountry.toLowerCase());
      return termMatch && countryMatch;
    });
  }, [liveLogs, searchTerm, selectedCountry]);

  const totalPages = Math.ceil(filteredLogs.length / perPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLogs.slice(start, start + perPage);
  }, [filteredLogs, currentPage, perPage]);

  // Format relative time (10m, 2s, 1m)
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
      if (diffSec < 60) return `${diffSec}s`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr}h`;
    } catch {
      return '1m';
    }
  };

  // Format exact time (HH:mm:ss)
  const formatExactTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '03:29:14';
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumbs matching original panel */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer">Dashboard</span>
        <span>&gt;</span>
        <span className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer">Test System</span>
        <span>&gt;</span>
        <span className="text-slate-900 dark:text-white font-bold">Live Test SMS</span>
      </div>

      {/* Top Metric Cards matching the screenshot */}
      <div className="space-y-4">
        {/* TOTAL MESSAGES Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#84cc16]" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block uppercase">
                TOTAL MESSAGES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalMessagesStat.toLocaleString('en-US')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                Live Stream
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/40 dark:text-lime-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* RANGES Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#84cc16]" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block uppercase">
                RANGES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {rangesStat.toLocaleString('en-US')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                Receiving traffic
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/40 dark:text-lime-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Message Stream Card matching the screenshot */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        {/* Stream Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Message stream
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              real-time feed
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute/Unmute */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Connected Pill */}
            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: LIVE, Clear, Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* LIVE button with teal/emerald background */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isLiveActive 
                ? 'bg-[#0f766e] text-white shadow-xs' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse' : ''}`} />
            <span>LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search messages, phone numbers, countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition"
          />
        </div>

        {/* Country filter */}
        <div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Countries</option>
            {availableCountries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Pagination & Count Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Per page</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded text-xs disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded text-xs disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total messages shown count */}
        <div className="text-xs text-slate-400 font-medium">
          {paginatedLogs.length} / {filteredLogs.length} messages
        </div>

        {/* Message Cards List matching the screenshot */}
        <div className="space-y-3 pt-2">
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              Waiting for live incoming messages...
            </div>
          ) : (
            paginatedLogs.map((log, idx) => {
              const logKey = log.id || `${log.number}-${idx}`;
              const cleanNumber = log.number ? log.number.replace(/^\+/, '') : '';
              const senderInitial = (log.sid || 'A').charAt(0).toUpperCase();

              return (
                <div 
                  key={logKey}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Country Flag */}
                    <div className="pt-0.5">
                      {renderFlag(log.termination)}
                    </div>

                    {/* Message Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Line 1: Route Name + Relative Time */}
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {log.termination || 'Live Gateway'}
                        </h4>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>

                      {/* Line 2: Phone Number + Exact Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {cleanNumber}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                          {formatExactTime(log.timestamp)}
                        </span>
                      </div>

                      {/* Line 3: Sender badge + Cost pill */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="w-4 h-4 rounded-xs bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/60 dark:text-lime-400 font-black text-[10px] flex items-center justify-center shrink-0">
                          {senderInitial}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {log.sid || 'AUTHMSG'}
                        </span>
                        <div className="px-2 py-0.5 rounded-sm bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/50 dark:text-lime-400 text-[11px] font-bold">
                          {log.cost || '0.0100 USD'}
                        </div>
                      </div>

                      {/* Line 4: Message Body with masked OTP */}
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-1 select-text">
                        {maskSmsOtp(log.text)}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row with + Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopy(log, logKey)}
                      className="w-7 h-7 rounded-md bg-[#ecfccb] hover:bg-[#d9f99d] text-[#65a30d] dark:bg-lime-950/60 dark:hover:bg-lime-900/60 dark:text-lime-400 flex items-center justify-center transition cursor-pointer shadow-2xs"
                      title="Copy message & number"
                    >
                      {copiedId === logKey ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
