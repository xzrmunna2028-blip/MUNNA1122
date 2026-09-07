import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Banknote, 
  Wallet, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Building2,
  X
} from 'lucide-react';

interface PaymentMethodItem {
  id: string;
  type: 'Cash' | 'PayPal' | 'Tether (USDT)' | 'Bank Transfer';
  details: string;
  isDefault: boolean;
  addedAt: string;
}

export const PaymentMethodsView: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(() => {
    const saved = localStorage.getItem('ksi_payment_methods');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'Cash' | 'PayPal' | 'Tether (USDT)' | 'Bank Transfer'>('Cash');
  const [accountDetail, setAccountDetail] = useState('');

  const saveMethods = (methods: PaymentMethodItem[]) => {
    setPaymentMethods(methods);
    localStorage.setItem('ksi_payment_methods', JSON.stringify(methods));
  };

  const handleAddMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetail.trim()) return;

    const newMethod: PaymentMethodItem = {
      id: Date.now().toString(),
      type: selectedOption,
      details: accountDetail,
      isDefault: paymentMethods.length === 0,
      addedAt: new Date().toLocaleDateString(),
    };

    saveMethods([...paymentMethods, newMethod]);
    setAccountDetail('');
    setShowAddModal(false);
  };

  const handleDeleteMethod = (id: string) => {
    const filtered = paymentMethods.filter((m) => m.id !== id);
    saveMethods(filtered);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <span>Dashboard</span>
        <span>&gt;</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">Payment Methods</span>
      </div>

      {/* Header section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Payment Methods
        </h2>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Manage how you receive your payments
        </p>
      </div>

      {/* Payment methods list or empty state */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xs">
        {paymentMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 stroke-[1.5]" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Payment Methods Yet
            </h3>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
              Add a payment method to start receiving your earnings. We support various options including bank transfer, PayPal, crypto, and more.
            </p>

            <button
              onClick={() => setShowAddModal(true)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-[#65a30d] hover:bg-lime-700 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Your First Payment Method</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Active Receiving Methods ({paymentMethods.length})
              </span>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#65a30d] hover:bg-lime-700 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Method</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="p-5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#65a30d] font-bold shadow-xs">
                        {method.type === 'Cash' && <Banknote className="w-5 h-5" />}
                        {method.type === 'PayPal' && <DollarSign className="w-5 h-5" />}
                        {method.type === 'Tether (USDT)' && <Wallet className="w-5 h-5" />}
                        {method.type === 'Bank Transfer' && <Building2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {method.type}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {method.details}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-slate-400 hover:text-rose-500 transition p-1"
                      title="Remove method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px]">
                    <span className="font-semibold text-slate-400">
                      Added: {method.addedAt}
                    </span>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Available Payment Options Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Available Payment Options
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            PROCESSING TIME
          </span>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Option 1: Cash */}
          <div 
            onClick={() => {
              setSelectedOption('Cash');
              setShowAddModal(true);
            }}
            className="p-5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-lime-500 dark:hover:border-lime-500 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center group-hover:scale-105 transition">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                Cash
              </p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                Instant
              </p>
            </div>
          </div>

          {/* Option 2: PayPal */}
          <div 
            onClick={() => {
              setSelectedOption('PayPal');
              setShowAddModal(true);
            }}
            className="p-5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-lime-500 dark:hover:border-lime-500 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center group-hover:scale-105 transition">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                PayPal
              </p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                Instant
              </p>
            </div>
          </div>

          {/* Option 3: Tether USDT */}
          <div 
            onClick={() => {
              setSelectedOption('Tether (USDT)');
              setShowAddModal(true);
            }}
            className="p-5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-lime-500 dark:hover:border-lime-500 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center group-hover:scale-105 transition">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white">
                Tether (USDT)
              </p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                1 day(s)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-6 text-center space-y-1">
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          © 2026 KSI IPRN TECHNOLOGY. All rights reserved.
        </p>
        <p className="text-[10px] font-extrabold text-slate-300 dark:text-slate-600 tracking-widest uppercase">
          SWITCHFY v3.0.0
        </p>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Add Payment Method
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMethod} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Payment Type
                </label>
                <select
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
                >
                  <option value="Cash">Cash (Instant)</option>
                  <option value="PayPal">PayPal (Instant)</option>
                  <option value="Tether (USDT)">Tether - USDT (1 day)</option>
                  <option value="Bank Transfer">Bank Transfer (1-3 days)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedOption === 'PayPal' ? 'PayPal Email Address' : selectedOption === 'Tether (USDT)' ? 'USDT (TRC20/ERC20) Wallet Address' : selectedOption === 'Cash' ? 'Account / Mobile Number for Cash Receipt' : 'Bank Account / IBAN'}
                </label>
                <input
                  type="text"
                  required
                  value={accountDetail}
                  onChange={(e) => setAccountDetail(e.target.value)}
                  placeholder={selectedOption === 'PayPal' ? 'user@example.com' : selectedOption === 'Tether (USDT)' ? 'T...' : '01700000000'}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#65a30d] hover:bg-lime-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
