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
          return parsed.filter((log: any) => log && typeof log === 'object');
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
    const list = new Set<string>(['Algeria', 'Azerbaijan', 'Belarus', 'Benin', 'Bolivia', 'Cambodia', 'Ecuador', 'United Kingdom']);
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
    
    // Belarus Flag (Red top, Green bottom)
    if (term.includes('belarus')) {
      return (
        <div className="w-10 h-7 rounded-xs overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
          <div className="h-[65%] bg-[#C8313E]" />
          <div className="h-[35%] bg-[#4AA65A]" />
        </div>
      );
    }
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

  const [revealedOtpIds, setRevealedOtpIds] = useState<Set<string>>(new Set());

  const toggleRevealOtp = (id: string) => {
    setRevealedOtpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Render Social Media & Service Brand Logo
  const renderBrandLogo = (sid?: string) => {
    const s = (sid || '').toLowerCase().trim();
    
    // WhatsApp
    if (s.includes('whatsapp')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.007-.478-1.579-.656-2.592-2.277-2.671-2.383-.077-.105-.638-.85-.638-1.623 0-.773.405-1.154.55-1.311.144-.158.313-.198.418-.198.105 0 .21.002.302.007.097.005.228-.037.357.272.132.318.451 1.101.492 1.183.041.082.069.178.014.288-.054.109-.082.178-.163.273-.082.095-.173.212-.247.285-.082.082-.167.172-.072.336.095.163.424.7.91 1.134.625.558 1.152.731 1.315.813.164.082.26-.072.356-.183.109-.126.465-.542.588-.727.123-.186.246-.155.41-.095.164.06.942.444 1.106.526.164.082.273.123.313.192.041.069.041.402-.103.807z" />
          </svg>
        </div>
      );
    }
    // Telegram
    if (s.includes('telegram')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
          </svg>
        </div>
      );
    }
    // Google
    if (s.includes('google') || s.includes('gmail')) {
      return (
        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3 h-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </div>
      );
    }
    // Snapchat / Synapse
    if (s.includes('snap') || s.includes('synapse')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shrink-0 shadow-2xs font-black text-[10px]">
          👻
        </div>
      );
    }
    // TikTok
    if (s.includes('tiktok')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px]">
          🎵
        </div>
      );
    }
    // Facebook / Meta
    if (s.includes('facebook') || s.includes('meta')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[11px]">
          f
        </div>
      );
    }
    // Apple
    if (s.includes('apple') || s.includes('icloud')) {
      return (
        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px]">
          
        </div>
      );
    }
    // Amazon
    if (s.includes('amazon')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#FF9900] text-slate-900 flex items-center justify-center shrink-0 shadow-2xs font-black text-[10px]">
          a
        </div>
      );
    }
    // Microsoft
    if (s.includes('microsoft')) {
      return (
        <div className="w-5 h-5 rounded-xs bg-white border border-slate-200 p-0.5 flex flex-wrap gap-0.5 items-center justify-center shrink-0 shadow-2xs">
          <div className="w-1.5 h-1.5 bg-[#F25022]" />
          <div className="w-1.5 h-1.5 bg-[#7FBA00]" />
          <div className="w-1.5 h-1.5 bg-[#00A4EF]" />
          <div className="w-1.5 h-1.5 bg-[#FFB900]" />
        </div>
      );
    }
    // Binance
    if (s.includes('binance')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#F3BA2F] text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-black text-[10px]">
          ◆
        </div>
      );
    }
    // Netflix
    if (s.includes('netflix')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-[#E50914] flex items-center justify-center shrink-0 shadow-2xs font-black text-[11px]">
          N
        </div>
      );
    }
    // Uber
    if (s.includes('uber')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px]">
          Uber
        </div>
      );
    }
    // IMO
    if (s.includes('imo')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#00AEEF] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[9px]">
          imo
        </div>
      );
    }
    // Instagram
    if (s.includes('instagram')) {
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px]">
          📸
        </div>
      );
    }
    // Twitter / X
    if (s.includes('twitter') || s.includes('x.com')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px]">
          𝕏
        </div>
      );
    }
    // Default fallback initial badge
    const initial = (sid || 'A').charAt(0).toUpperCase();
    return (
      <div className="w-5 h-5 rounded-md bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/60 dark:text-lime-400 font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
        {initial}
      </div>
    );
  };

  // Helper to mask OTP code in message body text (matches Switchfy / KSI IPRN live test design)
  const renderMaskedMessageBody = (text: string, isRevealed: boolean) => {
    if (!text) return '';
    if (isRevealed) return text;
    // Mask G-XXXXXX or 4-8 digit codes in body text with asterisks
    return text.replace(/\b([0-9]{4,8})\b/g, '••••••').replace(/G-([0-9]{4,8})/gi, 'G-••••••');
  };
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
              const rawOtp = log.otp || (log.text && (log.text.match(/\b\d{4,8}\b/) || [''])[0]) || '';
              const isRevealed = revealedOtpIds.has(logKey);

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

                      {/* Line 3: Social Media / App Brand Logo + Sender badge + Cost pill */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {renderBrandLogo(log.sid)}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {log.sid || 'AUTHMSG'}
                        </span>
                        <div className="px-2 py-0.5 rounded-sm bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/50 dark:text-lime-400 text-[11px] font-bold">
                          {log.cost || '0.0100 USD'}
                        </div>
                      </div>

                      {/* Line 4: Message Body with masked OTP text (matching Switchfy / KSI panel) */}
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-1 select-text">
                        {renderMaskedMessageBody(log.text, isRevealed)}
                      </p>

                      {/* Line 5: Masked / Hidden OTP Pill with Eye Toggle and Copy */}
                      {rawOtp && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            OTP CODE:
                          </span>
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs tracking-wider shadow-2xs">
                            <span className={isRevealed ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400 tracking-widest'}>
                              {isRevealed ? rawOtp : '••••••'}
                            </span>
                            
                            {/* Toggle Reveal / Hide */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRevealOtp(logKey);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                              title={isRevealed ? 'Hide OTP' : 'Show OTP'}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Copy OTP */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(rawOtp);
                                setCopiedId(`otp-${logKey}`);
                                setTimeout(() => setCopiedId(null), 1800);
                              }}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                              title="Copy Real OTP"
                            >
                              {copiedId === `otp-${logKey}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Clipboard className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
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
