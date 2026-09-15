import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Activity,
  Zap,
  Save,
  Radio,
  FileText,
  Upload,
  X,
  Phone,
  Layers,
  ArrowRight,
  ShieldCheck,
  Signal
} from 'lucide-react';

export interface CountryItem {
  id: string;
  name: string;
  code: string;
  prefix: string;
  flag: string;
  active: boolean;
}

export interface TerminationRangeItem {
  code: string;
  country: string;
  operator: string;
  service?: string;
  rangeName: string;
  rate: string;
  limit?: string;
  number?: string;
  numbersPool?: string[];
  available?: string;
  label?: string;
  status?: string;
}

interface AdminRangeCountryManagerProps {
  showToast: (msg: string) => void;
  darkMode?: boolean;
}

export const AdminRangeCountryManager: React.FC<AdminRangeCountryManagerProps> = ({
  showToast,
  darkMode = true,
}) => {
  const [subTab, setSubTab] = useState<'ranges' | 'countries'>('ranges');
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [ranges, setRanges] = useState<TerminationRangeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // New Country Form
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryPrefix, setNewCountryPrefix] = useState('');
  const [newCountryFlag, setNewCountryFlag] = useState('🌐');
  const [isAddingCountry, setIsAddingCountry] = useState(false);

  // New Range Form
  const [newRangeCountry, setNewRangeCountry] = useState('Azerbaijan');
  const [newRangeOperator, setNewRangeOperator] = useState('');
  const [newRangeService, setNewRangeService] = useState('All Services / Telegram');
  const [newRangeName, setNewRangeName] = useState('');
  const [newRangeRate, setNewRangeRate] = useState('0.0096 USD');
  const [newRangeLimit, setNewRangeLimit] = useState('10,000');
  const [newRangeSampleNumber, setNewRangeSampleNumber] = useState('');
  const [newRangeBulkNumbers, setNewRangeBulkNumbers] = useState('');
  const [isAddingRange, setIsAddingRange] = useState(false);

  // Edit Range Modal
  const [editingRange, setEditingRange] = useState<TerminationRangeItem | null>(null);
  const [editRate, setEditRate] = useState('');
  const [editOperator, setEditOperator] = useState('');
  const [editService, setEditService] = useState('');
  const [editSampleNumber, setEditSampleNumber] = useState('');
  const [editAppendNumbers, setEditAppendNumbers] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Test Route Diagnostic Modal
  const [testedRouteResult, setTestedRouteResult] = useState<{
    range: string;
    country: string;
    number: string;
    liveCheck: {
      online: boolean;
      status: string;
      latency: string;
      signal: string;
      carrierGateway: string;
      smsDeliveryRate: string;
      otpLatency: string;
      checkedAt: string;
    };
  } | null>(null);
  const [isTestingRoute, setIsTestingRoute] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Countries
      const cRes = await fetch('/api/countries-list');
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.countries && Array.isArray(cData.countries)) {
          setCountries(cData.countries);
        }
      }

      // 2. Fetch Termination Ranges
      const rRes = await fetch('/api/terminations');
      if (rRes.ok) {
        const rData = await rRes.json();
        if (rData.terminations && Array.isArray(rData.terminations)) {
          setRanges(rData.terminations);
        }
      }
    } catch (err: any) {
      console.error('Error loading ranges/countries:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // SSE listener for instant sync
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream-updates');
      eventSource.onmessage = () => {
        fetchData();
      };
    } catch (e) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Country actions
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName.trim()) {
      showToast('Please enter a valid country name');
      return;
    }

    try {
      const res = await fetch('/api/countries-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: {
            name: newCountryName.trim(),
            code: newCountryCode.trim() || newCountryName.substring(0, 2).toUpperCase(),
            prefix: newCountryPrefix.trim() || '+1',
            flag: newCountryFlag.trim() || '🌐',
            active: true
          }
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`Country "${newCountryName}" added successfully!`);
        setCountries(data.countries || []);
        setNewCountryName('');
        setNewCountryCode('');
        setNewCountryPrefix('');
        setNewCountryFlag('🌐');
        setIsAddingCountry(false);
      } else {
        showToast(data.message || 'Failed to add country');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleDeleteCountry = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete country "${name}"?`)) return;

    try {
      const res = await fetch(`/api/countries-list/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`Country "${name}" deleted.`);
        setCountries(data.countries || []);
      }
    } catch (e: any) {
      showToast(`Delete failed: ${e.message}`);
    }
  };

  // Range actions
  const handleAddRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRangeName = newRangeName.trim() || `${newRangeCountry} - ${newRangeOperator.trim() || 'Direct Route'}`;
    if (!newRangeCountry || !finalRangeName) {
      showToast('Please specify country and range name');
      return;
    }

    let parsedPool: string[] = [];
    if (newRangeBulkNumbers.trim()) {
      parsedPool = newRangeBulkNumbers
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(s => s.length > 5);
    }

    try {
      const res = await fetch('/api/add-termination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: newRangeCountry,
          operator: newRangeOperator.trim() || 'Direct Carrier',
          service: newRangeService,
          rangeName: finalRangeName,
          rate: newRangeRate.trim() || '0.0096 USD',
          limit: newRangeLimit.trim() || '10,000',
          sampleNumber: newRangeSampleNumber.trim() || (parsedPool.length > 0 ? parsedPool[0] : ''),
          numbersPool: parsedPool
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        showToast(`Termination range "${finalRangeName}" created & synchronized!`);
        setIsAddingRange(false);
        setNewRangeOperator('');
        setNewRangeName('');
        setNewRangeSampleNumber('');
        setNewRangeBulkNumbers('');
        await fetchData();
      } else {
        showToast(data.message || 'Failed to add range');
      }
    } catch (e: any) {
      showToast(`Error: ${e.message}`);
    }
  };

  const handleOpenEditRange = (range: TerminationRangeItem) => {
    setEditingRange(range);
    setEditRate(range.rate || '0.0096 USD');
    setEditOperator(range.operator || '');
    setEditService(range.service || 'All Services');
    setEditSampleNumber(range.number || '');
    setEditAppendNumbers('');
  };

  const handleSaveRangeEdit = async () => {
    if (!editingRange) return;
    setIsSavingEdit(true);

    try {
      // 1. Update general properties
      const updateRes = await fetch('/api/update-termination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingRange.code,
          country: editingRange.country,
          operator: editOperator.trim() || editingRange.operator,
          service: editService.trim() || editingRange.service,
          rate: editRate.trim() || editingRange.rate,
          sampleNumber: editSampleNumber.trim() || editingRange.number
        })
      });

      // 2. Append new numbers if supplied
      if (editAppendNumbers.trim()) {
        const extraNums = editAppendNumbers
          .split(/[\n,;]+/)
          .map(s => s.trim())
          .filter(s => s.length > 5);

        if (extraNums.length > 0) {
          await fetch('/api/append-termination-numbers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rangeCode: editingRange.code,
              newNumbers: extraNums
            })
          });
        }
      }

      showToast(`Range "${editingRange.rangeName}" updated successfully!`);
      setEditingRange(null);
      await fetchData();
    } catch (e: any) {
      showToast(`Save error: ${e.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRange = async (code: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete range "${name}"?`)) return;

    try {
      const res = await fetch('/api/delete-termination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, rangeName: name })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`Range "${name}" deleted successfully.`);
        await fetchData();
      } else {
        showToast(data.message || 'Failed to delete range');
      }
    } catch (e: any) {
      showToast(`Delete failed: ${e.message}`);
    }
  };

  const handleTestRoute = async (range: TerminationRangeItem) => {
    setIsTestingRoute(range.code);
    try {
      const res = await fetch('/api/test-route-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rangeCode: range.code,
          rangeName: range.rangeName,
          number: range.number || '',
          country: range.country
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setTestedRouteResult(data);
        showToast(`Live Route check complete for ${range.rangeName}! Latency: ${data.liveCheck.latency}`);
      }
    } catch (e: any) {
      showToast(`Test error: ${e.message}`);
    } finally {
      setIsTestingRoute(null);
    }
  };

  // Filtered lists
  const filteredRanges = ranges.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      (r.rangeName && r.rangeName.toLowerCase().includes(q)) ||
      (r.country && r.country.toLowerCase().includes(q)) ||
      (r.operator && r.operator.toLowerCase().includes(q)) ||
      (r.code && r.code.toLowerCase().includes(q))
    );
  });

  const filteredCountries = countries.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.prefix.includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans animate-fade-in">
      {/* Header Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-md">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>Country & Termination Range Manager</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase">
                Real-Time
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Add, edit, delete, and test live SMS routes, phone number pools, and country prefixes with zero reloads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live</span>
          </button>

          {subTab === 'ranges' ? (
            <button
              onClick={() => setIsAddingRange(!isAddingRange)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-cyan-950/50 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingRange ? 'Close Form' : 'Add New Range'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddingCountry(!isAddingCountry)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingCountry ? 'Close Form' : 'Add New Country'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-700">
          <button
            onClick={() => setSubTab('ranges')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              subTab === 'ranges'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Termination Ranges ({ranges.length})</span>
          </button>
          <button
            onClick={() => setSubTab('countries')}
            className={`px-5 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              subTab === 'countries'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Countries ({countries.length})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={subTab === 'ranges' ? 'Search range, operator...' : 'Search country, code, prefix...'}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* CREATE NEW RANGE FORM */}
      {isAddingRange && subTab === 'ranges' && (
        <form onSubmit={handleAddRange} className="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create New Termination Range / Route</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingRange(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Country</label>
              <select
                value={newRangeCountry}
                onChange={(e) => setNewRangeCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white focus:outline-none"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.flag} {c.name} ({c.prefix})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Operator / Route Name</label>
              <input
                type="text"
                value={newRangeOperator}
                onChange={(e) => setNewRangeOperator(e.target.value)}
                placeholder="e.g. Bakcell Direct 4, T-Mobile Ultra"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Service Tag</label>
              <input
                type="text"
                value={newRangeService}
                onChange={(e) => setNewRangeService(e.target.value)}
                placeholder="e.g. Telegram, WhatsApp, All OTP"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Range Display Label (Optional)</label>
              <input
                type="text"
                value={newRangeName}
                onChange={(e) => setNewRangeName(e.target.value)}
                placeholder="Leave blank for auto-generated label"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Payout Rate per SMS</label>
              <input
                type="text"
                value={newRangeRate}
                onChange={(e) => setNewRangeRate(e.target.value)}
                placeholder="0.0096 USD"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Sample Number</label>
              <input
                type="text"
                value={newRangeSampleNumber}
                onChange={(e) => setNewRangeSampleNumber(e.target.value)}
                placeholder="+994997712345"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Bulk Phone Numbers Pool (Paste numbers or copy-paste from TXT/CSV, 1 per line)
            </label>
            <textarea
              rows={3}
              value={newRangeBulkNumbers}
              onChange={(e) => setNewRangeBulkNumbers(e.target.value)}
              placeholder="+994997700001&#10;+994997700002&#10;+994997700003"
              className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingRange(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Range</span>
            </button>
          </div>
        </form>
      )}

      {/* CREATE NEW COUNTRY FORM */}
      {isAddingCountry && subTab === 'countries' && (
        <form onSubmit={handleAddCountry} className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Register New Country</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingCountry(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Country Name</label>
              <input
                type="text"
                required
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                placeholder="e.g. Canada, Sweden, Japan"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Flag Emoji / Icon</label>
              <input
                type="text"
                value={newCountryFlag}
                onChange={(e) => setNewCountryFlag(e.target.value)}
                placeholder="🇨🇦"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">ISO 2-Letter Code</label>
              <input
                type="text"
                maxLength={3}
                value={newCountryCode}
                onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                placeholder="CA"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Calling Prefix</label>
              <input
                type="text"
                value={newCountryPrefix}
                onChange={(e) => setNewCountryPrefix(e.target.value)}
                placeholder="+1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingCountry(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Country</span>
            </button>
          </div>
        </form>
      )}

      {/* RANGES TABLE LIST */}
      {subTab === 'ranges' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-200 uppercase font-black tracking-wider">
                  <th className="py-3.5 px-4">Country & Range</th>
                  <th className="py-3.5 px-4">Operator / Service</th>
                  <th className="py-3.5 px-4">Payout Rate</th>
                  <th className="py-3.5 px-4">Stock Pool</th>
                  <th className="py-3.5 px-4">Sample Route Number</th>
                  <th className="py-3.5 px-4 text-center">Live Check</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRanges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-bold">
                      No termination ranges found. Click "Add New Range" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredRanges.map((range) => {
                    const isCustom = range.code.startsWith('TERM_');
                    const poolCount = Array.isArray(range.numbersPool) ? range.numbersPool.length : 0;
                    return (
                      <tr key={range.code} className="hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-300 font-black text-xs">
                              {range.country ? range.country.substring(0, 2).toUpperCase() : 'GL'}
                            </span>
                            <div>
                              <p className="font-bold text-white text-xs">{range.rangeName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{range.code}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-xs font-bold text-slate-200">{range.operator || 'Carrier'}</p>
                          <span className="text-[10px] text-cyan-300 font-medium">
                            {range.service || 'Telegram & All'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-black text-xs">
                            {range.rate || '0.0096 USD'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px]">
                            {poolCount > 0 ? `${poolCount} in pool` : range.available || 'Unlimited'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-cyan-300 font-bold">
                            {range.number || '+994XXXXXXXX'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleTestRoute(range)}
                            disabled={isTestingRoute === range.code}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 mx-auto shadow-sm"
                          >
                            <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isTestingRoute === range.code ? 'animate-spin' : ''}`} />
                            <span>{isTestingRoute === range.code ? 'Pinging...' : 'Test Route'}</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditRange(range)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white transition cursor-pointer"
                              title="Edit Range & Add Numbers"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRange(range.code, range.rangeName)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 hover:text-red-300 transition cursor-pointer"
                              title="Delete Range"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COUNTRIES TABLE LIST */}
      {subTab === 'countries' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-200 uppercase font-black tracking-wider">
                  <th className="py-3.5 px-4">Country</th>
                  <th className="py-3.5 px-4">ISO Code</th>
                  <th className="py-3.5 px-4">Prefix</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCountries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No countries found. Click "Add New Country" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredCountries.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{c.flag || '🌐'}</span>
                          <div>
                            <p className="font-bold text-white text-xs">{c.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{c.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-slate-200 font-bold">
                          {c.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-cyan-300 font-black text-xs">
                          {c.prefix}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-bold text-[10px] flex items-center gap-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Active
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteCountry(c.id, c.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="Delete Country"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT RANGE MODAL */}
      {editingRange && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Edit Termination: {editingRange.rangeName}</h3>
              </div>
              <button
                onClick={() => setEditingRange(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Operator / Route Name</label>
                <input
                  type="text"
                  value={editOperator}
                  onChange={(e) => setEditOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Payout Rate</label>
                <input
                  type="text"
                  value={editRate}
                  onChange={(e) => setEditRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Sample Phone Number</label>
                <input
                  type="text"
                  value={editSampleNumber}
                  onChange={(e) => setEditSampleNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Append Extra Numbers to Pool (Optional, 1 per line)
                </label>
                <textarea
                  rows={3}
                  value={editAppendNumbers}
                  onChange={(e) => setEditAppendNumbers(e.target.value)}
                  placeholder="+994997700010&#10;+994997700011"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRange(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRangeEdit}
                disabled={isSavingEdit}
                className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST ROUTE DIAGNOSTIC MODAL */}
      {testedRouteResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-black text-white">Route Health Check Report</h3>
              </div>
              <button
                onClick={() => setTestedRouteResult(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Target Route:</span>
                <span className="text-white font-bold">{testedRouteResult.range}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Country:</span>
                <span className="text-cyan-300 font-bold">{testedRouteResult.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Latency:</span>
                <span className="text-emerald-400 font-black">{testedRouteResult.liveCheck.latency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Signal Quality:</span>
                <span className="text-emerald-400 font-bold">{testedRouteResult.liveCheck.signal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Delivery Success Rate:</span>
                <span className="text-emerald-400 font-black">{testedRouteResult.liveCheck.smsDeliveryRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">OTP Latency:</span>
                <span className="text-white font-mono">{testedRouteResult.liveCheck.otpLatency}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {testedRouteResult.liveCheck.carrierGateway}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setTestedRouteResult(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-lg"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
