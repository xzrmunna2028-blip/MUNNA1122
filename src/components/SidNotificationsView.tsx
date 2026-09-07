import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';

interface SidWatchItem {
  id: string;
  sid: string;
  country: string;
  dateAdded: string;
  active: boolean;
}

export const SidNotificationsView: React.FC = () => {
  const [sidInput, setSidInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All Countries');
  const [watchedSids, setWatchedSids] = useState<SidWatchItem[]>([]);
  
  // Custom validation tool-tip visibility state
  const [showValidationError, setShowValidationError] = useState(false);

  // Available countries matching our system
  const countries = [
    'All Countries',
    'Ghana',
    'Uzbekistan',
    'Israel',
    'Togo',
    'Guyana',
    'Ivory Coast',
    'Cambodia',
    'Ecuador',
    'Ukraine'
  ];

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sid_notifications');
    if (saved) {
      try {
        setWatchedSids(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save to localStorage whenever watchedSids changes
  const saveToLocalStorage = (items: SidWatchItem[]) => {
    localStorage.setItem('sid_notifications', JSON.stringify(items));
    setWatchedSids(items);
  };

  // Add SID handler
  const handleAddSid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sidInput.trim()) {
      setShowValidationError(true);
      // Automatically hide error bubble after a few seconds
      setTimeout(() => setShowValidationError(false), 4000);
      return;
    }

    setShowValidationError(false);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const newItem: SidWatchItem = {
      id: `SID-${Math.floor(100000 + Math.random() * 900000)}`,
      sid: sidInput.trim(),
      country: selectedCountry,
      dateAdded: dateStr,
      active: true
    };

    const updated = [newItem, ...watchedSids];
    saveToLocalStorage(updated);
    
    // Clear inputs
    setSidInput('');
  };

  // Delete SID handler
  const handleDeleteSid = (id: string) => {
    const filtered = watchedSids.filter(item => item.id !== id);
    saveToLocalStorage(filtered);
  };

  // Toggle active alert handler
  const handleToggleActive = (id: string) => {
    const updated = watchedSids.map(item => {
      if (item.id === id) {
        return { ...item, active: !item.active };
      }
      return item;
    });
    saveToLocalStorage(updated);
  };

  return (
    <div className="space-y-6" id="sid-notifications-main-container">
      {/* Breadcrumbs matching screenshot */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500" id="sid-notifications-breadcrumbs">
        <span>Dashboard</span>
        <ChevronDown className="w-3 h-3 rotate-270 opacity-60" />
        <span>Test System</span>
        <ChevronDown className="w-3 h-3 rotate-270 opacity-60" />
        <span className="text-slate-600 dark:text-slate-300">SID Notifications</span>
      </div>

      {/* Header and description */}
      <div className="space-y-1.5" id="sid-notifications-header-block">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          SID notifications
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Get alerted when traffic arrives for a sender ID you are watching
        </p>
      </div>

      {/* 1. Add SID Notification Box Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden" id="add-sid-notification-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">Add SID notification</span>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest">NEW WATCH</span>
        </div>

        <form onSubmit={handleAddSid} className="p-5 space-y-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SID Input Field */}
            <div className="space-y-1.5 relative">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400" htmlFor="sid-input-field">
                SID (sender ID)
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  id="sid-input-field"
                  value={sidInput}
                  onChange={(e) => {
                    setSidInput(e.target.value);
                    if (e.target.value.trim()) {
                      setShowValidationError(false);
                    }
                  }}
                  placeholder="Enter SID..."
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${
                    showValidationError 
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-[#65a30d]'
                  } rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none transition`}
                />

                {/* Validation bubble tooltip requested by user: "Please fill out this field." */}
                {showValidationError && (
                  <div 
                    className="absolute z-10 bottom-full left-0 mb-2 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 border border-slate-800 animate-bounce"
                    id="validation-error-tooltip"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Please fill out this field.</span>
                    {/* Tooltip triangle tail */}
                    <div className="absolute top-full left-4 w-2 h-2 bg-slate-900 dark:bg-slate-800 transform rotate-45 -translate-y-1"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Country Dropdown Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400" htmlFor="country-select-dropdown">
                Country <span className="text-slate-400 font-semibold">(optional)</span>
              </label>
              <div className="relative">
                <select
                  id="country-select-dropdown"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black transition shadow-xs"
              id="add-sid-submit-btn"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add SID</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. SID List Box Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs" id="watched-sid-list-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">SID list</span>
          <span className="text-[10px] font-black text-[#65a30d] bg-[#65a30d]/10 px-2.5 py-0.5 rounded-md tracking-widest">
            {watchedSids.length} {watchedSids.length === 1 ? 'SID' : 'SIDs'}
          </span>
        </div>

        {watchedSids.length === 0 ? (
          /* Empty state matching screenshot exactly */
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-4" id="sid-list-empty-state">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-150 dark:border-slate-800/80 shadow-xs">
              <BellOff className="w-6 h-6 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                No SIDs added
              </h3>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                Add your first SID using the form above.
              </p>
            </div>
          </div>
        ) : (
          /* Active table listing watched SIDs */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold text-slate-600 dark:text-slate-400 border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[35%]">SENDER ID (SID)</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[25%]">COUNTRY</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[20%]">DATE WATCHED</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black w-[10%]">ALERTS</th>
                  <th className="p-4 text-slate-400 uppercase tracking-widest text-[10px] font-black text-right w-[10%]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {watchedSids.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.active 
                            ? 'bg-[#65a30d]/10 text-[#65a30d]' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        } shrink-0`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-slate-900 dark:text-slate-200 font-extrabold tracking-tight">{item.sid}</div>
                          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{item.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-slate-200/40 dark:border-slate-850">
                        {item.country}
                      </span>
                    </td>

                    <td className="p-4 align-middle text-slate-500 dark:text-slate-400">
                      {item.dateAdded}
                    </td>

                    <td className="p-4 align-middle">
                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          item.active ? 'bg-[#65a30d]' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                        title={item.active ? 'Mute alerts' : 'Unmute alerts'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            item.active ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="p-4 align-middle text-right">
                      <button
                        onClick={() => handleDeleteSid(item.id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg transition"
                        title="Delete watch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
