import React, { useState, useEffect, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Trash2, 
  Download, 
  Search, 
  Layers, 
  Mail 
} from 'lucide-react';

interface SmsLog {
  timestamp: string;
  status: 'DELIVERED' | 'FAILED';
  termination: string;
  number: string;
  sid: string;
  cost?: string;
  text: string;
}

export const LiveTestSmsView: React.FC = () => {
  // Live controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [liveLogs, setLiveLogs] = useState<SmsLog[]>([]);

  // Defined premium gateway routes matching user platform design
  const routes = [
    { name: 'Ecuador - CNT 10', prefix: '+593', defaultNum: '593996993564', cost: '0.0000 USD', flag: 'EC' },
    { name: 'Ecuador - CNT 2', prefix: '+593', defaultNum: '593996893355', cost: '0.0000 USD', flag: 'EC' },
    { name: 'Benin - Celtiis 102', prefix: '+229', defaultNum: '2290145205298', cost: '0.0000 USD', flag: 'BJ' },
    { name: 'Benin - All Networks 88', prefix: '+229', defaultNum: '2290160562020', cost: '0.0000 USD', flag: 'BJ' },
    { name: 'Bolivia - Orange', prefix: '+591', defaultNum: '59171234567', cost: '0.0000 USD', flag: 'BO' },
    { name: 'Bangladesh - Grameenphone', prefix: '+880', defaultNum: '8801723849583', cost: '0.0000 USD', flag: 'BD' },
    { name: 'United Kingdom - Vodafone', prefix: '+44', defaultNum: '447385293847', cost: '0.0000 USD', flag: 'GB' },
    { name: 'Algeria - Mobilis 101', prefix: '+213', defaultNum: '213673859086', cost: '0.0000 USD', flag: 'DZ' },
    { name: 'Azerbaijan - Bakcell 3', prefix: '+994', defaultNum: '994997780131', cost: '0.0000 USD', flag: 'AZ' },
  ];

  // Sound generator
  const playSmsSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio fallback
    }
  };

  // Sync logs
  const loadLogs = () => {
    const existing = localStorage.getItem('real_sms_logs');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        setLiveLogs(parsed.map((l: any) => ({ ...l, cost: '0.0000 USD' })));
        return;
      } catch (e) {}
    }
    setLiveLogs([]);
  };

  useEffect(() => {
    loadLogs();
    const handleSync = () => loadLogs();
    window.addEventListener('real_sms_updated', handleSync);
    return () => {
      window.removeEventListener('real_sms_updated', handleSync);
    };
  }, []);

  // Mask OTP codes in text body
  const maskSmsOtp = (text: string): string => {
    let masked = text.replace(/\b\d{3}-\d{3}\b/g, 'XXX-XXX');
    masked = masked.replace(/\b\d{4,8}\b/g, (match) => 'X'.repeat(match.length));
    return masked;
  };

  const handleClear = () => {
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
    window.dispatchEvent(new Event('real_sms_updated'));
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const headers = 'Timestamp,Number,Route/Termination,SenderID,Cost,Status,Message\n';
    const rows = filteredLogs.map(m => 
      `"${m.timestamp}","${m.number}","${m.termination}","${m.sid}","${m.cost || '0.0000 USD'}","${m.status}","${m.text.replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `live_sms_stream_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flag renderer
  const renderFlag = (termination: string) => {
    if (termination.includes('Ecuador')) {
      return (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200/50 dark:border-slate-800 relative">
          <div className="h-1/2 bg-[#FFD700]" />
          <div className="h-1/4 bg-[#0030a0]" />
          <div className="h-1/4 bg-[#D21034]" />
        </div>
      );
    }
    if (termination.includes('Benin')) {
      return (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex shadow-xs shrink-0 border border-slate-200/50 dark:border-slate-800">
          <div className="w-[35%] bg-[#008751]" />
          <div className="w-[65%] flex flex-col h-full">
            <div className="h-1/2 bg-[#fcd116]" />
            <div className="h-1/2 bg-[#e8112d]" />
          </div>
        </div>
      );
    }
    if (termination.includes('Bolivia')) {
      return (
        <div className="w-8 h-8 rounded-lg overflow-hidden flex flex-col shadow-xs shrink-0 border border-slate-200/50 dark:border-slate-800">
          <div className="h-1/3 bg-[#D52B1E]" />
          <div className="h-1/3 bg-[#F9E300]" />
          <div className="h-1/3 bg-[#007934]" />
        </div>
      );
    }
    if (termination.includes('Bangladesh')) {
      return (
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#006a4e] flex items-center justify-center relative shadow-xs shrink-0 border border-slate-200/50 dark:border-slate-800">
          <div className="w-3.5 h-3.5 rounded-full bg-[#f42a41]" />
        </div>
      );
    }
    return <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px]">🌐</div>;
  };

  // Stats
  const totalMessagesCount = liveLogs.length;
  
  const rangesCount = useMemo(() => {
    const prefixes = new Set<string>();
    liveLogs.forEach(log => {
      const matched = routes.find(r => log.termination.includes(r.name.split(' - ')[0]));
      if (matched) {
        prefixes.add(matched.prefix);
      } else {
        prefixes.add(log.number.substring(0, 3));
      }
    });
    return prefixes.size;
  }, [liveLogs]);

  // Filters
  const filteredLogs = useMemo(() => {
    return liveLogs.filter(log => {
      const matchesSearch = 
        !searchTerm ||
        log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.number.includes(searchTerm) ||
        log.termination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.sid.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesCountry = selectedCountry === 'All' || log.termination.includes(selectedCountry);
      return matchesSearch && matchesCountry;
    });
  }, [liveLogs, searchTerm, selectedCountry]);

  const totalPages = Math.ceil(filteredLogs.length / perPage) || 1;
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredLogs.slice(startIndex, startIndex + perPage);
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
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
        <span>Dashboard</span>
        <span>/</span>
        <span>Test System</span>
        <span>/</span>
        <span className="text-[#65a30d] font-bold">Live Test SMS</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                TOTAL MESSAGES
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-850 dark:text-white tracking-tight">
                {totalMessagesCount}
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Live Stream
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-lime-50 dark:bg-lime-950/20 text-[#65a30d] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#65a30d]" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                RANGES
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-850 dark:text-white tracking-tight">
                {rangesCount}
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Receiving traffic
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-lime-50 dark:bg-lime-950/20 text-[#65a30d] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#65a30d]" />
        </div>
      </div>

      {/* Message Stream */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Message stream
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                real-time feed
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  soundEnabled 
                    ? 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950/30 dark:border-lime-800 dark:text-lime-400'
                    : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search messages, phone numbers, countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="All">All Countries</option>
                <option value="Benin">Benin</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Bangladesh">Bangladesh</option>
              </select>

              <button
                onClick={handleClear}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleExport}
                className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stream List */}
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs font-bold text-slate-400">No test messages in live stream.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedLogs.map((log, index) => (
                <div key={index} className="py-3 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 px-2 rounded-xl transition">
                  {renderFlag(log.termination)}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {log.sid}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {log.number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                          {log.termination}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      {maskSmsOtp(log.text)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
