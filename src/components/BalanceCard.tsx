import React from 'react';
import { CreditCard } from 'lucide-react';

interface BalanceCardProps {
  isDemoMode: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = () => {
  // Dollar payment system is locked across the entire panel
  const balance: number = 0.00;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-slate-900 dark:text-white text-base">
            Available balance
          </span>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            UNINVOICED
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center my-auto">
          {balance === 0 ? (
            <>
              {/* Wallet/Card Icon from Screenshot 2 */}
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 stroke-[1.75]" />
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                No uninvoiced balance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Uninvoiced usage will be billed at billing cycle end
              </p>
            </>
          ) : (
            <div className="w-full">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white block mb-1">
                ${(balance as number).toFixed(2)}
              </span>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ● Pre-funded account credit active
              </p>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium">
            Auto-recharge: OFF
          </span>
        </div>
      </div>
    </>
  );
};
