import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';

interface RevenueCardProps {
  isDemoMode: boolean;
  totalMessages: number;
}

export const RevenueCard: React.FC<RevenueCardProps> = ({ totalMessages }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'BDT'>('USD');

  // Revenue calculation locked to 0.00 as requested because payment system is locked
  const currencySymbol = selectedCurrency === 'BDT' ? '৳' : selectedCurrency === 'EUR' ? '€' : '$';
  const estimatedRevenue = '0.00';
  const hasTraffic = totalMessages > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="font-bold text-slate-900 dark:text-white text-base">
          Revenue by currency
        </span>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
          PERIOD
        </span>
      </div>

      {/* Content Body */}
      <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center my-auto">
        {!hasTraffic ? (
          <>
            {/* Empty State Icon from Screenshot 2 */}
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 stroke-[1.75]" />
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No traffic in this period
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Revenue appears once messages are billed
            </p>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                {currencySymbol}{estimatedRevenue}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total billed revenue across active routes ({totalMessages.toLocaleString()} messages)
            </p>
          </div>
        )}
      </div>

      {/* Footer with Currency Selector */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          Currency filter
        </span>
        <div className="flex items-center gap-1">
          {(['USD', 'EUR', 'BDT'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setSelectedCurrency(curr)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                selectedCurrency === curr
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
