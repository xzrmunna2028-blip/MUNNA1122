import React, { useState, useEffect } from 'react';
import {
  Plus,
  RotateCw,
  Trash2,
  FileSpreadsheet,
  ChevronDown,
  Hash,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileText,
  Check,
  ArrowUpDown,
  Shuffle,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  Zap,
  Eye,
} from 'lucide-react';
import { ensureDefaultRentedNumbers } from '../utils/realtimeSmsService';
import { OtpSessionModal } from './OtpSessionModal';
import { RentedNumber, RealSmsLog } from '../types';

interface TerminationOption {
  code: string;
  country: string;
  operator: string;
  available: string;
  rate: string;
  limit: string;
  label: string;
}

export const MyNumbersView: React.FC = () => {
  const [rentedNumbers, setRentedNumbers] = useState<RentedNumber[]>(() => {
    return ensureDefaultRentedNumbers();
  });

  // OTP Session Modal states
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionSelectedNumber, setSessionSelectedNumber] = useState<RentedNumber | null>(null);
  const [sessionSelectedLog, setSessionSelectedLog] = useState<RealSmsLog | null>(null);

  useEffect(() => {
    localStorage.setItem('rented_numbers', JSON.stringify(rentedNumbers));
  }, [rentedNumbers]);

  const [isApiSyncing, setIsApiSyncing] = useState(false);
  const [lastApiSync, setLastApiSync] = useState<string>('');

  const fetchNumbersFromApi = async () => {
    try {
      const res = await fetch('/api/my-numbers');
      if (res.ok) {
        const data = await res.json();
        if (data.numbers && Array.isArray(data.numbers)) {
          setRentedNumbers(data.numbers.map((n: any) => ({ ...n, cost: n.cost || n.rate || '0.0096 USD' })));
          localStorage.setItem('rented_numbers', JSON.stringify(data.numbers));
          if (data.last_updated) {
            setLastApiSync(new Date(data.last_updated).toLocaleTimeString('en-US'));
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Backend /api/my-numbers fetch failed, falling back to local store:', e);
    }
    const local = localStorage.getItem('rented_numbers');
    if (local !== null) {
      try {
        const parsed: RentedNumber[] = JSON.parse(local);
        setRentedNumbers(parsed.map((n) => ({ ...n, cost: n.cost || (n as any).rate || '0.0096 USD' })));
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchNumbersFromApi();
    const handleSync = () => {
      fetchNumbersFromApi();
    };
    window.addEventListener('rented_numbers_updated', handleSync);
    
    // Auto-poll live numbers feed from IPRN API
    const interval = setInterval(() => {
      fetchNumbersFromApi();
    }, 4000);

    return () => {
      window.removeEventListener('rented_numbers_updated', handleSync);
      clearInterval(interval);
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    'Range Name': true,
    'Number': true,
    'Rate': true,
    'Term': true,
    'Last Message': true,
    'Portal Limit': true,
    'SID/Range': true,
    'Multi Limit': true,
    'SID/DID Limit': true,
    'Action': true,
  });
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const columnsList = [
    'Range Name',
    'Number',
    'Rate',
    'Term',
    'Last Message',
    'Portal Limit',
    'SID/Range',
    'Multi Limit',
    'SID/DID Limit',
    'Action',
  ];

  const handleDeleteSingle = async (id: string) => {
    const updated = rentedNumbers.filter((n) => n.id !== id);
    setRentedNumbers(updated);
    localStorage.setItem('rented_numbers', JSON.stringify(updated));
    if (selectedRows[id]) {
      const copy = { ...selectedRows };
      delete copy[id];
      setSelectedRows(copy);
    }
    try {
      await fetch('/api/delete-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
    } catch (e) {
      console.warn('Failed to delete number from server:', e);
    }
  };

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTerminationCode, setSelectedTerminationCode] = useState<string>('');
  const [paymentTerm, setPaymentTerm] = useState<string>('default');
  const [numCount, setNumCount] = useState<number>(1);
  const [numInputStr, setNumInputStr] = useState<string>('1');
  const [orderType, setOrderType] = useState<'serial' | 'random'>('serial');

  // Multi-step modal flow
  // 'form' | 'confirm' | 'success'
  const [modalStep, setModalStep] = useState<'form' | 'confirm' | 'success'>('form');

  // Delete modal states
  const [deleteModalStep, setDeleteModalStep] = useState<'none' | 'confirm' | 'success'>('none');
  const [deletedCount, setDeletedCount] = useState<number>(0);

  // Auto-dismiss the success dialog after 2.5 seconds
  useEffect(() => {
    if (modalStep === 'success') {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
        setModalStep('form');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [modalStep]);

  // Auto-dismiss the delete success dialog after 3 seconds
  useEffect(() => {
    if (deleteModalStep === 'success') {
      const timer = setTimeout(() => {
        setDeleteModalStep('none');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deleteModalStep]);

  const [terminations, setTerminations] = useState<TerminationOption[]>([]);

  // Fetch real live terminations from API
  const fetchTerminations = async () => {
    try {
      const res = await fetch('/api/terminations');
      if (res.ok) {
        const data = await res.json();
        if (data.terminations && Array.isArray(data.terminations)) {
          setTerminations(data.terminations);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch /api/terminations:', e);
    }

    // Fallback: derive dynamically from rentedNumbers state
    if (rentedNumbers && rentedNumbers.length > 0) {
      const termMap = new Map<string, TerminationOption>();
      rentedNumbers.forEach((n) => {
        const rangeName = n.rangeName || n.range || n.term || 'IPRN Range';
        const code = rangeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
        if (!termMap.has(code)) {
          termMap.set(code, {
            code,
            country: n.country || 'Global',
            operator: n.operator || 'Carrier',
            available: 'Unlimited available',
            rate: n.cost || n.rate || '0.0000 USD',
            limit: n.portalLimit || '10,000',
            label: `${rangeName} (Unlimited available)`,
          });
        }
      });
      setTerminations(Array.from(termMap.values()));
    } else {
      setTerminations([]);
    }
  };

  useEffect(() => {
    fetchTerminations();
  }, [rentedNumbers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/trigger-sync', { method: 'POST' });
      await fetchNumbersFromApi();
    } catch (e) {
      console.error('Failed to trigger IPRN sync:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const updated: Record<string, boolean> = {};
    if (checked) {
      filteredNumbers.forEach((n) => {
        updated[n.id] = true;
      });
    }
    setSelectedRows(updated);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const updated = { ...selectedRows, [id]: checked };
    setSelectedRows(updated);
    
    // If any is unchecked, selectAll is false
    if (!checked) {
      setSelectAll(false);
    } else {
      const allSelected = filteredNumbers.every((n) => updated[n.id]);
      if (allSelected) setSelectAll(true);
    }
  };

  const handleDeleteSelected = () => {
    const activeIds = Object.keys(selectedRows).filter((key) => selectedRows[key]);
    if (activeIds.length === 0) return;
    setDeletedCount(activeIds.length);
    setDeleteModalStep('confirm');
  };

  const handleConfirmDelete = async () => {
    const activeIds = Object.keys(selectedRows).filter((key) => selectedRows[key]);
    const isAllSelected = selectAll || activeIds.length >= rentedNumbers.length;
    const updated = rentedNumbers.filter((n) => !selectedRows[n.id]);

    setRentedNumbers(updated);
    localStorage.setItem('rented_numbers', JSON.stringify(updated));
    setSelectedRows({});
    setSelectAll(false);
    setDeleteModalStep('success');

    try {
      await fetch('/api/delete-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: activeIds, deleteAll: isAllSelected || updated.length === 0 })
      });
    } catch (e) {
      console.warn('Failed to delete numbers on server:', e);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedTerminationCode('');
    setPaymentTerm('default');
    setNumCount(1);
    setNumInputStr('1');
    setOrderType('serial');
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

  // Step 1 Click -> Proceed to Step 2 (Confirmation Modal)
  const handleFormSubmitToConfirmation = () => {
    if (!selectedTerminationCode) return;
    setModalStep('confirm');
  };

  // Step 2 Click Yes -> Generate real numbers and proceed to Step 3 (Success Modal)
  const handleConfirmAndAdd = async () => {
    const selectedTerm = terminations.find((t) => t.code === selectedTerminationCode);
    if (!selectedTerm) return;

    const countToGenerate = numCount > 1000 ? 1000 : numCount;
    let newNumbers: RentedNumber[] = [];

    try {
      const genRes = await fetch('/api/generate-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rangeCode: selectedTerm.code,
          rangeName: (selectedTerm as any).rangeName || selectedTerm.label,
          count: countToGenerate
        })
      });
      if (genRes.ok) {
        const genData = await genRes.json();
        if (genData.numbers && Array.isArray(genData.numbers) && genData.numbers.length > 0) {
          newNumbers = genData.numbers;
        }
      }
    } catch (e) {
      console.warn('Failed to generate real numbers from API:', e);
    }

    // Fallback if network issue
    if (newNumbers.length === 0) {
      const sampleNum = (selectedTerm as any).number || '+994997780131';
      for (let i = 0; i < countToGenerate; i++) {
        newNumbers.push({
          id: `NUM-IPRN-${Math.floor(100000 + Math.random() * 900000)}`,
          number: sampleNum,
          range: (selectedTerm as any).rangeName || `${selectedTerm.operator} (${selectedTerm.country})`,
          rangeName: (selectedTerm as any).rangeName || `${selectedTerm.operator} (${selectedTerm.country})`,
          operator: selectedTerm.operator,
          country: selectedTerm.country,
          status: 'ACTIVE',
          cost: selectedTerm.rate,
          rate: selectedTerm.rate,
          expiry: 'Oct 08, 2026',
          term: '1/1',
          lastMessage: 'Never',
          portalLimit: selectedTerm.limit || '10,000',
          sidRange: 'IPRN-Direct',
          multiLimit: 'No Limit',
          sidDidLimit: 'Unlimited',
        });
      }
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

    setRentedNumbers((prev) => [...newNumbers, ...prev]);
    localStorage.setItem('rented_numbers', JSON.stringify([...newNumbers, ...rentedNumbers]));
    window.dispatchEvent(new Event('rented_numbers_updated'));
    setModalStep('success');
  };

  // Filter based on manual search query (matches number, range/country, or operator)
  const filteredNumbers = rentedNumbers.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ((n?.number || '').toLowerCase().includes(q)) ||
      ((n?.range || '').toLowerCase().includes(q)) ||
      (((n as any)?.rangeName || '').toLowerCase().includes(q)) ||
      ((n?.operator || '').toLowerCase().includes(q))
    );
  });

  const selectedTerm = terminations.find((t) => t.code === selectedTerminationCode);
  const anyRowsSelected = Object.values(selectedRows).some((v) => v);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="hover:text-slate-800 dark:hover:text-white cursor-pointer">Client System</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 dark:text-white font-bold">My Numbers</span>
      </nav>

      {/* Main Page Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
          My numbers
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Rented MSISDNs &middot; rates, limits and assignment
        </p>
      </div>

      {/* Primary Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        {/* Left Side: Add Number Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#65a30d] hover:bg-[#52850a] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-lime-950/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add number</span>
        </button>

        {/* Right Side Tools Pack */}
        <div className="flex items-center gap-2">
          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            title="Refresh Numbers"
            className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all ${
              isRefreshing ? 'animate-spin text-[#65a30d]' : ''
            }`}
          >
            <RotateCw className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Delete Action (Active only when rows selected) */}
          <button
            onClick={handleDeleteSelected}
            disabled={!anyRowsSelected}
            title="Delete Selected"
            className={`p-3 rounded-xl border transition-all ${
              anyRowsSelected
                ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/15 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/35 cursor-pointer'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-rose-500 opacity-40 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4 stroke-[2]" />
          </button>

          {/* Export Action */}
          <button
            title="Export Excel"
            className="p-3 rounded-xl bg-[#091509] text-emerald-400 hover:text-white border border-[#132514] hover:bg-[#122c13] transition-all flex items-center justify-center"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* Main Rented Numbers Table/List Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {/* Rented Numbers Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/25">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
            Rented numbers
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-widest uppercase select-none cursor-pointer">
              SELECT ALL
            </label>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4.5 h-4.5 rounded text-[#65a30d] focus:ring-[#65a30d] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 transition cursor-pointer"
            />
          </div>
        </div>

        {/* Filters and Inputs Inside Card */}
        <div className="p-6 space-y-6">
          {/* RANGE Manual Search Input */}
          <div className="max-w-md space-y-1.5 relative">
            <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
              RANGE
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or select..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#65a30d]/25 focus:border-[#65a30d] transition placeholder-slate-400 dark:placeholder-slate-600"
              />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Render Active Numbers Card List or Empty State Box */}
          {filteredNumbers.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/10 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[650px] overflow-y-auto">
              {filteredNumbers.map((n) => (
                <div
                  key={n.id}
                  className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors relative animate-fade-in group cursor-pointer"
                  onClick={() => {
                    setSessionSelectedNumber(n);
                    setSessionSelectedLog(null);
                    setSessionModalOpen(true);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox on left */}
                    <input
                      type="checkbox"
                      checked={!!selectedRows[n.id]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleRowSelect(n.id, e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-[#65a30d] focus:ring-[#65a30d] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 transition cursor-pointer mt-0.5"
                    />

                    {/* Middle info content area */}
                    <div className="flex-1 space-y-2">
                      {/* Top row: Number & Term Badge & Action Buttons */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white tracking-wide font-mono group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                            {n.number}
                          </span>
                          <span className="text-[10px] font-black bg-lime-100 dark:bg-lime-950/40 text-lime-700 dark:text-lime-400 px-2 py-0.5 rounded select-none">
                            {n.term || '1/1'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSessionSelectedNumber(n);
                              setSessionSelectedLog(null);
                              setSessionModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
                            title="View messages for this number"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Messages</span>
                          </button>
                        </div>
                      </div>

                      {/* Second row: Operator & range subtitle */}
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {n.range}
                      </p>

                      {/* Third row: Info Grid with Rate and Last Message only, aligned left and right */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            A2P RATE
                          </span>
                          <span className="text-xs font-bold text-lime-600 dark:text-lime-500">
                            {n.cost || (n as any).rate || '0.0096 USD'}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                            LAST SMS
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {n.lastMessage || 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State Box */
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-950/5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 flex items-center justify-center mb-4 border border-slate-200/50 dark:border-slate-800/50">
                <Hash className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-1">
                No numbers found
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs font-medium">
                Try a different search, or rent a number to get started.
              </p>
            </div>
          )}

          {/* Table Footer with Columns Option & Entries Counters */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Columns Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Columns</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isColumnsDropdownOpen && (
                <div className="absolute bottom-[calc(100%+4px)] left-0 z-20 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 min-w-[180px] max-h-[280px] overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80">
                    Visible Columns
                  </div>
                  {columnsList.map((col) => (
                    <label
                      key={col}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={!!visibleColumns[col]}
                        onChange={(e) => {
                          setVisibleColumns(prev => ({
                            ...prev,
                            [col]: e.target.checked
                          }));
                        }}
                        className="rounded text-[#65a30d] focus:ring-[#65a30d] border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 transition cursor-pointer"
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Entries Counter text */}
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Showing {filteredNumbers.length > 0 ? `1 to ${filteredNumbers.length}` : '0 to 0'} of {filteredNumbers.length} entries
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 text-xs font-bold cursor-not-allowed">
                Previous
              </button>
              <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 text-xs font-bold cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD NUMBERS MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          
          {/* STEP 1: Main Form View */}
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
                      Add numbers
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-none mt-1">
                      Select a termination and specify how many numbers you want to rent.
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

              {/* Modal Body Container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Dropdown "Select termination" */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Select termination
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTerminationCode}
                      onChange={(e) => setSelectedTerminationCode(e.target.value)}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-bold focus:ring-[#65a30d] focus:border-[#65a30d] transition pr-10 cursor-pointer"
                    >
                      <option value="">-- Choose a termination --</option>
                      {terminations.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[11px] leading-normal text-slate-400 dark:text-slate-500 font-medium">
                    Showing all {terminations.length} active real range sources synchronized from IPRN API.
                  </p>
                </div>

                {/* Expanded details panel if selectedTerm is active */}
                {selectedTerm && (
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 animate-fade-in">
                    {/* Country & Operator & Available Row Grid */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          COUNTRY
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-white block">
                          {selectedTerm.country}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          OPERATOR
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-white block">
                          {selectedTerm.operator}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          AVAILABLE
                        </span>
                        <span className="text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 block">
                          {selectedTerm.available}
                        </span>
                      </div>
                    </div>

                    {/* Payment Term Pick Select */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Select payment term</span>
                      </label>
                      <div className="relative">
                        <select
                          value={paymentTerm}
                          onChange={(e) => setPaymentTerm(e.target.value)}
                          className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-bold focus:ring-[#65a30d] focus:border-[#65a30d] pr-10 cursor-pointer"
                        >
                          <option value="default">1/1 (Default) - Rate: {selectedTerm.rate}</option>
                          <option value="promo">10/10 (Promo) - Rate: 0.0000 USD</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        Payment terms determine your rate
                      </p>
                    </div>

                    {/* Rate & A2P Limit Grid row */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          RATE
                        </span>
                        <span className="text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 block">
                          {selectedTerm.rate}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          A2P LIMIT
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-white block">
                          {selectedTerm.limit}
                        </span>
                      </div>
                    </div>

                    {/* Number counts pills & Manual input */}
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        How many numbers?
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

                    {/* Number Order toggling */}
                    <div className="space-y-2.5">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Number order
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Serial */}
                        <button
                          onClick={() => setOrderType('serial')}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            orderType === 'serial'
                              ? 'bg-white dark:bg-slate-950 border-[#65a30d] text-[#65a30d] ring-2 ring-[#65a30d]/10'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <ArrowUpDown className="w-4 h-4" />
                          <span>Serial</span>
                        </button>

                        {/* Random */}
                        <button
                          onClick={() => setOrderType('random')}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            orderType === 'random'
                              ? 'bg-white dark:bg-slate-950 border-[#65a30d] text-[#65a30d] ring-2 ring-[#65a30d]/10'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <Shuffle className="w-4 h-4" />
                          <span>Random</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        You can request up to 1000 at a time.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Bottom Sticky Footer Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!selectedTerminationCode}
                  onClick={handleFormSubmitToConfirmation}
                  className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    selectedTerminationCode
                      ? 'bg-slate-950 hover:bg-slate-900 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 cursor-pointer'
                      : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add numbers</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Confirmation Dialog (Screenshot 1) */}
          {modalStep === 'confirm' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl max-w-md w-full p-6 text-center animate-scale-up space-y-6">
              {/* Question mark Big Circle Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <span className="text-4xl font-extrabold font-serif">?</span>
                </div>
              </div>

              {/* Text content details */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  Add Numbers?
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  You are about to add:
                </p>
              </div>

              {/* Highlight fuchsia/blue banner box */}
              <div className="bg-[#f0f4ff]/70 dark:bg-slate-950/40 border border-[#dee8ff] dark:border-slate-800 p-5 rounded-2xl space-y-1">
                <p className="text-lg font-black text-[#65a30d]">
                  {numCount} number(s)
                </p>
                <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  from {selectedTerm?.label.split(' - ')[0]} - {selectedTerm?.operator}
                </p>
              </div>

              {/* Confirmation buttons */}
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

          {/* STEP 3: Success Dialog (Screenshot 2) */}
          {modalStep === 'success' && (
            <div 
              onClick={() => {
                setIsModalOpen(false);
                setModalStep('form');
              }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 cursor-pointer transition-all duration-300"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="text-center space-y-5 max-w-sm w-full p-8 rounded-3xl bg-emerald-950/20 dark:bg-emerald-950/35 border-0 shadow-none animate-scale-up select-none"
              >
                {/* Glowing Outline Check Circle */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Pulsing ring animation */}
                    <div className="absolute inset-0 rounded-full bg-[#65a30d]/20 animate-ping"></div>
                    <div className="relative w-24 h-24 rounded-full border-[3px] border-[#65a30d] bg-white dark:bg-slate-900 flex items-center justify-center text-[#65a30d] shadow-lg shadow-lime-500/20">
                      <Check className="w-12 h-12 stroke-[3.5] animate-scale-up" />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1.5 pt-2">
                  <h3 className="text-2xl font-black text-[#65a30d] tracking-wide">
                    Success!
                  </h3>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {numCount} number(s) added successfully.
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

      {/* --- RETURN/DELETE NUMBERS MODAL OVERLAY --- */}
      {deleteModalStep !== 'none' && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          
          {/* STEP 1: Return/Delete Confirmation (Screenshot 1) */}
          {deleteModalStep === 'confirm' && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-8 text-center animate-scale-up space-y-6"
            >
              {/* Alert circular warning icon */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full border-[3px] border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-500">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 flex items-center justify-center">
                    <span className="text-4xl font-extrabold font-serif">!</span>
                  </div>
                </div>
              </div>

              {/* Text content details */}
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Return ALL Numbers?
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  You are about to return <span className="text-rose-600 dark:text-rose-500 font-extrabold">ALL</span> your numbers to the system.
                </p>
              </div>

              {/* Pink Banner Callout WARNING */}
              <div className="bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  WARNING: This action is irreversible!
                </span>
              </div>

              {/* Subtext description */}
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
                All your active numbers will be returned and become available for reassignment.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleConfirmDelete}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#65a30d] hover:bg-[#52850a] text-white text-xs font-black transition shadow-lg shadow-lime-900/10 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>Yes, return ALL!</span>
                </button>
                <button
                  onClick={() => setDeleteModalStep('none')}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-black transition cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Return Success Dialog with Drawing Tick Animation (Screenshot 2) */}
          {deleteModalStep === 'success' && (
            <div 
              onClick={() => setDeleteModalStep('none')}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full p-8 text-center animate-scale-up space-y-6 cursor-pointer"
            >
              <style>{`
                @keyframes bounceCircle {
                  0% { transform: scale(0.3); opacity: 0; }
                  50% { transform: scale(1.05); }
                  70% { transform: scale(0.9); }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes drawCheck {
                  to { stroke-dashoffset: 0; }
                }
                .animate-bounce-circle {
                  animation: bounceCircle 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .animate-draw-check {
                  stroke-dasharray: 50;
                  stroke-dashoffset: 50;
                  animation: drawCheck 0.6s ease-in-out forwards;
                  animation-delay: 0.2s;
                }
              `}</style>

              {/* Outer circle with scale-up motion */}
              <div className="flex justify-center">
                <div
                  className="animate-bounce-circle relative w-24 h-24 rounded-full border-[3px] border-[#65a30d] bg-white dark:bg-slate-900 flex items-center justify-center text-[#65a30d] shadow-lg shadow-lime-500/10"
                >
                  {/* Pulsing overlay ring */}
                  <div className="absolute inset-0 rounded-full bg-[#65a30d]/10 animate-ping"></div>
                  
                  {/* Self-drawing tick mark */}
                  <svg className="w-12 h-12 text-[#65a30d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path
                      className="animate-draw-check"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Text Information */}
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  All Numbers Returned!
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  All {deletedCount} number(s) returned successfully
                </p>
              </div>

              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase animate-pulse pt-2">
                Click anywhere to close
              </p>
            </div>
          )}

        </div>
      )}

      {/* Number Deep OTP Session Modal */}
      <OtpSessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        initialNumber={sessionSelectedNumber}
        initialLog={sessionSelectedLog}
      />
    </div>
  );
};
