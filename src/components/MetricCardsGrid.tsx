import React from 'react';
import { MessageSquare, Check, AlertTriangle, Calendar } from 'lucide-react';
import { MetricData } from '../types';

interface MetricCardsGridProps {
  data: MetricData;
  onCardClick?: (type: 'messages' | 'delivered' | 'failed' | 'today') => void;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({ data, onCardClick }) => {
  // Format numbers with commas
  const formatNum = (num: number) => num.toLocaleString('en-US');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. MESSAGES Card */}
      <div 
        onClick={() => onCardClick?.('messages')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs border-t-4 border-t-lime-500 flex flex-col justify-between transition-all hover:shadow-md hover:border-lime-500/40 cursor-pointer group active:scale-[0.98]"
        title="Tap to view live OTP messages"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] sm:text-xs tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
              MESSAGES
            </span>
            <div className="mt-1 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNum(data.messages)}
              </span>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-lime-100/80 dark:bg-lime-950/80 text-lime-700 dark:text-lime-300 shrink-0 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5 fill-lime-500/20" />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 font-medium flex items-center justify-between">
          <span>Total received</span>
          <span className="text-[10px] text-lime-600 dark:text-lime-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
        </p>
      </div>

      {/* 2. DELIVERED Card */}
      <div 
        onClick={() => onCardClick?.('delivered')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs border-t-4 border-t-teal-400 flex flex-col justify-between transition-all hover:shadow-md hover:border-teal-400/40 cursor-pointer group active:scale-[0.98]"
        title="Tap to view delivered OTPs"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] sm:text-xs tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              DELIVERED
            </span>
            <div className="mt-1 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNum(data.delivered)}
              </span>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 shrink-0 group-hover:scale-110 transition-transform">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-1.5 mt-3 sm:mt-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {data.deliveryRate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              rate
            </span>
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
        </div>
      </div>

      {/* 3. FAILED Card */}
      <div 
        onClick={() => onCardClick?.('failed')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs border-t-4 border-t-rose-500 flex flex-col justify-between transition-all hover:shadow-md hover:border-rose-500/40 cursor-pointer group active:scale-[0.98]"
        title="Tap to view failed SMS"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] sm:text-xs tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              FAILED
            </span>
            <div className="mt-1 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNum(data.failed)}
              </span>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-rose-100/80 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 shrink-0 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 font-medium flex items-center justify-between">
          <span>Rejected / Failed</span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
        </p>
      </div>

      {/* 4. TODAY Card */}
      <div 
        onClick={() => onCardClick?.('today')}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs border-t-4 border-t-amber-500 flex flex-col justify-between transition-all hover:shadow-md hover:border-amber-500/40 cursor-pointer group active:scale-[0.98]"
        title="Tap to view today's traffic"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] sm:text-xs tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              TODAY
            </span>
            <div className="mt-1 sm:mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatNum(data.todayCount)}
              </span>
            </div>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-100/80 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shrink-0 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 font-medium flex items-center justify-between">
          <span>{data.todayDate}</span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
        </p>
      </div>
    </div>
  );
};
