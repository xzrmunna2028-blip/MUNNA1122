import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MessageSquare,
  Check,
  AlertTriangle,
  Layers,
  Phone,
  UserCheck,
  RefreshCw,
  Search,
  FolderOpen,
  ChevronUp,
  ChevronDown,
  List,
  Database,
} from 'lucide-react';

// SMS log interface for realistic dynamic filtering
interface SmsLog {
  timestamp: string; // ISO string
  status: 'DELIVERED' | 'FAILED';
  termination: string;
  number: string;
  sid: string;
}

const SAMPLE_SMS_LOGS: SmsLog[] = [];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL_MAP: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
};

const YEARS = Array.from({ length: 151 }, (_, i) => String(1950 + i)); // 1950 to 2100 (supports past and far future)
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

interface WheelColumnProps {
  options: string[];
  currentValue: string;
  onValueChange: (val: string) => void;
}

const WheelColumn: React.FC<WheelColumnProps> = ({ options, currentValue, onValueChange }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const currentIndex = options.indexOf(currentValue);
  const lastIndexRef = React.useRef(currentIndex);
  const isScrollingRef = React.useRef(false);

  // Sync scroll position with currentValue changes
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const targetScrollTop = currentIndex * 40;
    if (Math.abs(el.scrollTop - targetScrollTop) > 2) {
      el.scrollTo({
        top: targetScrollTop,
        behavior: 'auto' // Instant adjustment when value is set, loaded, or reset
      });
    }
    lastIndexRef.current = currentIndex;
  }, [currentIndex, options]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    // Calculate current index based on scroll position
    const index = Math.round(el.scrollTop / 40);
    if (index >= 0 && index < options.length) {
      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        onValueChange(options[index]);
      }
    }
  };

  // Helper to scroll to a specific item when clicked
  const handleItemClick = (index: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: index * 40,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative h-[120px] w-full flex items-center justify-center select-none overflow-hidden">
      {/* Hide scrollbars styling injection */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Visual Indicator Lines for the Active Row (styled above and below like the user image) */}
      <div className="absolute left-1 right-1 top-[40px] h-[1.5px] bg-slate-800 dark:bg-slate-300 opacity-60 rounded-full pointer-events-none" />
      <div className="absolute left-1 right-1 top-[80px] h-[1.5px] bg-slate-800 dark:bg-slate-300 opacity-60 rounded-full pointer-events-none" />

      {/* Actual Scrollable Snapped Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar py-10 cursor-ns-resize"
      >
        {/* Top Spacer to allow first item center alignment */}
        <div className="h-10 shrink-0" />

        {/* Options List */}
        {options.map((opt, idx) => {
          const isActive = idx === currentIndex;
          const isNeighbor = Math.abs(idx - currentIndex) === 1;

          return (
            <div
              key={idx}
              onClick={() => handleItemClick(idx)}
              className="h-10 flex items-center justify-center snap-center shrink-0 cursor-pointer select-none transition-all duration-100"
            >
              <span
                className={`text-center tracking-wide text-xs transition-all duration-100 ${
                  isActive
                    ? 'text-slate-900 dark:text-white font-black scale-110'
                    : isNeighbor
                    ? 'text-slate-400 dark:text-slate-500 font-semibold scale-95 opacity-60'
                    : 'text-slate-300 dark:text-slate-700 font-medium scale-90 opacity-25'
                }`}
              >
                {opt}
              </span>
            </div>
          );
        })}

        {/* Bottom Spacer to allow last item center alignment */}
        <div className="h-10 shrink-0" />
      </div>
    </div>
  );
};

export const SmsStatisticsView: React.FC = () => {
  // Input fields state - dynamically spanning last 30 days to end of today
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}/${day}/${d.getFullYear()}, 12:00 AM`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}/${day}/${d.getFullYear()}, 11:59:59 PM`;
  });
  
  // Applied stats state (active by default to show live stats immediately)
  const [hasApplied, setHasApplied] = useState(true);
  const [showFailedLogs, setShowFailedLogs] = useState(false);

  // Real SMS Logs from IPRN API & LocalStorage
  const [realSmsLogs, setRealSmsLogs] = useState<SmsLog[]>([]);
  const [isApiSyncing, setIsApiSyncing] = useState(false);
  const [lastApiSync, setLastApiSync] = useState<string>('');

  const currentLoggedUser = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();

  const fetchStatsFromApi = () => {
    try {
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

      // If user has not rented numbers, always display zero logs
      if (userNums.length === 0) {
        setRealSmsLogs([]);
        return;
      }

      const existing = localStorage.getItem(`real_sms_logs_${currentLoggedUser}`);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((l: any) => {
            if (!l) return false;
            const clean = String(l.number || '').replace(/[^0-9]/g, '');
            return userNums.some(un => clean.includes(un) || un.includes(clean));
          });
          setRealSmsLogs(filtered);
          return;
        }
      }
      setRealSmsLogs([]);
    } catch (e) {
      setRealSmsLogs([]);
    }
  };

  const handleSyncWithIprn = async () => {
    setIsApiSyncing(true);
    try {
      await fetch('/api/trigger-sync', { method: 'POST' });
      await fetchStatsFromApi();
    } catch (e) {
      console.error('IPRN API trigger-sync error:', e);
    } finally {
      setIsApiSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatsFromApi();

    const handleSync = () => fetchStatsFromApi();
    window.addEventListener('storage', handleSync);
    window.addEventListener('user_sms_updated', handleSync);
    window.addEventListener('real_sms_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('user_sms_updated', handleSync);
      window.removeEventListener('real_sms_updated', handleSync);
    };
  }, []);

  // Picker Modal state
  const [activePicker, setActivePicker] = useState<'from' | 'to' | 'none'>('none');

  // Temporary picker states while inside modal
  const [selMonth, setSelMonth] = useState('Aug');
  const [selDay, setSelDay] = useState('08');
  const [selYear, setSelYear] = useState('2026');
  const [selHour, setSelHour] = useState('12');
  const [selMin, setSelMin] = useState('00');
  const [selSec, setSelSec] = useState('00'); // Track for "to" date if needed
  const [selPeriod, setSelPeriod] = useState('AM');

  // Helper to open picker with pre-filled state based on string value
  const openDatePicker = (type: 'from' | 'to') => {
    const val = type === 'from' ? dateFrom : dateTo;
    try {
      // Format: MM/DD/YYYY, hh:mm:ss AM or MM/DD/YYYY, hh:mm AM
      const parts = val.split(', ');
      if (parts.length >= 2) {
        const dateParts = parts[0].split('/');
        const timeParts = parts[1].split(' ');
        
        const mIdx = parseInt(dateParts[0]) - 1;
        const mStr = MONTHS[mIdx] || 'Aug';
        const dStr = dateParts[1] || '08';
        const yStr = dateParts[2] || '2026';
        
        const hmParts = timeParts[0].split(':');
        const hStr = hmParts[0] || '12';
        const minStr = hmParts[1] || '00';
        const secStr = hmParts[2] || '00';
        const pStr = timeParts[1] || 'AM';

        setSelMonth(mStr);
        setSelDay(dStr);
        setSelYear(yStr);
        setSelHour(hStr);
        setSelMin(minStr);
        setSelSec(secStr);
        setSelPeriod(pStr);
      }
    } catch (e) {
      // Fallback
      if (type === 'from') {
        setSelMonth('Aug'); setSelDay('08'); setSelYear('2026'); setSelHour('12'); setSelMin('00'); setSelSec('00'); setSelPeriod('AM');
      } else {
        setSelMonth('Sep'); setSelDay('07'); setSelYear('2026'); setSelHour('11'); setSelMin('59'); setSelSec('59'); setSelPeriod('PM');
      }
    }
    setActivePicker(type);
  };

  // Convert selected picker states into final display string
  const handleSetPicker = () => {
    const mNum = MONTHS_FULL_MAP[selMonth] || '08';
    const dStr = selDay.padStart(2, '0');
    const yStr = selYear;
    const hStr = selHour.padStart(2, '0');
    const minStr = selMin.padStart(2, '0');
    const pStr = selPeriod;

    if (activePicker === 'from') {
      setDateFrom(`${mNum}/${dStr}/${yStr}, ${hStr}:${minStr} ${pStr}`);
    } else {
      // For To Date, include seconds exactly like in screenshot: 09/07/2026, 11:59:59 PM
      const secStr = selMin === '59' ? '59' : '00';
      setDateTo(`${mNum}/${dStr}/${yStr}, ${hStr}:${minStr}:${secStr} ${pStr}`);
    }
    setActivePicker('none');
  };

  // Standard Clear & Cancel buttons inside Picker Modal
  const handleClearPicker = () => {
    setSelMonth('Jan');
    setSelDay('01');
    setSelYear('2026');
    setSelHour('12');
    setSelMin('00');
    setSelSec('00');
    setSelPeriod('AM');
  };

  // Calculate stats based on date input ranges
  const parseInputDate = (dateStr: string): Date => {
    try {
      // e.g. "08/08/2026, 12:00 AM" -> Year 2026, Month 07 (Aug), Day 08, Hour 0, Min 0
      const parts = dateStr.split(', ');
      const dateParts = parts[0].split('/');
      const timeParts = parts[1].split(' ');
      
      const month = parseInt(dateParts[0]) - 1;
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      const hm = timeParts[0].split(':');
      let hour = parseInt(hm[0]);
      const min = parseInt(hm[1]);
      const sec = hm[2] ? parseInt(hm[2]) : 0;
      const ampm = timeParts[1];

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      return new Date(year, month, day, hour, min, sec);
    } catch (e) {
      return new Date();
    }
  };

  const handleApply = () => {
    setHasApplied(true);
  };

  const handleReset = () => {
    setHasApplied(true);
    const dFrom = new Date();
    dFrom.setDate(dFrom.getDate() - 30);
    const m1 = String(dFrom.getMonth() + 1).padStart(2, '0');
    const day1 = String(dFrom.getDate()).padStart(2, '0');
    setDateFrom(`${m1}/${day1}/${dFrom.getFullYear()}, 12:00 AM`);

    const dTo = new Date();
    dTo.setDate(dTo.getDate() + 1);
    const m2 = String(dTo.getMonth() + 1).padStart(2, '0');
    const day2 = String(dTo.getDate()).padStart(2, '0');
    setDateTo(`${m2}/${day2}/${dTo.getFullYear()}, 11:59:59 PM`);
    setShowFailedLogs(false);
  };

  // Get filtered logs if applied
  const fromDateObj = parseInputDate(dateFrom);
  const toDateObj = parseInputDate(dateTo);

  const filteredLogs = realSmsLogs.filter((log) => {
    const logDate = new Date(log.timestamp);
    if (isNaN(logDate.getTime())) return true;
    return logDate >= fromDateObj && logDate <= toDateObj;
  });

  // Calculate counts
  const totalCount = hasApplied ? filteredLogs.length : 0;
  const deliveredCount = hasApplied ? filteredLogs.filter(l => l.status === 'DELIVERED').length : 0;
  const failedCount = hasApplied ? filteredLogs.filter(l => l.status === 'FAILED').length : 0;

  const uniqueTerminations = hasApplied 
    ? Array.from(new Set(filteredLogs.map(l => l.termination))) 
    : [];
  const terminationsCount = uniqueTerminations.length;

  const uniqueNumbers = hasApplied
    ? Array.from(new Set(filteredLogs.map(l => l.number)))
    : [];
  const numbersCount = uniqueNumbers.length;

  const uniqueSids = hasApplied
    ? Array.from(new Set(filteredLogs.map(l => l.sid)))
    : [];
  const sidsCount = uniqueSids.length;

  // Grouped Terminations stats for table
  const terminationsData = uniqueTerminations.map((term) => {
    const termLogs = filteredLogs.filter(l => l.termination === term);
    const total = termLogs.length;
    const delivered = termLogs.filter(l => l.status === 'DELIVERED').length;
    const failed = termLogs.filter(l => l.status === 'FAILED').length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return {
      name: term,
      total,
      delivered,
      failed,
      rate,
    };
  });

  // Days list calculation for picker (depends on selected month & year)
  const getDaysInMonth = (monthName: string, yearStr: string) => {
    const monthIdx = MONTHS.indexOf(monthName);
    const year = parseInt(yearStr);
    const date = new Date(year, monthIdx + 1, 0);
    return date.getDate();
  };

  const daysCount = getDaysInMonth(selMonth, selYear);
  const DAYS = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, '0'));

  // Ensure selected day is not out of range
  const safeSelDay = parseInt(selDay) > daysCount ? String(daysCount).padStart(2, '0') : selDay;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Nav Bar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
        <span>Dashboard</span>
        <span className="text-[10px] opacity-60">/</span>
        <span>Client System</span>
        <span className="text-[10px] opacity-60">/</span>
        <span className="text-[#65a30d] dark:text-lime-500">SMS Statistics</span>
      </div>

      {/* Primary Title Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My SMS Statistics
        </h1>
      </div>

      {/* Filters Form Box Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-800 dark:text-white tracking-wide">
            Filters
          </span>
          <span className="text-[9px] font-black tracking-widest text-[#65a30d] bg-lime-50 dark:bg-lime-950/30 px-2 py-0.5 rounded-md uppercase border border-lime-200/20">
            DATE RANGE
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date From Field Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                Date from
              </label>
              <div 
                onClick={() => openDatePicker('from')}
                className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/50 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {dateFrom}
                </span>
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400 stroke-[1.5]" />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Date To Field Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                Date to
              </label>
              <div 
                onClick={() => openDatePicker('to')}
                className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-950/50 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer transition"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {dateTo}
                </span>
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400 stroke-[1.5]" />
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Apply and Reset Button Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#65a30d] hover:bg-[#52840a] transition-all cursor-pointer shadow-md shadow-lime-950/10"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSyncWithIprn}
              disabled={isApiSyncing}
              title="Synchronize real-time stats directly with IPRN API"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApiSyncing ? 'animate-spin' : ''}`} />
              <span>{isApiSyncing ? 'Syncing...' : 'Sync IPRN API'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Grid Metrics Dashboard Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total Messages */}
        <div className="bg-white dark:bg-slate-900 border-t-2 border-t-[#65a30d] border-x border-b border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Total Messages
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {totalCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#65a30d] stroke-[2]" />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            Delivered and refused
          </p>
        </div>

        {/* Card 2: Delivered */}
        <div className="bg-white dark:bg-slate-900 border-t-2 border-t-emerald-500 border-x border-b border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Delivered
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {deliveredCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            Confirmed by the operator
          </p>
        </div>

        {/* Card 3: Failed */}
        <div className="bg-white dark:bg-slate-900 border-t-2 border-t-rose-500 border-x border-b border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Failed
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {failedCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[2]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {failedCount > 0 ? `${failedCount} refused logs found` : 'Nothing refused or undelivered'}
            </p>
            {hasApplied && failedCount > 0 && (
              <button 
                onClick={() => setShowFailedLogs(!showFailedLogs)}
                className="text-[10px] font-extrabold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition"
              >
                <List className="w-3 h-3" />
                <span>Click to view</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Terminations */}
        <div className="bg-white dark:bg-slate-900 border-t-2 border-t-amber-500 border-x border-b border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Terminations
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {terminationsCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-500 stroke-[2]" />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            Routes with traffic
          </p>
        </div>

        {/* Card 5: Numbers */}
        <div className="bg-white dark:bg-slate-900 border-t-2 border-t-[#65a30d] border-x border-b border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                Numbers
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {numbersCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-lime-50 dark:bg-lime-950/20 flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#65a30d] stroke-[2]" />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            MSISDNs that received
          </p>
        </div>

        {/* Card 6: Sids */}
        <div className="bg-white dark:bg-slate-900 border-t-2 border-t-blue-500 border-x border-b border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 relative flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                SIDs
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                {sidsCount}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-500 stroke-[2]" />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            Distinct senders
          </p>
        </div>
      </div>

      {/* Failed Logs Dropdown Panel */}
      {showFailedLogs && hasApplied && failedCount > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/40 rounded-2xl p-5 space-y-3 shadow-md animate-fade-in">
          <h3 className="text-xs font-extrabold text-rose-500 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Refused / Undelivered SMS Logs</span>
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-400">
            {filteredLogs.filter(l => l.status === 'FAILED').map((log, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center gap-4">
                <span className="text-slate-800 dark:text-white">{log.number}</span>
                <span className="text-slate-400 dark:text-slate-500 font-semibold">{log.termination}</span>
                <span className="text-rose-500 font-extrabold">{log.sid}</span>
                <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terminations Section Table or Empty Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#65a30d]" />
          <span className="text-sm font-extrabold text-[#65a30d] dark:text-lime-500 tracking-wide">
            Terminations
          </span>
        </div>

        {/* Dynamic Condition */}
        {!hasApplied || terminationsCount === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[250px]">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <FolderOpen className="w-6 h-6 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                No data found
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm">
                No SMS statistics available for the selected period.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold text-slate-600 dark:text-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/50">
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black">Route / Termination</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black text-center">Total SMS</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black text-center">Delivered</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black text-center">Failed</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black text-center">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {terminationsData.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 text-slate-900 dark:text-white font-extrabold">{t.name}</td>
                    <td className="p-4 text-center font-black text-slate-800 dark:text-slate-300">{t.total}</td>
                    <td className="p-4 text-center text-emerald-500 font-extrabold">{t.delivered}</td>
                    <td className="p-4 text-center text-rose-500 font-extrabold">{t.failed}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        t.rate >= 90 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' :
                        t.rate >= 50 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                        'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                      }`}>
                        {t.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Date-Time Picker Dialog Overlay (Wheel Selector style) */}
      {activePicker !== 'none' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[28px] overflow-hidden shadow-2xl p-6 relative flex flex-col space-y-5 border border-slate-200/50 dark:border-slate-800 animate-scale-up">
            
            {/* Modal Title Header */}
            <div className="text-left">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Set date and time
              </h2>
            </div>

            {/* Date and Time Wheels Container */}
            <div className="space-y-2">
              
              {/* DATE Wheel Set (Month, Day, Year) */}
              <div className="grid grid-cols-3 gap-2">
                <WheelColumn options={MONTHS} currentValue={selMonth} onValueChange={setSelMonth} />
                <WheelColumn options={DAYS} currentValue={safeSelDay} onValueChange={setSelDay} />
                <WheelColumn options={YEARS} currentValue={selYear} onValueChange={setSelYear} />
              </div>

              {/* Thin divider */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 my-1" />

              {/* TIME Wheel Set (Hour, Minute, Period) */}
              <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-2 items-center">
                <WheelColumn options={HOURS} currentValue={selHour} onValueChange={setSelHour} />
                <div className="flex flex-col items-center justify-center h-[120px] select-none">
                  <span className="text-sm font-extrabold text-slate-400 dark:text-slate-500">:</span>
                </div>
                <WheelColumn options={MINUTES} currentValue={selMin} onValueChange={setSelMin} />
                <WheelColumn options={PERIODS} currentValue={selPeriod} onValueChange={setSelPeriod} />
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleClearPicker}
                className="text-xs font-bold text-[#65a30d] dark:text-lime-500 hover:text-lime-600 transition"
              >
                Clear
              </button>
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setActivePicker('none')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetPicker}
                  className="text-xs font-bold text-[#65a30d] dark:text-lime-500 hover:text-lime-600 transition"
                >
                  Set
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
