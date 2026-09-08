import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import { TimePeriod } from '../types.js';

interface TimeFilterBarProps {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastRefreshed: string;
}

export const TimeFilterBar: React.FC<TimeFilterBarProps> = ({
  timePeriod,
  setTimePeriod,
  onRefresh,
  isRefreshing,
  lastRefreshed,
}) => {
  const periods: TimePeriod[] = ['7 days', '30 days', '90 days'];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Traffic overview
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-lime-500/15 text-lime-700 dark:text-lime-300 border border-lime-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-ping" />
            Live Gateway
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Aggregated real-time OTP performance · Last {timePeriod}
        </p>
      </div>

      {/* Time Pills & Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Time Period Filter Pills */}
        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          {periods.map((period) => {
            const isActive = timePeriod === period;
            return (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>

        {/* Refresh Button (Dark pill matching screenshot) */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 bg-[#18181b] hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-75 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-lime-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};
