import React, { useState, useEffect } from 'react';
import { getRealSmsLogs } from '../utils/realtimeSmsService.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  ChevronDown,
  Plus,
  AlertTriangle,
  FolderOpen,
  DollarSign,
  Briefcase,
  HelpCircle,
  X,
  Check,
  CreditCard,
  Building,
  User,
  ArrowRight,
  Lock,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { PaymentMethod } from '../types.js';

interface InvoiceMetric {
  title: string;
  value: string | number;
  label: string;
  icon: React.ComponentType<any>;
  topBorderClass: string;
  iconBgClass: string;
  iconColorClass: string;
}

interface InvoiceHistoryItem {
  id: string;
  period: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  dueDate: string;
  status: 'Processing' | 'Pending' | 'Approved' | 'Rejected' | 'Paid' | 'Repaid' | 'Cancelled';
}

const DEFAULT_INVOICES_DEMO: InvoiceHistoryItem[] = [];

// 1. Authentic Brand Logos
const BkashLogo = () => (
  <div className="w-10 h-10 rounded-xl bg-[#e2136e] flex items-center justify-center p-1.5 shadow-xs shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
      <path d="M50 5 L88 28 L88 72 L50 95 L12 72 L12 28 Z" fill="#e2136e" />
      <path d="M30 45 L50 25 L70 45 L60 68 L50 52 L40 68 Z" fill="#FFFFFF" />
      <path d="M50 52 L70 45 L70 70 L50 82 Z" fill="#f8a5c2" opacity="0.85" />
    </svg>
  </div>
);

const NagadLogo = () => (
  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f7931e] to-[#ed1c24] flex items-center justify-center p-1.5 shadow-xs shrink-0">
    <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
      <path d="M25 75 C18 60 22 35 48 20 C52 35 48 50 42 60 C58 45 72 38 78 52 C82 68 68 82 48 82 C32 82 26 80 25 75 Z" fill="#FFFFFF" />
      <circle cx="48" cy="58" r="9" fill="#ed1c24" />
    </svg>
  </div>
);

const PaypalLogo = () => (
  <div className="w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center p-2 shadow-xs shrink-0">
    <svg viewBox="0 0 32 32" className="w-6 h-6">
      <path d="M11 23.5h3.2l1.6-10.2H20c3.2 0 5.2 1.5 4.6 5.1-.6 3.9-3.3 6.1-7.1 6.1h-2.5l-1.3 8h-4.3l1.6-9z" fill="#0079C1" />
      <path d="M8 28.5h3.8l2.2-14.2H19c3.2 0 5.2 1.5 4.6 5.1-.6 3.9-3.3 6.1-7.1 6.1h-2.5l-1.8 11H8.3L8 28.5z" fill="#00457C" opacity="0.7" />
      <path d="M13.8 8.5h6.2c3.2 0 5.2 1.5 4.6 5.1-.6 3.9-3.3 6.1-7.1 6.1h-2.5l-1.8 11H9l2.8-17.7 2 4.5z" fill="#0079C1" />
    </svg>
  </div>
);

const UsdtLogo = () => (
  <div className="w-10 h-10 rounded-xl bg-[#26A17B] flex items-center justify-center p-2 shadow-xs shrink-0">
    <svg viewBox="0 0 32 32" className="w-6 h-6 fill-white">
      <path d="M17.922 17.383c-.115.008-.267.016-.459.016-1.146 0-2.822-.09-3.667-.282v1.543c1.077.205 2.659.29 3.667.29.213 0 .361-.008.459-.016v-1.551zm-1.922-6.505v2.802h3.918v-2.802h-3.918zm0 4.137c.72 0 1.936-.033 2.871-.115v-1.009h-5.742v1.009c.935.082 2.151.115 2.871.115z"/>
      <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm3.918 6.878v2.802H16v-2.802h3.918zM12.082 10.878H16v2.802h-3.918v-2.802zm-1.802-1.918h11.44v1.516h-4.801v.402h3.918v2.802h-3.918v.238c3.256.139 5.725 1.041 5.725 2.149 0 1.205-2.936 2.182-6.644 2.182s-6.644-.977-6.644-2.182c0-1.108 2.469-2.01 5.725-2.149v-.238H11.08v-2.802h3.918v-.402H10.28V8.96z"/>
    </svg>
  </div>
);

const CashLogo = () => (
  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center p-2 shadow-xs shrink-0 text-white">
    <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-current fill-none stroke-2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  </div>
);

interface MyInvoicesViewProps {
  onNavigateToPaymentMethods?: () => void;
}

export const MyInvoicesView: React.FC<MyInvoicesViewProps> = ({ onNavigateToPaymentMethods }) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState<boolean>(false);
  
  // Modal Navigation & Form Selection State
  const [modalStep, setModalStep] = useState<'hub' | 'select' | 'form'>('hub');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState('TRC20');
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<InvoiceHistoryItem[]>([]);
  const [otpCount, setOtpCount] = useState<number>(0);
  const [noticeToast, setNoticeToast] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('All Currencies');

  // Load state from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const savedInvoices = localStorage.getItem('my_invoices_list');
      const savedPayment = localStorage.getItem('has_payment_method');
      const savedVerified = localStorage.getItem('has_verified_payment_method');
      const existingMethods = localStorage.getItem('user_payment_methods');

      if (savedInvoices) {
        try {
          setInvoices(JSON.parse(savedInvoices));
        } catch (e) {
          setInvoices(DEFAULT_INVOICES_DEMO);
        }
      }

      if (existingMethods) {
        try {
          const parsed = JSON.parse(existingMethods);
          setSavedMethods(parsed);
          if (parsed.length > 0) {
            setHasPaymentMethod(true);
          }
        } catch (e) {
          setSavedMethods([]);
        }
      } else if (savedPayment === 'true' || savedVerified === 'true') {
        setHasPaymentMethod(true);
      }

      // Calculate delivered OTPs from user-scoped real_sms_logs + bonus OTP count
      const logs = getRealSmsLogs();
      const deliveredCount = logs.filter((l: any) => l.status === 'DELIVERED').length;
      const bonusOtp = parseInt(localStorage.getItem('user_bonus_otp_count') || '0', 10);
      setOtpCount(deliveredCount + bonusOtp);
    };

    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('real_sms_updated', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('real_sms_updated', loadData);
    };
  }, []);

  const saveInvoicesToStorage = (updatedList: InvoiceHistoryItem[]) => {
    localStorage.setItem('my_invoices_list', JSON.stringify(updatedList));
    setInvoices(updatedList);
  };

  const handleSimulateAddOtp = (amount: number) => {
    const currentBonus = parseInt(localStorage.getItem('user_bonus_otp_count') || '0', 10);
    const updatedBonus = currentBonus + amount;
    localStorage.setItem('user_bonus_otp_count', updatedBonus.toString());
    window.dispatchEvent(new Event('real_sms_updated'));
  };

  const handleSelectOption = (type: string) => {
    if (!isUnlocked) {
      setNoticeToast(`🔒 Locked! Complete 100 OTPs to send an unlock request to admin. (${otpCount}/100 OTPs completed)`);
      setTimeout(() => setNoticeToast(null), 4000);
      return;
    }
    setSelectedType(type);
    setModalStep('form');
  };

  const handleResetForm = () => {
    setModalStep('hub');
    setSelectedType(null);
    setLabelInput('');
    setPickupLocation('');
    setNotes('');
    setPaypalEmail('');
    setUsdtAddress('');
    setUsdtNetwork('TRC20');
    setBkashNumber('');
    setNagadNumber('');
    setIsPrimary(false);
  };

  const handleSavePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    let detailsText = '';
    if (selectedType === 'bKash') detailsText = bkashNumber || 'Personal bKash Number';
    else if (selectedType === 'Nagad') detailsText = nagadNumber || 'Personal Nagad Number';
    else if (selectedType === 'PayPal') detailsText = paypalEmail || 'PayPal Account Email';
    else if (selectedType === 'USDT') detailsText = `${usdtAddress || 'Wallet'} (${usdtNetwork})`;
    else if (selectedType === 'Cash') detailsText = pickupLocation || 'Cash Pickup Location';

    const newMethod: PaymentMethod = {
      id: `PM-${Math.floor(100000 + Math.random() * 900000)}`,
      name: labelInput || `${selectedType} Account`,
      type: selectedType,
      details: detailsText,
      status: 'Verified',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    const updated = [newMethod, ...savedMethods];
    setSavedMethods(updated);
    localStorage.setItem('user_payment_methods', JSON.stringify(updated));
    setHasPaymentMethod(true);
    localStorage.setItem('has_payment_method', 'true');
    localStorage.setItem('has_verified_payment_method', 'true');

    handleResetForm();
    setModalStep('hub');
  };

  const handleDeleteMethod = (id: string) => {
    const updated = savedMethods.filter((m) => m.id !== id);
    setSavedMethods(updated);
    localStorage.setItem('user_payment_methods', JSON.stringify(updated));
    if (updated.length === 0) {
      setHasPaymentMethod(false);
      localStorage.removeItem('has_payment_method');
      localStorage.removeItem('has_verified_payment_method');
    }
  };

  // Helper metric list
  const metrics: InvoiceMetric[] = [
    {
      title: 'TOTAL INVOICES',
      value: invoices.length,
      label: 'Request count',
      icon: FileText,
      topBorderClass: 'border-t-4 border-t-amber-500',
      iconBgClass: 'bg-amber-100 dark:bg-amber-950/60',
      iconColorClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'UNPAID INVOICES',
      value: invoices.filter((i) => ['Pending', 'Processing'].includes(i.status)).length,
      label: 'Awaiting payment',
      icon: Clock,
      topBorderClass: 'border-t-4 border-t-blue-500',
      iconBgClass: 'bg-blue-100 dark:bg-blue-950/60',
      iconColorClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'PAID INVOICES',
      value: invoices.filter((i) => ['Paid', 'Approved'].includes(i.status)).length,
      label: 'Settled invoices',
      icon: CheckCircle2,
      topBorderClass: 'border-t-4 border-t-[#65a30d]',
      iconBgClass: 'bg-lime-100 dark:bg-lime-950/60',
      iconColorClass: 'text-[#65a30d]',
    },
    {
      title: 'REJECTED INVOICES',
      value: invoices.filter((i) => i.status === 'Rejected').length,
      label: 'Declined invoices',
      icon: X,
      topBorderClass: 'border-t-4 border-t-rose-500',
      iconBgClass: 'bg-rose-100 dark:bg-rose-950/60',
      iconColorClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'ACTIVE METHODS',
      value: savedMethods.length,
      label: 'Verified accounts',
      icon: CreditCard,
      topBorderClass: 'border-t-4 border-t-purple-500',
      iconBgClass: 'bg-purple-100 dark:bg-purple-950/60',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
    },
  ];

  // Filtering logic
  const filteredInvoices = invoices.filter((item) => {
    if (selectedStatus !== 'All Status' && item.status !== selectedStatus) {
      return false;
    }
    if (selectedCurrency !== 'All Currencies' && item.currency !== selectedCurrency) {
      return false;
    }
    return true;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900';
      case 'Processing':
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900';
      case 'Rejected':
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  // Check if admin explicitly unlocked this user account (defaults to false)
  const isAdminUnlocked = typeof window !== 'undefined' && localStorage.getItem('admin_unlocked_payment') === 'true';
  const isUnlocked = isAdminUnlocked;
  const progressPercent = Math.min(100, Math.round((otpCount / 100) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Invoices
        </h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your payout requests, payment methods, and invoice status
        </p>
      </div>

      {/* 5-Corner Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3" id="invoices-metric-grid">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 ${metric.topBorderClass} p-3.5 flex flex-col justify-between h-28 ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}
          >
            <div className="flex justify-between items-start gap-1">
              <span className="block text-[9px] sm:text-[10px] font-black text-slate-450 dark:text-slate-500 tracking-wider uppercase truncate">
                {metric.title}
              </span>
              <div className={`w-6 h-6 rounded-lg ${metric.iconBgClass} flex items-center justify-center shrink-0`}>
                <metric.icon className={`w-3.5 h-3.5 ${metric.iconColorClass}`} />
              </div>
            </div>
            <div className="space-y-0.5 mt-auto">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none">
                {metric.value}
              </div>
              <span className="block text-[9px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
                {metric.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step Progress Tracker Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden" id="request-new-invoice-box">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#65a30d] flex items-center justify-center text-white">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">
              Request New Invoice
            </span>
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">
            3 STEPS
          </span>
        </div>

        <div className="p-5 space-y-6">
          {/* Progress Tracker Bar */}
          <div className="flex items-center justify-between max-w-lg mx-auto relative pt-2" id="invoice-steps-indicator">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition ${
                activeStep >= 1 ? 'bg-[#65a30d] text-white' : 'bg-slate-150 dark:bg-slate-800 text-slate-400'
              }`}>
                1
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition ${
                activeStep >= 2 ? 'bg-[#65a30d] text-white' : 'bg-slate-150 dark:bg-slate-800 text-slate-400'
              }`}>
                2
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition ${
                activeStep >= 3 ? 'bg-[#65a30d] text-white' : 'bg-slate-150 dark:bg-slate-800 text-slate-400'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Condition Box based on Payment Method presence */}
          {!hasPaymentMethod ? (
            <div className="bg-[#fef3c7] dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-3" id="warning-payment-method">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Add a payment method before requesting an invoice
                  </h4>
                  <p className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                    An invoice needs a verified payment method to be paid to. Add one and it will be available here once our team has verified it.
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleResetForm();
                    setShowAddPaymentModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-400 text-xs font-black rounded-lg transition shadow-2xs cursor-pointer"
                  id="add-payment-method-btn"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add a payment method</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-55 border border-emerald-200/60 dark:bg-emerald-950/10 dark:border-emerald-900/30 rounded-xl p-4 flex items-center gap-3" id="verified-payment-success-badge">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0 text-emerald-600">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Verified Payment Method Active
                </h4>
                <p className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-400/80">
                  {savedMethods.length > 0
                    ? `Active account: ${savedMethods[0].name} (${savedMethods[0].type})`
                    : 'Your verified payment method is ready to receive invoice payouts.'}
                </p>
              </div>
              <button
                onClick={() => {
                  handleResetForm();
                  setShowAddPaymentModal(true);
                }}
                className="text-xs font-bold text-[#65a30d] hover:underline cursor-pointer"
              >
                + Add Another
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoice History & Filters Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Invoice History
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Filter and review your submitted payout invoices
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Realtime Status Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-40 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#65a30d] cursor-pointer"
                id="status-filter-select"
              >
                <option value="All Status">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
                <option value="Repaid">Repaid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Currency Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full sm:w-36 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-[#65a30d] cursor-pointer"
                id="currency-filter-select"
              >
                <option value="All Currencies">All Currencies</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BDT">BDT (৳)</option>
                <option value="USDT">USDT (₮)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Invoice Table / Empty State */}
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              No Invoices Found
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You haven't requested any invoices matching your selected filter parameters yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {filteredInvoices.map((invoice) => {
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/50 transition">
                      <td className="p-4 font-black text-slate-900 dark:text-white">
                        {invoice.id}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {invoice.period}
                      </td>

                      <td className="p-4">
                        <span className="text-slate-900 dark:text-slate-100 font-black text-xs">
                          ${invoice.amount} {invoice.currency}
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-450">
                        {invoice.paymentMethod}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-450">
                        {invoice.dueDate}
                      </td>

                      <td className="p-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase border ${getStatusBadgeStyle(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left">
                          <select
                            value={invoice.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as any;
                              const updated = invoices.map(inv => inv.id === invoice.id ? { ...inv, status: newStatus } : inv);
                              saveInvoicesToStorage(updated);
                            }}
                            className="appearance-none bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-black text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Paid">Paid</option>
                            <option value="Repaid">Repaid</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: PAYMENT METHODS HUB & ADD PAYMENT METHOD */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs" id="add-payment-method-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                {modalStep !== 'hub' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalStep === 'form') {
                        setModalStep('select');
                      } else if (modalStep === 'select') {
                        setModalStep('hub');
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase">
                    {modalStep === 'hub' && 'Payment Methods'}
                    {modalStep === 'select' && 'Choose Payment Method'}
                    {modalStep === 'form' && `Add ${selectedType === 'USDT' ? 'Tether (USDT)' : selectedType}`}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {modalStep === 'hub' && 'Manage how you receive your payments'}
                    {modalStep === 'select' && 'Select your preferred receiving option'}
                    {modalStep === 'form' && 'Provide your payment account details'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {modalStep === 'hub' && savedMethods.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalStep('select')}
                    className="px-3 py-1.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Method</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAddPaymentModal(false);
                    handleResetForm();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* STEP 1: HUB INTERFACE (MATCHES SCREENSHOT 2) */}
              {modalStep === 'hub' && (
                <div className="space-y-4">
                  {savedMethods.length === 0 ? (
                    <div className="p-8 sm:p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                        <CreditCard className="w-7 h-7 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                          No Payment Methods Yet
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                          Add a payment method to start receiving your earnings. We support various options including bank transfer, PayPal, crypto, and more.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setModalStep('select')}
                          className="px-5 py-3 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Add Your First Payment Method</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>ACTIVE PAYMENT ACCOUNTS ({savedMethods.length})</span>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {savedMethods.map((method) => (
                          <div
                            key={method.id}
                            className="p-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between transition hover:border-[#65a30d]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="shrink-0">
                                {method.type === 'bKash' && <BkashLogo />}
                                {method.type === 'Nagad' && <NagadLogo />}
                                {method.type === 'PayPal' && <PaypalLogo />}
                                {method.type === 'USDT' && <UsdtLogo />}
                                {method.type === 'Cash' && <CashLogo />}
                              </div>
                              <div>
                                <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                  <span>{method.name}</span>
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    Verified
                                  </span>
                                </div>
                                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                  {method.details}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteMethod(method.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              title="Delete method"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setModalStep('select')}
                          className="px-4 py-2.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Another Payment Method</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: CHOOSE PAYMENT METHOD (5 SQUARE BOX CARDS) */}
              {modalStep === 'select' && (
                <div className="space-y-4">
                  {/* 100 OTP REQUIREMENT NOTICE BOX */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                            Payment Methods Locked
                          </h4>
                          <p className="text-[10px] font-bold text-amber-700/80 dark:text-amber-400/80">
                            100 OTPs required for admin verification
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                          {otpCount}/100
                        </span>
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 block uppercase">
                          OTPs Completed
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                        Complete <strong className="font-extrabold text-amber-700 dark:text-amber-400">100 OTP tasks</strong> on virtual numbers to unlock these payment methods. Once 100 OTPs are reached, the admin will verify and grant access.
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-amber-200/60 dark:bg-amber-950/80 rounded-full overflow-hidden p-0.5 border border-amber-300/40 dark:border-amber-800/40">
                      <div
                        className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Toast Notification Alert */}
                  {noticeToast && (
                    <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{noticeToast}</span>
                    </div>
                  )}

                  {/* 5 Payment Method Options Grid (Square Box Cards) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {/* 1. bKash (Mobile Banking) */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption('bKash')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition min-h-[135px] relative ${
                        isUnlocked
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-[#65a30d] shadow-2xs hover:shadow-md cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 my-auto">
                        <BkashLogo />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            bKash
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            Mobile Banking
                          </div>
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-amber-500 mt-2">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                            100 OTP Send & Unlock
                          </span>
                        </div>
                      ) : (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Unlocked</span>
                        </div>
                      )}
                    </button>

                    {/* 2. Nagad (Mobile Banking) */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption('Nagad')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition min-h-[135px] relative ${
                        isUnlocked
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-[#65a30d] shadow-2xs hover:shadow-md cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 my-auto">
                        <NagadLogo />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            Nagad
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            Mobile Banking
                          </div>
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-amber-500 mt-2">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                            100 OTP Send & Unlock
                          </span>
                        </div>
                      ) : (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Unlocked</span>
                        </div>
                      )}
                    </button>

                    {/* 3. Tether (USDT) */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption('USDT')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition min-h-[135px] relative ${
                        isUnlocked
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-[#65a30d] shadow-2xs hover:shadow-md cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 my-auto">
                        <UsdtLogo />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            Tether (USDT)
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            Crypto Wallet
                          </div>
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-amber-500 mt-2">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                            100 OTP Send & Unlock
                          </span>
                        </div>
                      ) : (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Unlocked</span>
                        </div>
                      )}
                    </button>

                    {/* 4. PayPal */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption('PayPal')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition min-h-[135px] relative ${
                        isUnlocked
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-[#65a30d] shadow-2xs hover:shadow-md cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 my-auto">
                        <PaypalLogo />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            PayPal
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            Global Account
                          </div>
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-amber-500 mt-2">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                            100 OTP Send & Unlock
                          </span>
                        </div>
                      ) : (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Unlocked</span>
                        </div>
                      )}
                    </button>

                    {/* 5. Cash */}
                    <button
                      type="button"
                      onClick={() => handleSelectOption('Cash')}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition min-h-[135px] relative col-span-2 sm:col-span-1 ${
                        isUnlocked
                          ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-[#65a30d] shadow-2xs hover:shadow-md cursor-pointer'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 my-auto">
                        <CashLogo />
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            Cash
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            Direct Pickup
                          </div>
                        </div>
                      </div>

                      {!isUnlocked ? (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-amber-500 mt-2">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
                            100 OTP Send & Unlock
                          </span>
                        </div>
                      ) : (
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Unlocked</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: FORM DETAILS FOR SELECTED METHOD */}
              {modalStep === 'form' && selectedType && (
                <form onSubmit={handleSavePaymentMethod} className="space-y-4 pt-1">
                  {/* Selected Method Header Banner */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="shrink-0">
                      {selectedType === 'bKash' && <BkashLogo />}
                      {selectedType === 'Nagad' && <NagadLogo />}
                      {selectedType === 'PayPal' && <PaypalLogo />}
                      {selectedType === 'USDT' && <UsdtLogo />}
                      {selectedType === 'Cash' && <CashLogo />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedType === 'USDT' ? 'Tether (USDT)' : selectedType}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-400 leading-tight">
                        Fill in your receiving details below
                      </p>
                    </div>
                  </div>

                  {/* Common Field: Label (Optional) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Label (Optional)
                    </label>
                    <input
                      type="text"
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      placeholder={
                        selectedType === 'PayPal'
                          ? 'e.g., My Main PayPal Account'
                          : selectedType === 'bKash'
                          ? 'e.g., My Personal bKash'
                          : selectedType === 'Nagad'
                          ? 'e.g., My Personal Nagad'
                          : selectedType === 'USDT'
                          ? 'e.g., My Main USDT Wallet'
                          : 'e.g., My Main Cash Account'
                      }
                      className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                    />
                  </div>

                  {/* SPECIFIC FIELDS PER PAYMENT METHOD */}

                  {/* 1. Cash Fields */}
                  {selectedType === 'Cash' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Pickup Location <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          placeholder="e.g. Office Address / Local Branch"
                          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Notes
                        </label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any specific pickup instructions..."
                          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d] resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* 2. PayPal Fields */}
                  {selectedType === 'PayPal' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        PayPal Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="your-paypal-email@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                      />
                    </div>
                  )}

                  {/* 3. Tether USDT Fields */}
                  {selectedType === 'USDT' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          USDT Wallet Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={usdtAddress}
                          onChange={(e) => setUsdtAddress(e.target.value)}
                          placeholder="TRC20 or BEP20 wallet address (e.g., T...)"
                          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Network <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={usdtNetwork}
                          onChange={(e) => setUsdtNetwork(e.target.value)}
                          placeholder="e.g. TRC20, BEP20, ERC20"
                          className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                        />
                      </div>
                    </>
                  )}

                  {/* 4. bKash Fields */}
                  {selectedType === 'bKash' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        bKash Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={bkashNumber}
                        onChange={(e) => setBkashNumber(e.target.value)}
                        placeholder="017XXXXXXXX (Personal bKash Number)"
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                      />
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        যেটিতে বিকাশ একাউন্ট খোলা আছে সেই পার্সোনাল নম্বরটি প্রদান করুন।
                      </span>
                    </div>
                  )}

                  {/* 5. Nagad Fields */}
                  {selectedType === 'Nagad' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nagad Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={nagadNumber}
                        onChange={(e) => setNagadNumber(e.target.value)}
                        placeholder="018XXXXXXXX (Personal Nagad Number)"
                        className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#65a30d]"
                      />
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        যেটিতে নগদ একাউন্ট খোলা আছে সেই পার্সোনাল নম্বরটি প্রদান করুন।
                      </span>
                    </div>
                  )}

                  {/* Set as primary checkbox */}
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="primary-checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="w-4 h-4 text-[#65a30d] border-slate-300 rounded focus:ring-[#65a30d] cursor-pointer"
                    />
                    <label htmlFor="primary-checkbox" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Set as my primary payment method
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalStep('select')}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#65a30d] hover:bg-[#54870a] text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save Payment Method</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
