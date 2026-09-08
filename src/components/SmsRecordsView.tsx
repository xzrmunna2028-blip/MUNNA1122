import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Calendar,
  RotateCw,
  FileSpreadsheet,
  ChevronDown,
  Check,
  Plus,
  X,
  Shuffle,
  ArrowUpDown
} from 'lucide-react';

interface SmsRecordItem {
  timestampDate: string; // e.g. "2026-09-06"
  timestampTime: string; // e.g. "21:55:35 UTC"
  brand: string;     // e.g. "TikTok"
  logoType: 'tiktok' | 'facebook' | 'apple' | 'google' | 'telegram' | 'whatsapp' | 'letter';
  logoLetter?: string; // e.g. "A", "B", "1"
  logoBg?: string;     // Tailwind bg class
  senderId: string;    // e.g. "TikTok" or "AUTHMSG"
  destination: string; // e.g. "233597472944"
  country: string;     // e.g. "Ghana"
  operator: string;    // e.g. "Mtn 4"
  prefix: string;      // e.g. "233"
  message: string;     // e.g. "Your Avalanche Card verification code is: XXXXXX"
}

interface SmsLog {
  timestamp: string;
  status: 'DELIVERED' | 'FAILED';
  termination: string;
  number: string;
  sid: string;
}

interface RentedNumber {
  id: string;
  number: string;
  range: string;
  operator: string;
  status: 'ACTIVE' | 'PENDING';
  cost: string;
  expiry: string;
  term?: string;
  lastMessage?: string;
  portalLimit?: string;
  sidRange?: string;
  multiLimit?: string;
  sidDidLimit?: string;
}

export const SmsRecordsView: React.FC = () => {
  // Pre-seeded records - empty for real-time mode
  const preseededRecords: SmsRecordItem[] = [];

  // State definitions
  const [records, setRecords] = useState<SmsRecordItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('3:56:58 AM');

  // Filter States
  const [filterDateFrom, setFilterDateFrom] = useState<string>('08/08/2026, 12:00 AM');
  const [filterDateTo, setFilterDateTo] = useState<string>('09/07/2026, 11:59:59 PM');
  const [filterSid, setFilterSid] = useState<string>('');
  const [filterPrefix, setFilterPrefix] = useState<string>('');
  const [filterRange, setFilterRange] = useState<string>('All Ranges');

  // Actual applied filter values
  const [appliedDateFrom, setAppliedDateFrom] = useState<string>('08/08/2026, 12:00 AM');
  const [appliedDateTo, setAppliedDateTo] = useState<string>('09/07/2026, 11:59:59 PM');
  const [appliedSid, setAppliedSid] = useState<string>('');
  const [appliedPrefix, setAppliedPrefix] = useState<string>('');
  const [appliedRange, setAppliedRange] = useState<string>('All Ranges');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Add numbers dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SmsRecordItem | null>(null);
  const [numCount, setNumCount] = useState<number>(1);
  const [numInputStr, setNumInputStr] = useState<string>('1');
  const [orderType, setOrderType] = useState<'serial' | 'random'>('serial');
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [modalStep, setModalStep] = useState<'form' | 'confirm' | 'success'>('form');

  // Custom code conversion helper
  const convertCustomLog = (log: SmsLog): SmsRecordItem => {
    const countryParts = log.termination.split(' - ');
    const country = countryParts[0] || 'Unknown';
    const operator = countryParts[1] || 'Operator';
    
    const sidLower = log.sid.toLowerCase();
    let logoType: SmsRecordItem['logoType'] = 'letter';
    if (sidLower.includes('tiktok')) logoType = 'tiktok';
    else if (sidLower.includes('facebook')) logoType = 'facebook';
    else if (sidLower.includes('apple')) logoType = 'apple';
    else if (sidLower.includes('google')) logoType = 'google';
    else if (sidLower.includes('telegram')) logoType = 'telegram';
    else if (sidLower.includes('whatsapp')) logoType = 'whatsapp';

    const dateObj = new Date(log.timestamp);
    const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '2026-09-06';
    const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toTimeString().split(' ')[0] + ' UTC' : '21:50:00 UTC';

    return {
      timestampDate: dateStr,
      timestampTime: timeStr,
      brand: log.sid,
      logoType,
      logoLetter: log.sid.charAt(0).toUpperCase() || 'S',
      logoBg: 'bg-sky-500 text-white',
      senderId: log.sid,
      destination: log.number,
      country,
      operator,
      prefix: log.number.slice(0, 3) || '1',
      message: `Your requested verification code for ${log.sid} is ${Math.floor(100000 + Math.random() * 900000)}. Proceed securely.`
    };
  };

  const loadAllRecords = async () => {
    try {
      const res = await fetch('/api/active-sms');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs) && data.logs.length > 0) {
          const customItems = (data.logs as SmsLog[]).map(convertCustomLog);
          setRecords(customItems);
          localStorage.setItem('real_sms_logs', JSON.stringify(data.logs));
          return;
        }
      }
    } catch (e) {}

    const existing = localStorage.getItem('real_sms_logs');
    let customItems: SmsRecordItem[] = [];
    if (existing) {
      try {
        const parsed = JSON.parse(existing) as SmsLog[];
        customItems = parsed.map(convertCustomLog);
      } catch (e) {
        // ignore
      }
    }
    setRecords([...customItems, ...preseededRecords]);
  };

  useEffect(() => {
    loadAllRecords();
    window.addEventListener('storage', loadAllRecords);
    window.addEventListener('real_sms_updated', loadAllRecords);
    const interval = setInterval(loadAllRecords, 10000);
    return () => {
      window.removeEventListener('storage', loadAllRecords);
      window.removeEventListener('real_sms_updated', loadAllRecords);
      clearInterval(interval);
    };
  }, []);

  // Update current time on refresh click
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastRefreshedTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      loadAllRecords();
    }, 600);
  };

  // Export Excel CSV
  const handleExportExcel = () => {
    const headers = ['Date', 'Time', 'Source (SID)', 'Destination', 'Country', 'Operator', 'Prefix', 'Message'];
    const rows = filtered.map(item => [
      item.timestampDate,
      item.timestampTime,
      item.brand,
      item.destination,
      item.country,
      item.operator,
      item.prefix,
      item.message
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sms_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all filters to default screenshot values
  const handleResetFilters = () => {
    setFilterDateFrom('08/08/2026, 12:00 AM');
    setFilterDateTo('09/07/2026, 11:59:59 PM');
    setFilterSid('');
    setFilterPrefix('');
    setFilterRange('All Ranges');

    setAppliedDateFrom('08/08/2026, 12:00 AM');
    setAppliedDateTo('09/07/2026, 11:59:59 PM');
    setAppliedSid('');
    setAppliedPrefix('');
    setAppliedRange('All Ranges');
    setCurrentPage(1);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedDateFrom(filterDateFrom);
    setAppliedDateTo(filterDateTo);
    setAppliedSid(filterSid);
    setAppliedPrefix(filterPrefix);
    setAppliedRange(filterRange);
    setCurrentPage(1);
  };

  // Filter implementation
  const filtered = records.filter((rec) => {
    // 1. SID Filter (matches senderId or brand)
    if (appliedSid.trim() !== '') {
      const matchSid = rec.senderId.toLowerCase().includes(appliedSid.toLowerCase()) || 
                       rec.brand.toLowerCase().includes(appliedSid.toLowerCase());
      if (!matchSid) return false;
    }

    // 2. Prefix Filter
    if (appliedPrefix.trim() !== '') {
      const matchPrefix = rec.destination.startsWith(appliedPrefix) || rec.prefix.startsWith(appliedPrefix);
      if (!matchPrefix) return false;
    }

    // 3. Country/Range Filter
    if (appliedRange !== 'All Ranges') {
      if (rec.country.toLowerCase() !== appliedRange.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  // Unique country lists for dropdown range filter
  const countryRanges = Array.from(new Set(records.map(r => r.country))).sort();

  // Pagination bounds
  const totalRecordsCount = filtered.length;
  const totalPagesCount = Math.ceil(totalRecordsCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Modal handlers
  const handleOpenAddNumberModal = (rec: SmsRecordItem) => {
    setSelectedRecord(rec);
    setNumCount(1);
    setNumInputStr('1');
    setOrderType('serial');
    
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiryDate(d.toISOString().split('T')[0]);
    
    setModalStep('form');
    setIsModalOpen(true);
  };

  const handleSetPillValue = (val: number) => {
    setNumCount(val);
    setNumInputStr(val.toString());
  };

  const handleCustomCountChange = (strVal: string) => {
    setNumInputStr(strVal);
    const parsed = parseInt(strVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setNumCount(parsed);
    } else {
      setNumCount(1);
    }
  };

  const handleConfirmAndAddNumber = () => {
    if (!selectedRecord) return;

    // Fetch existing rented numbers from local storage
    const local = localStorage.getItem('rented_numbers');
    let rentedNumbers: RentedNumber[] = [];
    if (local) {
      try {
        rentedNumbers = JSON.parse(local);
      } catch (e) {
        // ignore
      }
    }

    const countToGenerate = numCount > 1000 ? 1000 : numCount;
    const newNumbers: RentedNumber[] = [];

    // Parse chosen expiry date
    const expDate = new Date(expiryDate);
    const expiryStr = expDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    for (let i = 0; i < countToGenerate; i++) {
      let msisdn = selectedRecord.destination;
      if (i > 0) {
        if (orderType === 'serial') {
          try {
            const baseNum = BigInt(selectedRecord.destination);
            msisdn = (baseNum + BigInt(i)).toString();
          } catch (err) {
            msisdn = (Number(selectedRecord.destination) + i).toString();
          }
        } else {
          // Generate realistic random number with correct prefix
          const baseLen = selectedRecord.destination.length;
          const prefLen = selectedRecord.prefix.length;
          const bodyLen = baseLen - prefLen;
          const randomBody = Math.floor(Math.pow(10, bodyLen - 1) + Math.random() * (Math.pow(10, bodyLen) - Math.pow(10, bodyLen - 1) - 1));
          msisdn = `${selectedRecord.prefix}${randomBody}`;
        }
      }

      newNumbers.push({
        id: `NUM-${Math.floor(100000 + Math.random() * 900000)}`,
        number: msisdn,
        range: `${selectedRecord.country} - ${selectedRecord.operator} (${selectedRecord.prefix})`,
        operator: selectedRecord.operator,
        status: 'ACTIVE',
        cost: '0.0000 USD',
        expiry: expiryStr,
        term: '1/1',
        lastMessage: 'Never',
        portalLimit: '10,000',
        sidRange: 'No Limit',
        multiLimit: 'No Limit',
        sidDidLimit: 'No Limit',
      });
    }

    const updatedList = [...newNumbers, ...rentedNumbers];
    localStorage.setItem('rented_numbers', JSON.stringify(updatedList));
    // Dispatch events to keep My Numbers in perfectly real-time synchronization
    window.dispatchEvent(new Event('rented_numbers_updated'));

    setModalStep('success');

    // Auto-dismiss success stage
    setTimeout(() => {
      setIsModalOpen(false);
      setModalStep('form');
    }, 2500);
  };

  return (
    <div className="space-y-6" id="sms-records-main-container">
      {/* Breadcrumbs matching Screenshot 1 */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500" id="sms-records-breadcrumbs">
        <span>Dashboard</span>
        <ChevronDown className="w-3 h-3 rotate-270 opacity-60" />
        <span>Test System</span>
        <ChevronDown className="w-3 h-3 rotate-270 opacity-60" />
        <span className="text-slate-600 dark:text-slate-300">SMS Records</span>
      </div>

      {/* Header and top-level action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="sms-records-header-row">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            SMS Records
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Peer SMS event detail records from the test system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="sms-records-export-btn"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
          <button
            id="sms-records-refresh-btn"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-900 dark:bg-white dark:hover:bg-slate-100 rounded-xl text-xs font-black text-white dark:text-slate-950 transition shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Panel matching Screenshot 1 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs" id="sms-records-filters-card">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Filters</span>
          <span className="text-[10px] font-black text-[#65a30d] dark:text-[#a3e635] tracking-widest bg-[#65a30d]/10 px-2 py-0.5 rounded-sm">REFINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date From */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">Date from</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="filter-date-from"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                placeholder="Date from"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">Date to</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="filter-date-to"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                placeholder="Date to"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
              />
            </div>
          </div>

          {/* SID */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">SID (sender ID)</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="filter-sid"
                value={filterSid}
                onChange={(e) => setFilterSid(e.target.value)}
                placeholder="Enter sender ID..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
              />
            </div>
          </div>

          {/* Prefix */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">Prefix</label>
            <input
              type="text"
              id="filter-prefix"
              value={filterPrefix}
              onChange={(e) => setFilterPrefix(e.target.value)}
              placeholder="e.g. 44, 1, 62..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
            />
          </div>

          {/* Range Dropdown */}
          <div className="relative">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">Range</label>
            <div className="relative">
              <select
                id="filter-range"
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
              >
                <option value="All Ranges">All Ranges</option>
                {countryRanges.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Action Buttons */}
        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/40">
          <button
            id="apply-filters-btn"
            onClick={handleApplyFilters}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black shadow-xs transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Apply filters</span>
          </button>
          <button
            id="reset-filters-btn"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-850 transition shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Records Card matching Screenshot 1 & 2 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs" id="sms-records-table-card">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm font-black text-slate-800 dark:text-white">Records</span>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest">PEER SMS</span>
        </div>

        {paginatedRecords.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <FolderOpen className="w-6 h-6 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                No records found
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm">
                No SMS messages matched your filter criteria. Try resetting filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold text-slate-600 dark:text-slate-400 border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[15%]">DATE / TIME</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[20%]">SOURCE (SID)</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[15%]">DESTINATION</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[20%]">COUNTRY</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[20%]">MESSAGE</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black text-right w-[10%]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paginatedRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition">
                    {/* Timestamp with elegant formatting */}
                    <td className="p-4 align-middle whitespace-nowrap">
                      <div className="text-slate-800 dark:text-slate-200 font-extrabold">{rec.timestampDate}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{rec.timestampTime}</div>
                    </td>

                    {/* Source with official looking brand icon badges */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2.5">
                        {rec.logoType === 'tiktok' && (
                          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-extrabold text-[13px] shadow-sm relative overflow-hidden shrink-0">
                            <span className="relative z-10">T</span>
                            <div className="absolute -inset-0.5 bg-gradient-to-tr from-cyan-400 to-rose-400 opacity-30"></div>
                          </div>
                        )}
                        {rec.logoType === 'facebook' && (
                          <div className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm shrink-0">
                            <span>f</span>
                          </div>
                        )}
                        {rec.logoType === 'apple' && (
                          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-800 flex items-center justify-center text-white font-extrabold text-[13px] shadow-sm shrink-0">
                            <span></span>
                          </div>
                        )}
                        {rec.logoType === 'google' && (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                            <span className="text-blue-500">G</span>
                          </div>
                        )}
                        {rec.logoType === 'telegram' && (
                          <div className="w-7 h-7 rounded-lg bg-[#229ED9] flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">
                            <span>T</span>
                          </div>
                        )}
                        {rec.logoType === 'whatsapp' && (
                          <div className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0">
                            <span>W</span>
                          </div>
                        )}
                        {rec.logoType === 'letter' && (
                          <div className={`w-7 h-7 rounded-lg ${rec.logoBg || 'bg-slate-500'} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}>
                            <span>{rec.logoLetter || rec.brand.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <div className="text-slate-800 dark:text-slate-200 font-extrabold tracking-tight">{rec.brand}</div>
                          {rec.senderId !== rec.brand && (
                            <div className="text-[10px] text-slate-400 font-medium">{rec.senderId}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Destination number */}
                    <td className="p-4 align-middle whitespace-nowrap text-slate-900 dark:text-white font-extrabold text-sm">
                      {rec.destination}
                    </td>

                    {/* Country and operator */}
                    <td className="p-4 align-middle">
                      <div className="text-slate-800 dark:text-slate-200 font-extrabold">{rec.country} - {rec.operator}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{rec.destination}</div>
                    </td>

                    {/* Message detail column */}
                    <td className="p-4 align-middle">
                      <div className="text-slate-500 dark:text-slate-400 font-medium text-xs max-w-sm line-clamp-2 leading-relaxed break-words" title={rec.message}>
                        {rec.message}
                      </div>
                    </td>

                    {/* Action column with green button "+ Add number" */}
                    <td className="p-4 align-middle text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenAddNumberModal(rec)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#65a30d] hover:bg-[#54870a] text-white text-xs font-black rounded-lg transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add number</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dense pagination bar styled matching Screenshot 2 */}
        {totalRecordsCount > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 dark:bg-slate-950/10">
            <div className="text-slate-500 dark:text-slate-400 text-xs font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Showing</span>
              <span className="text-slate-900 dark:text-white font-black">{startIndex + 1}</span>
              <span>to</span>
              <span className="text-slate-900 dark:text-white font-black">
                {Math.min(startIndex + itemsPerPage, totalRecordsCount)}
              </span>
              <span>of</span>
              <span className="text-slate-900 dark:text-white font-black">{totalRecordsCount.toLocaleString()}</span>
              <span>records</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-400 font-semibold">Data as of {lastRefreshedTime}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase">refreshes every 30s</span>
            </div>

            {/* Interactive pagination buttons */}
            <div className="flex items-center gap-1.5 self-start md:self-auto">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>

              {Array.from({ length: totalPagesCount }).map((_, idx) => {
                const pageNum = idx + 1;
                // Simple pagination truncation
                if (totalPagesCount > 5 && Math.abs(currentPage - pageNum) > 1 && pageNum !== 1 && pageNum !== totalPagesCount) {
                  if (pageNum === 2 || pageNum === totalPagesCount - 1) {
                    return <span key={pageNum} className="text-slate-400 px-1 font-semibold text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition ${
                      currentPage === pageNum
                        ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                        : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesCount))}
                disabled={currentPage === totalPagesCount}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RETAINED ADD NUMBER MODAL TERMINAL BLOCK */}
      {isModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="add-number-modal-backdrop">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform scale-100 transition-all duration-300" id="add-number-modal-box">
            {/* Modal Step 1: Form selection */}
            {modalStep === 'form' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#65a30d]/10 text-[#65a30d]">
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Add to My Numbers</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">Rent number sequence to your live inventory</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Country info display card */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Country & Range:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{selectedRecord.country} - {selectedRecord.operator}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Prefix:</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">+{selectedRecord.prefix}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Billing Rate:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">0.0000 USD / SMS</span>
                  </div>
                </div>

                {/* Date Picker Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Select Expiry Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">Number will automatically expire and deactivate after this date.</p>
                </div>

                {/* Interactive Pills */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Number of Items to Rent</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 5, 10, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSetPillValue(val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                          numCount === val
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  {/* Manual count input */}
                  <div className="relative mt-2">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={numInputStr}
                      onChange={(e) => handleCustomCountChange(e.target.value)}
                      placeholder="Enter custom count..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">MAX 1000</span>
                  </div>
                </div>

                {/* Order Type / Sequence */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Order Sequence</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('serial')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black border transition ${
                        orderType === 'serial'
                          ? 'border-[#65a30d] bg-[#65a30d]/5 text-[#65a30d]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Serial Numbers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('random')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black border transition ${
                        orderType === 'random'
                          ? 'border-[#65a30d] bg-[#65a30d]/5 text-[#65a30d]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Random Numbers</span>
                    </button>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setModalStep('confirm')}
                    className="px-5 py-2.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black shadow-xs transition"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Modal Step 2: Confirmation screen */}
            {modalStep === 'confirm' && (
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Confirm Your Order</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
                    You are about to rent <span className="text-slate-900 dark:text-white font-extrabold">{numCount}</span> number(s) for the gateway range <span className="text-slate-900 dark:text-white font-extrabold">{selectedRecord.country} - {selectedRecord.operator}</span>.
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Total Count:</span>
                      <span className="text-slate-900 dark:text-white font-black">{numCount} numbers</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Prefix Range:</span>
                      <span className="text-slate-900 dark:text-white font-black">+{selectedRecord.prefix}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Sequence Style:</span>
                      <span className="text-slate-900 dark:text-white font-black uppercase">{orderType}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Expiration Date:</span>
                      <span className="text-slate-900 dark:text-white font-black">
                        {new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 flex justify-between items-center text-xs font-black">
                      <span className="text-slate-800 dark:text-slate-200">Total Setup Cost:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                        0.0000 USD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => setModalStep('form')}
                    className="px-4 py-2 text-xs font-black text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmAndAddNumber}
                    className="px-5 py-2.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black shadow-xs transition"
                  >
                    Confirm & Rent
                  </button>
                </div>
              </div>
            )}

            {/* Modal Step 3: Success animation */}
            {modalStep === 'success' && (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-5">
                {/* Elegant pulsing green checkmark wrapper */}
                <div className="relative">
                  <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                  </div>
                  <div className="absolute -inset-2 rounded-full border border-emerald-500/30 animate-ping opacity-40"></div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Success!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-xs">
                    {numCount} numbers for <span className="font-extrabold text-slate-800 dark:text-slate-200">{selectedRecord.country} - {selectedRecord.operator}</span> have been successfully added to your <span className="font-extrabold text-[#65a30d]">My Numbers</span> tab!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
