import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Plus,
  Check,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileText,
  Calendar,
  Search,
  ArrowUpDown,
  Shuffle,
  Eye,
  Zap,
} from 'lucide-react';
import { ensureDefaultTestNumbers } from '../utils/realtimeSmsService';
import { OtpSessionModal } from './OtpSessionModal';
import { RentedNumber, RealSmsLog } from '../types';

interface TestNumberItem {
  id: string;
  name: string;
  code: string;
  number: string;
  rate: string;
  flag: string;
}

export const TestNumbersView: React.FC = () => {
  const [testNumbersData, setTestNumbersData] = useState<TestNumberItem[]>(() => {
    return ensureDefaultTestNumbers();
  });

  useEffect(() => {
    const fetchLiveNumbers = async () => {
      try {
        const res = await fetch('/api/test-terminations');
        if (res.ok) {
          const data = await res.json();
          if (data.numbers && Array.isArray(data.numbers) && data.numbers.length > 0) {
            const mapped: TestNumberItem[] = data.numbers.map((n: any) => ({
              id: n.id,
              name: n.rangeName || n.term || n.range,
              code: n.number.startsWith('+') ? n.number.substring(1, 4) : n.number.substring(0, 3),
              number: n.number,
              rate: n.cost || n.rate || '0.0096 USD',
              flag: (n.country === 'Azerbaijan' || (n.rangeName && n.rangeName.includes('Azerbaijan'))) ? '🇦🇿' : (n.country === 'Cambodia' || (n.rangeName && n.rangeName.includes('Cambodia'))) ? '🇰🇭' : n.country === 'Ecuador' ? '🇪🇨' : n.country === 'Benin' ? '🇧🇯' : n.country === 'Bolivia' ? '🇧🇴' : n.country === 'Bangladesh' ? '🇧🇩' : n.country === 'United Kingdom' ? '🇬🇧' : n.country === 'Algeria' ? '🇩🇿' : '🌐'
            }));
            setTestNumbersData(mapped);
          }
        }
      } catch (e) {}
    };
    fetchLiveNumbers();
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  
  // OTP Session Modal states
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedSessionNumber, setSelectedSessionNumber] = useState<RentedNumber | null>(null);
  const [selectedSessionLog, setSelectedSessionLog] = useState<RealSmsLog | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TestNumberItem | null>(null);
  const [numCount, setNumCount] = useState<number>(1);
  const [numInputStr, setNumInputStr] = useState<string>('1');
  const [orderType, setOrderType] = useState<'serial' | 'random'>('serial');
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [modalStep, setModalStep] = useState<'form' | 'confirm' | 'success'>('form');

  // Clipboard copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Export terminations function
  const handleExport = () => {
    const headers = ['Country/Range', 'Prefix', 'Test Number', 'Rate (USD)'];
    const rows = testNumbersData.map(item => [
      item.name,
      item.code,
      item.number,
      item.rate || '0.0096 USD'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "test_numbers_terminations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPlusModal = (item: TestNumberItem) => {
    setSelectedItem(item);
    setNumCount(1);
    setNumInputStr('1');
    setOrderType('serial');
    setModalStep('form');
    
    // Set default expiry date to exactly 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpiryDate(d.toISOString().split('T')[0]);
    
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

  // Add numbers to "My Numbers" local storage and sync with IPRN API immediately
  const handleConfirmAndAdd = async () => {
    if (!selectedItem) return;

    // Load existing numbers from local storage
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

    // Format chosen expiry date
    const expDate = new Date(expiryDate);
    const expiryStr = expDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    for (let i = 0; i < countToGenerate; i++) {
      let msisdn = selectedItem.number;
      if (i > 0) {
        // Generate successive msisdn or random numbers
        if (orderType === 'serial') {
          const baseNum = BigInt(selectedItem.number);
          msisdn = (baseNum + BigInt(i)).toString();
        } else {
          const bodyLength = selectedItem.number.length - selectedItem.code.length;
          const randomBody = Math.floor(Math.pow(10, bodyLength - 1) + Math.random() * (Math.pow(10, bodyLength) - Math.pow(10, bodyLength - 1) - 1));
          msisdn = `${selectedItem.code}${randomBody}`;
        }
      }

      newNumbers.push({
        id: `NUM-${Math.floor(100000 + Math.random() * 900000)}`,
        number: msisdn,
        range: `${selectedItem.name} (${selectedItem.code})`,
        operator: selectedItem.name.split(' - ')[1] || selectedItem.name.split(' ')[1] || 'Operator',
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

    // Immediately synchronize associated ranges with IPRN API
    try {
      await fetch('/api/my-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newNumbers })
      });
    } catch (e) {
      console.warn('Backend IPRN range sync notice:', e);
    }

    // Save back to local storage and dispatch update event
    const updatedList = [...newNumbers, ...rentedNumbers];
    localStorage.setItem('rented_numbers', JSON.stringify(updatedList));
    window.dispatchEvent(new Event('rented_numbers_updated'));

    setModalStep('success');
  };

  // Filter terminations based on search
  const filteredItems = testNumbersData.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.number || '').toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">Test System</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 dark:text-white font-bold">Test Numbers</span>
      </nav>

      {/* Main Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Test numbers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Available terminations with test numbers and pricing
          </p>
        </div>

        {/* Export Button matching the screenshot perfectly */}
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-800 dark:border-slate-750 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export</span>
        </button>
      </div>

      {/* Main Terminations Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/25">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
            Terminations
          </h2>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            RATES & LIMITS
          </span>
        </div>

        {/* Filter Input area */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-950/10">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by country, prefix, or number..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#65a30d]/25 focus:border-[#65a30d] transition placeholder-slate-400 dark:placeholder-slate-600"
            />
          </div>
        </div>

        {/* Dynamic List matching the screenshot style */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition-colors animate-fade-in"
              >
                {/* Left Side: Name, Prefix, Number & Rate */}
                <div className="space-y-1">
                  {/* Title Row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1 select-none">
                      {item.flag}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      {item.code}
                    </span>
                  </div>

                  {/* Subtitle Row with number and rate */}
                  <div className="flex items-center gap-3.5 flex-wrap text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                      {item.number}
                    </span>
                    <div className="flex items-center gap-1 font-semibold text-[10px]">
                      <span className="text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                        RATE
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {item.rate || '0.0096 USD'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopy(item.id, item.number)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer relative"
                    title="Copy Number"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-500 stroke-[3.5] animate-scale-up" />
                    ) : (
                      <Copy className="w-4 h-4 stroke-[2]" />
                    )}
                  </button>

                  {/* Plus Button */}
                  <button
                    onClick={() => handleOpenPlusModal(item)}
                    className="p-2.5 rounded-xl bg-[#65a30d] hover:bg-[#52850a] text-white transition-all shadow-sm shadow-lime-950/10 cursor-pointer active:scale-95"
                    title="Add to My Numbers"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                No matching test numbers found.
              </p>
            </div>
          )}
        </div>

        {/* Columns Option & Pagination matching the screenshot */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/20 dark:bg-slate-950/5">
          
          {/* Columns Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Columns</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isColumnsDropdownOpen && (
              <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 min-w-[160px]">
                <div className="px-3 py-1 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80">
                  Visible Columns
                </div>
                <div className="p-2 space-y-1.5">
                  {['Country/Range', 'Test Number', 'Rate', 'Actions'].map((col) => (
                    <label
                      key={col}
                      className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition rounded"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded text-[#65a30d] focus:ring-[#65a30d] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 transition"
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Entries Indicator text */}
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Showing {filteredItems.length > 0 ? `1 to ${filteredItems.length}` : '0 to 0'} of {filteredItems.length} entries
          </span>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1 flex-wrap text-xs font-bold">
            <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-[#65a30d] text-white">
              1
            </button>
            <button className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 cursor-not-allowed">
              Next
            </button>
          </div>
        </div>

      </div>

      {/* --- ADD TO MY NUMBERS MODAL OVERLAY --- */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          
          {/* STEP 1: Main Form */}
          {modalStep === 'form' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Title Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#65a30d] flex items-center justify-center text-white shrink-0 shadow-md shadow-lime-950/10">
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      Add to My Numbers
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-none mt-1">
                      Configure your rent period and specify how many numbers to add to My Numbers list.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                
                {/* Predefined Select Termination option */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Select termination
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-bold focus:ring-[#65a30d] focus:border-[#65a30d] pr-10 cursor-not-allowed"
                      disabled
                    >
                      <option>{selectedItem.name} - Prefix: {selectedItem.code} (Rate: $0.0000)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Expiry Date Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Select expiry date</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-bold focus:ring-[#65a30d] focus:border-[#65a30d] transition cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    Numbers will expire at 00:00 UTC on the selected date.
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      RATE PER MIN/A2P
                    </span>
                    <span className="text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 block">
                      $0.0000
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      BASE MSISDN
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-white block tracking-wider">
                      {selectedItem.number}
                    </span>
                  </div>
                </div>

                {/* Number count selection (pills & input) */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    How many numbers to add?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={numInputStr}
                      onChange={(e) => handleCustomCountChange(e.target.value)}
                      className="w-24 px-4 py-2.5 text-center text-xs font-black border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:ring-[#65a30d] focus:border-[#65a30d]"
                    />
                    <div className="flex items-center gap-1.5">
                      {[1, 5, 10, 50, 100].map((pill) => (
                        <button
                          key={pill}
                          onClick={() => handleSetPillValue(pill)}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            numCount === pill
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-sm'
                              : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50'
                          }`}
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Number generation method */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Number order sequence
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrderType('serial')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        orderType === 'serial'
                          ? 'bg-white dark:bg-slate-950 border-[#65a30d] text-[#65a30d] ring-2 ring-[#65a30d]/10'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      <span>Serial (Consecutive)</span>
                    </button>
                    <button
                      onClick={() => setOrderType('random')}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        orderType === 'random'
                          ? 'bg-white dark:bg-slate-950 border-[#65a30d] text-[#65a30d] ring-2 ring-[#65a30d]/10'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <Shuffle className="w-4 h-4" />
                      <span>Random Range</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Footer Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setModalStep('confirm')}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#65a30d] hover:bg-[#52850a] text-white transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add to My Numbers</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Confirmation Dialog */}
          {modalStep === 'confirm' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl max-w-md w-full p-6 text-center animate-scale-up space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <span className="text-4xl font-extrabold font-serif">?</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  Confirm Addition?
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  You are about to add:
                </p>
              </div>

              <div className="bg-[#f0f4ff]/70 dark:bg-slate-950/40 border border-[#dee8ff] dark:border-slate-800 p-5 rounded-2xl space-y-1">
                <p className="text-lg font-black text-[#65a30d]">
                  {numCount} number(s)
                </p>
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  from {selectedItem.name} ({selectedItem.code}) with expiry {new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleConfirmAndAdd}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-[#65a30d] hover:bg-[#52850a] text-white text-xs font-black transition shadow-md shadow-lime-900/10 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Yes, add them!</span>
                </button>
                <button
                  onClick={() => setModalStep('form')}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-black transition cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Success Dialog */}
          {modalStep === 'success' && (
            <div 
              onClick={() => {
                setIsModalOpen(false);
                setModalStep('form');
              }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 cursor-pointer transition-all duration-300 animate-fade-in"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="text-center space-y-5 max-w-sm w-full p-8 rounded-3xl bg-emerald-950/20 dark:bg-emerald-950/35 border-0 shadow-none animate-scale-up select-none"
              >
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#65a30d]/20 animate-ping text-[#65a30d]"></div>
                    <div className="relative w-24 h-24 rounded-full border-[3px] border-[#65a30d] bg-white dark:bg-slate-900 flex items-center justify-center text-[#65a30d] shadow-lg shadow-lime-500/20">
                      <Check className="w-12 h-12 stroke-[3.5] animate-scale-up" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <h3 className="text-2xl font-black text-[#65a30d] tracking-wide">
                    Success!
                  </h3>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {numCount} test number(s) added to My Numbers successfully.
                  </p>
                </div>
                
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase animate-pulse pt-3">
                  Click anywhere to close
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Real-time OTP Session Modal */}
      <OtpSessionModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        initialNumber={selectedSessionNumber}
        initialLog={selectedSessionLog}
      />
    </div>
  );
};
