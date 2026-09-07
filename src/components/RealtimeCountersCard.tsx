import React from 'react';
import { Radio, Plus, RotateCcw } from 'lucide-react';
import { RealtimeCounters } from '../types';

interface RealtimeCountersCardProps {
  counters: RealtimeCounters;
  onResetCounters?: () => void;
  onCounterClick?: (type: 'total' | 'delivered' | 'failed' | 'charged') => void;
}

export const RealtimeCountersCard: React.FC<RealtimeCountersCardProps> = ({
  counters,
  onResetCounters,
  onCounterClick,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white text-base">
            Today
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            real-time counters
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Badge matching screenshot */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            LIVE
          </span>
        </div>
      </div>

      {/* Grid of Counters */}
      <div className="p-5 grid grid-cols-2 gap-4 sm:gap-6">
        {/* TOTAL MESSAGES */}
        <div 
          onClick={() => onCounterClick?.('total')}
          className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group"
          title="Tap to view all messages"
        >
          <span className="text-[11px] tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            TOTAL MESSAGES
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {counters.totalMessages.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#65a30d] font-bold opacity-0 group-hover:opacity-100 transition">View →</span>
          </div>
        </div>

        {/* DELIVERED */}
        <div 
          onClick={() => onCounterClick?.('delivered')}
          className="p-3 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition cursor-pointer group"
          title="Tap to view delivered messages"
        >
          <span className="text-[11px] tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            DELIVERED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {counters.delivered.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition">View →</span>
          </div>
        </div>

        {/* FAILED */}
        <div 
          onClick={() => onCounterClick?.('failed')}
          className="p-3 rounded-xl hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition cursor-pointer group pt-3 border-t border-slate-100 dark:border-slate-800/80"
          title="Tap to view failed messages"
        >
          <span className="text-[11px] tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400">
            FAILED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {counters.failed.toLocaleString()}
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition">View →</span>
          </div>
        </div>

        {/* CHARGED */}
        <div 
          onClick={() => onCounterClick?.('charged')}
          className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group pt-3 border-t border-slate-100 dark:border-slate-800/80"
          title="Tap to view charged messages"
        >
          <span className="text-[11px] tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-300">
            CHARGED
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {counters.charged.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#65a30d] font-bold opacity-0 group-hover:opacity-100 transition">View →</span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          Tap any counter to inspect live stream
        </span>
        <div className="flex items-center gap-2">
          {onResetCounters && counters.totalMessages > 0 && (
            <button
              onClick={onResetCounters}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Reset Live Counters"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
