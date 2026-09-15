import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
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
  Copy,
  ShieldCheck,
  Radio,
  Clock,
  Search,
  Upload,
  FileUp,
  Globe,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Info,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Layers,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { ensureDefaultRentedNumbers, getRealSmsLogs, playOtpChime } from '../utils/realtimeSmsService';
import { OtpSessionModal } from './OtpSessionModal.js';
import { RentedNumber, RealSmsLog } from '../types.js';
import { KSI_MASTER_TERMINATIONS } from '../data/ksiMasterRanges.ts';

interface TerminationOption {
  code: string;
  country: string;
  operator: string;
  service?: string;
  rangeName?: string;
  available: string;
  rate: string;
  limit: string;
  label: string;
  numbersPool?: string[];
  poolStats?: {
    total: number;
    used: number;
    available: number;
    outOfStock: boolean;
    lowStock: boolean;
  };
}

// Normalizes raw phone number entries from Excel / CSV / Text to standard E.164
export const normalizePhoneNumber = (
  raw: any,
  cleanDial: string,
  countryName?: string
): { normalized: string | null; error?: string; isHeader?: boolean } => {
  if (raw === null || raw === undefined) return { normalized: null };
  let cleaned = String(raw).trim();
  if (!cleaned) return { normalized: null };

  // Skip table headers
  if (
    /^(phone|number|msisdn|mobile|tel|id|country|range|service|client|user|serial|sl|status|sim|sim_number|contact|phone_number|dial|code)$/i.test(
      cleaned
    )
  ) {
    return { normalized: null, isHeader: true };
  }

  // Handle scientific notation e.g. 9.64780123456E+11 or 9.6478E+11
  if (/^[0-9.]+[eE]\+[0-9]+$/i.test(cleaned)) {
    try {
      cleaned = BigInt(Math.round(Number(cleaned))).toString();
    } catch {
      cleaned = Number(cleaned).toFixed(0);
    }
  }

  // Remove trailing decimal zeroes from Excel (e.g. 9647801234567.0)
  cleaned = cleaned.replace(/\.0+$/, '');

  // Extract digits
  let digits = cleaned.replace(/[^0-9]/g, '');
  if (!digits || digits.length === 0) {
    return { normalized: null, error: 'Contains no numeric phone digits' };
  }

  // If starts with 00 (international 00964...), strip 00
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  const dial = (cleanDial || '').replace(/[^0-9]/g, '');

  if (dial) {
    if (digits.startsWith(dial)) {
      // Already starts with dial code!
    } else if (dial === '964') {
      // Iraq: Mobile prefix 07X (11 digits with 0) or 7X (10 digits without 0)
      if (digits.startsWith('07') && (digits.length === 11 || digits.length === 10)) {
        digits = '964' + digits.substring(1);
      } else if (digits.startsWith('7') && (digits.length === 10 || digits.length === 9)) {
        digits = '964' + digits;
      }
    } else if (dial === '880') {
      // Bangladesh: 01X (11 digits) or 1X (10 digits)
      if (digits.startsWith('01') && digits.length === 11) {
        digits = '880' + digits.substring(1);
      } else if (digits.startsWith('1') && digits.length === 10) {
        digits = '880' + digits;
      }
    } else if (dial === '7') {
      // Russia / Kazakhstan: 87... -> 7...
      if (digits.startsWith('87') && digits.length === 11) {
        digits = '7' + digits.substring(1);
      } else if (digits.startsWith('8') && digits.length === 11) {
        digits = '7' + digits.substring(1);
      }
    } else if (dial === '91') {
      // India: 098... -> 9198...
      if (digits.startsWith('0') && digits.length === 11) {
        digits = '91' + digits.substring(1);
      }
    } else if (dial === '92') {
      // Pakistan: 03... -> 923...
      if (digits.startsWith('0') && digits.length === 11) {
        digits = '92' + digits.substring(1);
      }
    } else if (dial === '234') {
      // Nigeria: 08... -> 2348...
      if (digits.startsWith('0') && digits.length === 11) {
        digits = '234' + digits.substring(1);
      }
    } else if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 12) {
      // General leading 0 strip
      digits = dial + digits.substring(1);
    } else if (!digits.startsWith(dial) && digits.length >= 7 && digits.length <= 11) {
      // Prepend dial code if reasonable national number
      digits = dial + digits;
    }

    // Check if dial code matches now
    if (!digits.startsWith(dial)) {
      return {
        normalized: null,
        error: `Prefix mismatch: Number (${digits}) does not start with +${dial} (${countryName || 'Selected Country'})`
      };
    }
  }

  // Length check (E.164 standard: 7 to 15 digits)
  if (digits.length < 7 || digits.length > 15) {
    return {
      normalized: null,
      error: `Invalid length: Has ${digits.length} digits (expected 7-15 digits)`
    };
  }

  return { normalized: `+${digits}` };
};

const DEFAULT_MASTER_TERMINATIONS: TerminationOption[] = [];

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
          const seen = new Set<string>();
          const uniqueNumbers: RentedNumber[] = [];
          data.numbers.forEach((n: any, idx: number) => {
            const key = n.number || n.id || `NUM-${idx}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueNumbers.push({
                ...n,
                id: n.id || `NUM-${idx}`,
                cost: n.cost || n.rate || '0.0000 USD'
              });
            }
          });
          setRentedNumbers(uniqueNumbers);
          localStorage.setItem('rented_numbers', JSON.stringify(uniqueNumbers));
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
        const seen = new Set<string>();
        const uniqueParsed: RentedNumber[] = [];
        parsed.forEach((n: any, idx: number) => {
          const key = n.number || n.id || `NUM-${idx}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueParsed.push({
              ...n,
              id: n.id || `NUM-${idx}`,
              cost: n.cost || n.rate || '0.0000 USD'
            });
          }
        });
        setRentedNumbers(uniqueParsed);
      } catch (e) {}
    }
  };

  // Live Real-Time SMS & OTP logs state
  const [realSmsLogs, setRealSmsLogs] = useState<RealSmsLog[]>(() => getRealSmsLogs());
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const [copiedNumberId, setCopiedNumberId] = useState<string | null>(null);
  const lastKnownLogIdRef = useRef<string | null>(null);
  const rentedNumbersRef = useRef<RentedNumber[]>([]);

  useEffect(() => {
    rentedNumbersRef.current = rentedNumbers;
  }, [rentedNumbers]);

  const handleCopyNumber = (num: string, id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!num) return;
    navigator.clipboard.writeText(num.trim());
    setCopiedNumberId(id);
    setTimeout(() => {
      setCopiedNumberId(null);
    }, 2000);
  };

  const handleCopyOtp = (code: string, id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!code) return;
    navigator.clipboard.writeText(code.trim());
    setCopiedOtpId(id);
    setTimeout(() => {
      setCopiedOtpId(null);
    }, 2000);
  };

  const normalizePhone = (num?: string): string => {
    if (!num) return '';
    return num.replace(/[^0-9]/g, '');
  };

  // Check if an SMS log belongs to one of this user's currently rented numbers
  const isLogForUserNumbers = (log: RealSmsLog | null | undefined, userNums: RentedNumber[]) => {
    if (!log || !log.number || userNums.length === 0) return false;
    const cleanLogNum = normalizePhone(log.number);
    if (!cleanLogNum) return false;
    return userNums.some((n) => {
      const cleanRented = normalizePhone(n.number);
      return (
        cleanRented === cleanLogNum ||
        (cleanRented.length >= 7 && cleanLogNum.endsWith(cleanRented)) ||
        (cleanLogNum.length >= 7 && cleanRented.endsWith(cleanLogNum))
      );
    });
  };

  const extractOtpCode = (log?: RealSmsLog | null): string => {
    if (!log) return '';
    if (log.otp && log.otp.trim().length > 0) return log.otp.trim();
    if (!log.text) return '';
    const gMatch = log.text.match(/G-(\d{4,8})/i);
    if (gMatch) return gMatch[1];
    const codeMatch = log.text.match(/(?:code|is|pin|verification|otp|code:)[:\s-]*([0-9]{4,8})/i);
    if (codeMatch) return codeMatch[1];
    const digits = log.text.match(/\b([0-9]{4,8})\b/);
    if (digits) return digits[1];
    return '';
  };

  const getLatestOtpForNumber = (numStr?: string): RealSmsLog | null => {
    const clean = normalizePhone(numStr);
    if (!clean) return null;
    return realSmsLogs.find((l) => {
      const logNum = normalizePhone(l.number);
      return logNum === clean || clean.endsWith(logNum) || logNum.endsWith(clean);
    }) || null;
  };

  const getOtpCountForNumber = (numStr?: string): number => {
    const clean = normalizePhone(numStr);
    if (!clean) return 0;
    return realSmsLogs.filter((l) => {
      const logNum = normalizePhone(l.number);
      return logNum === clean || clean.endsWith(logNum) || logNum.endsWith(clean);
    }).length;
  };

  const getServiceStyle = (sid?: string) => {
    const service = (sid || '').toLowerCase();
    if (service.includes('whatsapp')) return { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500', name: 'WhatsApp' };
    if (service.includes('telegram')) return { bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', dot: 'bg-sky-500', name: 'Telegram' };
    if (service.includes('google')) return { bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500', name: 'Google' };
    if (service.includes('tiktok')) return { bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20', dot: 'bg-pink-500', name: 'TikTok' };
    if (service.includes('facebook')) return { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500', name: 'Facebook' };
    if (service.includes('binance') || service.includes('crypto')) return { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500', name: 'Binance' };
    if (service.includes('instagram')) return { bg: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20', dot: 'bg-fuchsia-500', name: 'Instagram' };
    if (service.includes('apple')) return { bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20', dot: 'bg-slate-500', name: 'Apple' };
    return { bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500', name: sid || 'OTP Service' };
  };

  const formatRelativeTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    try {
      const time = new Date(timestamp).getTime();
      if (isNaN(time)) return timestamp;
      const diffSec = Math.floor((Date.now() - time) / 1000);
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return timestamp;
    }
  };

  useEffect(() => {
    fetchNumbersFromApi();
    const handleSync = () => {
      fetchNumbersFromApi();
    };
    const handleSmsUpdate = () => {
      const updatedLogs = getRealSmsLogs();
      if (updatedLogs.length > 0) {
        const topLog = updatedLogs[0];
        if (topLog && topLog.id && topLog.id !== lastKnownLogIdRef.current) {
          lastKnownLogIdRef.current = topLog.id;
          // Only play chime if the incoming OTP belongs to this user's active rented numbers
          if (isLogForUserNumbers(topLog, rentedNumbersRef.current)) {
            playOtpChime();
          }
        }
      }
      setRealSmsLogs(updatedLogs);
    };

    window.addEventListener('rented_numbers_updated', handleSync);
    window.addEventListener('real_sms_updated', handleSmsUpdate);
    
    // Auto-poll live numbers & SMS feed
    const interval = setInterval(() => {
      fetchNumbersFromApi();
      const updated = getRealSmsLogs();
      if (updated.length > 0) {
        const topLog = updated[0];
        if (topLog && topLog.id && topLog.id !== lastKnownLogIdRef.current) {
          lastKnownLogIdRef.current = topLog.id;
          // Only play chime if the incoming OTP belongs to this user's active rented numbers
          if (isLogForUserNumbers(topLog, rentedNumbersRef.current)) {
            playOtpChime();
          }
        }
      }
      setRealSmsLogs(updated);
    }, 3000);

    return () => {
      window.removeEventListener('rented_numbers_updated', handleSync);
      window.removeEventListener('real_sms_updated', handleSmsUpdate);
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
  const [termSearchQuery, setTermSearchQuery] = useState<string>('');
  const [paymentTerm, setPaymentTerm] = useState<string>('default');
  const [numCount, setNumCount] = useState<number>(1);
  const [numInputStr, setNumInputStr] = useState<string>('1');
  const [orderType, setOrderType] = useState<'serial' | 'random'>('serial');

  // Determine if logged in user is Admin (xzrmunna or userRole === 'admin')
  const isAdmin = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const user = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
    const role = (localStorage.getItem('codeflow_user_role') || '').toLowerCase().trim();
    const isAdminUnlocked = localStorage.getItem('admin_unlocked_payment') === 'true';
    return (
      user === 'xzrmunna7788@gmail.com' ||
      user === 'xzrmunna974@gmail.com' ||
      user.includes('admin') ||
      role === 'admin' ||
      role === 'master_admin' ||
      isAdminUnlocked ||
      !user // default to true in preview container if user is blank
    );
  }, []);

  // Custom Termination / Admin Bulk File creation states
  const [adminModalTab, setAdminModalTab] = useState<'rent' | 'upload_pool'>('rent');
  const [poolUploadSuccessData, setPoolUploadSuccessData] = useState<{ count: number; rangeName: string; country: string; service: string } | null>(null);
  const [showAddCustomTermForm, setShowAddCustomTermForm] = useState(false);
  const [adminWizardStep, setAdminWizardStep] = useState<1 | 2 | 3>(1);
  const [customCountry, setCustomCountry] = useState('');
  const [customDialCode, setCustomDialCode] = useState('+880');
  const [customService, setCustomService] = useState('Telegram');
  const [customServiceSearch, setCustomServiceSearch] = useState('');
  const [customRate, setCustomRate] = useState('0.0000 USD');
  const [customOperator, setCustomOperator] = useState('');
  
  // File Upload & Strict Country/Number Inspection Engine state
  const [fileName, setFileName] = useState('');
  const [fileRawText, setFileRawText] = useState('');
  const [parsedValidNumbers, setParsedValidNumbers] = useState<string[]>([]);
  const [parsedRejectedNumbers, setParsedRejectedNumbers] = useState<{ raw: string; reason: string }[]>([]);
  const [showRejectedDetails, setShowRejectedDetails] = useState(false);
  const [isAddingCustomTerm, setIsAddingCustomTerm] = useState(false);
  const [customTermError, setCustomTermError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Popular Countries preset list with flags and dialing codes
  const COUNTRY_PRESETS = [
    { country: 'Bangladesh', flag: '🇧🇩', code: '+880', dial: '880' },
    { country: 'Kazakhstan', flag: '🇰🇿', code: '+7', dial: '7' },
    { country: 'Russia', flag: '🇷🇺', code: '+7', dial: '7' },
    { country: 'United States', flag: '🇺🇸', code: '+1', dial: '1' },
    { country: 'Canada', flag: '🇨🇦', code: '+1', dial: '1' },
    { country: 'United Kingdom', flag: '🇬🇧', code: '+44', dial: '44' },
    { country: 'Algeria', flag: '🇩🇿', code: '+213', dial: '213' },
    { country: 'India', flag: '🇮🇳', code: '+91', dial: '91' },
    { country: 'Indonesia', flag: '🇲🇨', code: '+62', dial: '62' },
    { country: 'Pakistan', flag: '🇵🇰', code: '+92', dial: '92' },
    { country: 'Saudi Arabia', flag: '🇸🇦', code: '+966', dial: '966' },
    { country: 'UAE', flag: '🇦🇪', code: '+971', dial: '971' },
    { country: 'Malaysia', flag: '🇲🇾', code: '+60', dial: '60' },
    { country: 'Vietnam', flag: '🇻🇳', code: '+84', dial: '84' },
    { country: 'Philippines', flag: '🇵🇭', code: '+63', dial: '63' },
    { country: 'Thailand', flag: '🇹🇭', code: '+66', dial: '66' },
    { country: 'Turkey', flag: '🇹🇷', code: '+90', dial: '90' },
    { country: 'Egypt', flag: '🇪🇬', code: '+20', dial: '20' },
    { country: 'Nigeria', flag: '🇳🇬', code: '+234', dial: '234' },
    { country: 'Brazil', flag: '🇧🇷', code: '+55', dial: '55' },
    { country: 'Mexico', flag: '🇲🇽', code: '+52', dial: '52' },
    { country: 'Germany', flag: '🇩🇪', code: '+49', dial: '49' },
    { country: 'France', flag: '🇫🇷', code: '+33', dial: '33' },
    { country: 'Italy', flag: '🇮🇹', code: '+39', dial: '39' },
    { country: 'Spain', flag: '🇪🇸', code: '+34', dial: '34' },
    { country: 'Netherlands', flag: '🇳🇱', code: '+31', dial: '31' },
    { country: 'Ukraine', flag: '🇺🇦', code: '+380', dial: '380' },
    { country: 'Poland', flag: '🇵🇱', code: '+48', dial: '48' },
    { country: 'Uzbekistan', flag: '🇺🇿', code: '+998', dial: '998' },
    { country: 'Azerbaijan', flag: '🇦🇿', code: '+994', dial: '994' },
    { country: 'Armenia', flag: '🇦🇲', code: '+374', dial: '374' },
    { country: 'Georgia', flag: '🇬🇪', code: '+995', dial: '995' },
    { country: 'Cambodia', flag: '🇰🇭', code: '+855', dial: '855' },
    { country: 'Morocco', flag: '🇲🇦', code: '+212', dial: '212' },
    { country: 'South Africa', flag: '🇿🇦', code: '+27', dial: '27' },
    { country: 'Kenya', flag: '🇰🇪', code: '+254', dial: '254' },
    { country: 'Ghana', flag: '🇬🇭', code: '+233', dial: '233' },
    { country: 'Singapore', flag: '🇸🇬', code: '+65', dial: '65' },
    { country: 'Qatar', flag: '🇶🇦', code: '+974', dial: '974' },
    { country: 'Oman', flag: '🇴🇲', code: '+968', dial: '968' },
    { country: 'Kuwait', flag: '🇰🇼', code: '+965', dial: '965' },
    { country: 'Iraq', flag: '🇮🇶', code: '+964', dial: '964' },
    { country: 'Jordan', flag: '🇯🇴', code: '+962', dial: '962' },
    { country: 'Argentina', flag: '🇦🇷', code: '+54', dial: '54' },
    { country: 'Colombia', flag: '🇨🇴', code: '+57', dial: '57' },
    { country: 'Australia', flag: '🇦🇺', code: '+61', dial: '61' },
    { country: 'Japan', flag: '🇯🇵', code: '+81', dial: '81' },
    { country: 'South Korea', flag: '🇰🇷', code: '+82', dial: '82' },
    { country: 'China', flag: '🇨🇳', code: '+86', dial: '86' },
    { country: 'Benin', flag: '🇧🇯', code: '+229', dial: '229' },
    { country: 'Mozambique', flag: '🇲🇿', code: '+258', dial: '258' },
    { country: 'Sri Lanka', flag: '🇱🇰', code: '+94', dial: '94' },
  ];

  // Popular Media & Platform Services list
  const MEDIA_SERVICES = [
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: 'from-sky-500 to-blue-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: 'from-emerald-500 to-green-600' },
    { id: 'imo', name: 'Imo', icon: '📞', color: 'from-blue-500 to-cyan-600' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-pink-500 to-rose-600' },
    { id: 'snapchat', name: 'Snapchat', icon: '👻', color: 'from-amber-400 to-yellow-500' },
    { id: 'facebook', name: 'Facebook', icon: '👤', color: 'from-blue-600 to-indigo-700' },
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'from-purple-600 to-pink-500' },
    { id: 'twitter', name: 'Twitter / X', icon: '🐦', color: 'from-slate-800 to-black' },
    { id: 'line', name: 'Line', icon: '🟢', color: 'from-green-500 to-emerald-600' },
    { id: 'viber', name: 'Viber', icon: '💜', color: 'from-purple-500 to-indigo-600' },
    { id: 'discord', name: 'Discord', icon: '🎮', color: 'from-indigo-500 to-purple-600' },
    { id: 'wechat', name: 'WeChat', icon: '💬', color: 'from-emerald-600 to-green-700' },
    { id: 'signal', name: 'Signal', icon: '🔒', color: 'from-blue-600 to-indigo-600' },
    { id: 'zalo', name: 'Zalo', icon: '🔹', color: 'from-blue-500 to-cyan-600' },
    { id: 'kakaotalk', name: 'KakaoTalk', icon: '🟡', color: 'from-yellow-400 to-amber-500' },
    { id: 'google', name: 'Google / Gmail', icon: '📧', color: 'from-red-500 to-rose-600' },
    { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'from-red-600 to-rose-700' },
    { id: 'amazon', name: 'Amazon', icon: '🛒', color: 'from-amber-500 to-orange-600' },
    { id: 'netflix', name: 'Netflix', icon: '🎬', color: 'from-red-600 to-red-800' },
    { id: 'uber', name: 'Uber', icon: '🚗', color: 'from-slate-700 to-slate-900' },
    { id: 'binance', name: 'Binance', icon: '🪙', color: 'from-amber-400 to-yellow-600' },
    { id: 'paypal', name: 'PayPal', icon: '💳', color: 'from-blue-600 to-indigo-800' },
    { id: 'phone', name: 'Standard Phone / Any Service', icon: '📱', color: 'from-purple-500 to-indigo-600' },
  ];

  // Select Country preset handler
  const handleSelectCountryPreset = (item: { country: string; code: string }) => {
    setCustomCountry(item.country);
    setCustomDialCode(item.code);
  };

  // Pool Stock Tracker & Number Inventory States (Admin)
  const [isPoolTrackerOpen, setIsPoolTrackerOpen] = useState(false);
  const [poolSearchQuery, setPoolSearchQuery] = useState('');
  const [selectedPoolRange, setSelectedPoolRange] = useState<TerminationOption | null>(null);
  
  // Append Numbers to Existing Range States
  const [appendModalRange, setAppendModalRange] = useState<TerminationOption | null>(null);
  const [appendFileName, setAppendFileName] = useState('');
  const [appendFileRawText, setAppendFileRawText] = useState('');
  const [appendParsedValidNumbers, setAppendParsedValidNumbers] = useState<string[]>([]);
  const [appendParsedRejectedNumbers, setAppendParsedRejectedNumbers] = useState<{ raw: string; reason: string }[]>([]);
  const [showAppendRejectedDetails, setShowAppendRejectedDetails] = useState(false);
  const [isAppending, setIsAppending] = useState(false);
  const [appendErrorMsg, setAppendErrorMsg] = useState('');
  const [appendSuccessMsg, setAppendSuccessMsg] = useState('');
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  // Strict Country & Phone Number Inspection Engine
  const processAndInspectNumbers = (rawText: string, countryName: string, dialCodeStr: string) => {
    setFileRawText(rawText);
    if (!rawText || !rawText.trim()) {
      setParsedValidNumbers([]);
      setParsedRejectedNumbers([]);
      return;
    }

    const cleanDial = dialCodeStr.replace(/[^0-9]/g, '');
    const tokens = rawText.split(/[\r\n,;\t]+/);
    const validSet = new Set<string>();
    const rejectedList: { raw: string; reason: string }[] = [];

    tokens.forEach((t) => {
      const res = normalizePhoneNumber(t, cleanDial, countryName);
      if (res.isHeader) return;
      if (res.normalized) {
        validSet.add(res.normalized);
      } else if (res.error) {
        rejectedList.push({ raw: String(t).trim(), reason: res.error });
      }
    });

    setParsedValidNumbers(Array.from(validSet));
    setParsedRejectedNumbers(rejectedList);
  };

  // Handle File Upload event (.xlsx, .xls, .csv, .tsv, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const allRowsText: string[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][];
            jsonData.forEach((row) => {
              if (Array.isArray(row)) {
                row.forEach((cell) => {
                  const cellStr = String(cell || '').trim();
                  if (cellStr) allRowsText.push(cellStr);
                });
              }
            });
          });

          const combinedText = allRowsText.join('\n');
          processAndInspectNumbers(combinedText, customCountry, customDialCode);
        } catch (err: any) {
          console.error('Error parsing Excel file:', err);
          setCustomTermError('Failed to parse Excel file. Please ensure it is a valid spreadsheet.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processAndInspectNumbers(content || '', customCountry, customDialCode);
      };
      reader.readAsText(file);
    }
  };

  // Handle Append Numbers inspection
  const processAppendNumbers = (rawText: string, countryName: string, dialCodeStr: string) => {
    setAppendFileRawText(rawText);
    if (!rawText || !rawText.trim()) {
      setAppendParsedValidNumbers([]);
      setAppendParsedRejectedNumbers([]);
      return;
    }

    const cleanDial = dialCodeStr.replace(/[^0-9]/g, '');
    const tokens = rawText.split(/[\r\n,;\t]+/);
    const validSet = new Set<string>();
    const rejectedList: { raw: string; reason: string }[] = [];

    tokens.forEach((t) => {
      const res = normalizePhoneNumber(t, cleanDial, countryName);
      if (res.isHeader) return;
      if (res.normalized) {
        validSet.add(res.normalized);
      } else if (res.error) {
        rejectedList.push({ raw: String(t).trim(), reason: res.error });
      }
    });

    setAppendParsedValidNumbers(Array.from(validSet));
    setAppendParsedRejectedNumbers(rejectedList);
  };

  const handleAppendFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appendModalRange) return;

    setAppendFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const countryDial = (COUNTRY_PRESETS.find(p => p.country.toLowerCase() === (appendModalRange.country || '').toLowerCase())?.code || '+964');

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const allRowsText: string[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][];
            jsonData.forEach((row) => {
              if (Array.isArray(row)) {
                row.forEach((cell) => {
                  const cellStr = String(cell || '').trim();
                  if (cellStr) allRowsText.push(cellStr);
                });
              }
            });
          });

          const combinedText = allRowsText.join('\n');
          processAppendNumbers(combinedText, appendModalRange.country, countryDial);
        } catch (err: any) {
          setAppendErrorMsg('Failed to parse Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processAppendNumbers(content || '', appendModalRange.country, countryDial);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmAppend = async () => {
    if (!appendModalRange || appendParsedValidNumbers.length === 0) return;
    setIsAppending(true);
    setAppendErrorMsg('');
    setAppendSuccessMsg('');

    try {
      const res = await fetch('/api/append-termination-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rangeCode: appendModalRange.code,
          newNumbers: appendParsedValidNumbers
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAppendSuccessMsg(`Successfully added ${data.addedCount} numbers! Total pool: ${data.totalPool}`);
        await fetchTerminations();
        setTimeout(() => {
          setAppendModalRange(null);
          setAppendFileName('');
          setAppendFileRawText('');
          setAppendParsedValidNumbers([]);
          setAppendParsedRejectedNumbers([]);
          setAppendSuccessMsg('');
        }, 1500);
      } else {
        setAppendErrorMsg(data.message || 'Failed to append numbers.');
      }
    } catch (e: any) {
      setAppendErrorMsg(e.message || 'Network error.');
    } finally {
      setIsAppending(false);
    }
  };

  const handleAddCustomTerminationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCountry.trim()) {
      setCustomTermError('Country Name is required.');
      return;
    }

    if (parsedValidNumbers.length === 0) {
      setCustomTermError(`No valid phone numbers found matching country prefix ${customDialCode} (${customCountry}). Please check your file.`);
      return;
    }

    setIsAddingCustomTerm(true);
    setCustomTermError('');

    const rangeTitle = `${customCountry.trim()} - ${customService.trim()}`;
    try {
      const res = await fetch('/api/add-termination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: customCountry.trim(),
          operator: customService.trim(),
          service: customService.trim(),
          rangeName: rangeTitle,
          rate: customRate.trim() || '0.0000 USD',
          sampleNumber: parsedValidNumbers[0] || '',
          numbersPool: parsedValidNumbers,
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.status === 'success') {
          // Success! Save to localStorage backup as well
          const localCustom = JSON.parse(localStorage.getItem('codeflow_custom_terminations') || '[]');
          localCustom.push(d.termination);
          localStorage.setItem('codeflow_custom_terminations', JSON.stringify(localCustom));

          // Set poolUploadSuccessData for Admin
          setPoolUploadSuccessData({
            count: parsedValidNumbers.length,
            rangeName: rangeTitle,
            country: customCountry.trim(),
            service: customService.trim()
          });

          // Clear fields & reset wizard
          setCustomCountry('');
          setCustomService('Telegram');
          setFileName('');
          setFileRawText('');
          setParsedValidNumbers([]);
          setParsedRejectedNumbers([]);
          setAdminWizardStep(1);

          // Re-fetch terminations
          await fetchTerminations();
        } else {
          setCustomTermError(d.message || 'Failed to add custom range.');
        }
      } else {
        const errJson = await res.json();
        setCustomTermError(errJson.message || 'Server error adding custom range.');
      }
    } catch (err: any) {
      setCustomTermError(err.message || 'Network error adding custom range.');
    } finally {
      setIsAddingCustomTerm(false);
    }
  };

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

  const filteredTerminations = useMemo(() => {
    if (!termSearchQuery.trim()) return terminations;
    const q = termSearchQuery.toLowerCase().trim();
    return terminations.filter(t => 
      (t.country && t.country.toLowerCase().includes(q)) ||
      (t.operator && t.operator.toLowerCase().includes(q)) ||
      (t.label && t.label.toLowerCase().includes(q)) ||
      (t.code && t.code.toLowerCase().includes(q))
    );
  }, [terminations, termSearchQuery]);

  const groupedTerminations: Record<string, TerminationOption[]> = useMemo(() => {
    const groups: Record<string, TerminationOption[]> = {};
    filteredTerminations.forEach(t => {
      const c = t.country || 'Global';
      if (!groups[c]) groups[c] = [];
      groups[c].push(t);
    });
    return groups;
  }, [filteredTerminations]);

  // Fetch real live terminations from API (Only ranges explicitly added by Admin)
  const fetchTerminations = async () => {
    const termMap = new Map<string, TerminationOption>();

    try {
      const res = await fetch('/api/terminations');
      if (res.ok) {
        const data = await res.json();
        if (data.terminations && Array.isArray(data.terminations)) {
          data.terminations.forEach((t: any) => {
            if (t && t.code) termMap.set(t.code, t);
          });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch /api/terminations:', e);
    }

    // Merge custom terminations saved in local storage by admin as backup ONLY if not already in server termMap
    try {
      const localCustom = JSON.parse(localStorage.getItem('codeflow_custom_terminations') || '[]');
      if (Array.isArray(localCustom)) {
        localCustom.forEach((t: any) => {
          if (t && t.code && !termMap.has(t.code)) {
            const pool = Array.isArray(t.numbersPool) ? t.numbersPool : [];
            const total = pool.length;
            termMap.set(t.code, {
              ...t,
              poolStats: {
                total,
                used: 0,
                available: total,
                outOfStock: total === 0,
                lowStock: total > 0 && total <= 5
              }
            });
          }
        });
      }
    } catch (e) {}

    setTerminations(Array.from(termMap.values()));
  };

  useEffect(() => {
    fetchTerminations();
  }, []);

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
    const clamped = Math.min(50, Math.max(1, val));
    setNumCount(clamped);
    setNumInputStr(clamped.toString());
  };

  const handleCustomCountChange = (strVal: string) => {
    setNumInputStr(strVal);
    const parsed = parseInt(strVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setNumCount(Math.min(50, parsed));
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

    // Strictly capped to maximum 50 numbers
    const countToGenerate = Math.min(50, Math.max(1, numCount));
    const currentLoggedUser = (localStorage.getItem('codeflow_user') || 'user_client').toLowerCase().trim();
    let newNumbers: RentedNumber[] = [];

    try {
      const genRes = await fetch('/api/generate-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rangeCode: selectedTerm.code,
          rangeName: (selectedTerm as any).rangeName || selectedTerm.label,
          count: countToGenerate,
          userId: currentLoggedUser
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
        {/* Left Side: Add Number Button & Range Stock Tracker */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#65a30d] hover:bg-[#52850a] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-lime-950/10 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add number</span>
          </button>

          {/* Range Pool Stock Tracker Button (ADMIN) */}
          {isAdmin && (
            <button
              onClick={() => setIsPoolTrackerOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Range Stock Tracker ({terminations.length})</span>
            </button>
          )}
        </div>

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
              {filteredNumbers.map((n, idx) => {
                const latestLog = getLatestOtpForNumber(n.number);
                const otpCode = extractOtpCode(latestLog);
                const otpCount = getOtpCountForNumber(n.number);
                const serviceInfo = getServiceStyle(
                  latestLog?.sid ||
                  (latestLog?.text?.includes('WhatsApp') ? 'WhatsApp' :
                   latestLog?.text?.includes('Google') ? 'Google' :
                   latestLog?.text?.includes('Telegram') ? 'Telegram' :
                   latestLog?.text?.includes('TikTok') ? 'TikTok' :
                   latestLog?.text?.includes('Facebook') ? 'Facebook' : '')
                );

                return (
                  <div
                    key={`${n.id || n.number}-${idx}`}
                    className="p-5 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors relative animate-fade-in group cursor-pointer"
                    onClick={() => {
                      setSessionSelectedNumber(n);
                      setSessionSelectedLog(latestLog);
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
                        {/* Top row: Number with 1-Tap Copy & Term Badge & Action Area */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* 1-Tap Number Copy Button */}
                            <button
                              type="button"
                              onClick={(e) => handleCopyNumber(n.number, n.id, e)}
                              className="group/num inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-lime-500/15 dark:bg-slate-800/80 dark:hover:bg-lime-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-lime-500/40 text-slate-900 dark:text-white hover:text-lime-600 dark:hover:text-lime-400 font-mono font-black text-sm tracking-wide transition-all active:scale-95 cursor-pointer shadow-2xs"
                              title="Click or tap to copy phone number"
                            >
                              <span>{n.number}</span>
                              {copiedNumberId === n.id ? (
                                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-400/50 animate-fade-in">
                                  <Check className="w-3 h-3" />
                                  <span>Copied!</span>
                                </span>
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/num:text-lime-600 dark:group-hover/num:text-lime-400 transition-colors" />
                              )}
                            </button>

                            <span className="text-[10px] font-black bg-lime-100 dark:bg-lime-950/40 text-lime-700 dark:text-lime-400 px-2 py-0.5 rounded select-none">
                              {n.term || '1/1'}
                            </span>

                            {otpCount > 0 && (
                              <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300/80 dark:border-emerald-700/60 flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{otpCount} OTP{otpCount > 1 ? 's' : ''}</span>
                              </span>
                            )}
                          </div>

                          {/* Right Side: LIVE OTP CODE & SERVICE NAME OR LISTENING STATUS */}
                          <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {latestLog && (otpCode || latestLog.text) ? (
                              <div className="flex flex-col items-end gap-1.5">
                                {/* Service Name & Arrival Time */}
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-wide uppercase shadow-2xs ${serviceInfo.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${serviceInfo.dot} animate-ping`} />
                                    {serviceInfo.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                    {formatRelativeTime(latestLog.timestamp)}
                                  </span>
                                </div>

                                {/* Prominent High-Visibility Live OTP Code with Instant 1-Click Copy OTP Button */}
                                {otpCode ? (
                                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm tracking-widest shadow-2xs">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{otpCode}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyOtp(otpCode, n.id, e)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] tracking-wide shadow-xs transition-all active:scale-95 cursor-pointer"
                                      title="Click to copy OTP code"
                                    >
                                      {copiedOtpId === n.id ? (
                                        <>
                                          <Check className="w-3 h-3 text-white" />
                                          <span>Copied OTP!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copy OTP</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                                    {latestLog.text}
                                  </span>
                                )}
                              </div>
                            ) : (
                              /* Standby / Listening status */
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                                  <span>Live Listening</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Waiting for OTP...</span>
                              </div>
                            )}

                            {/* View full message logs modal trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setSessionSelectedNumber(n);
                                setSessionSelectedLog(latestLog);
                                setSessionModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors inline-flex items-center gap-0.5 cursor-pointer mt-0.5"
                              title="View message logs"
                            >
                              <Eye className="w-2.5 h-2.5" />
                              <span>History</span>
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
                            <span className="text-xs font-bold text-lime-600 dark:text-lime-500 font-mono">
                              0.0000 USD
                            </span>
                          </div>
                          <div className="space-y-0.5 text-right">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                              LAST SMS
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {latestLog ? formatRelativeTime(latestLog.timestamp) : (n.lastMessage || 'Never')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                    adminModalTab === 'upload_pool' && isAdmin ? 'bg-indigo-600 shadow-indigo-900/10' : 'bg-[#65a30d] shadow-lime-950/10'
                  }`}>
                    {adminModalTab === 'upload_pool' && isAdmin ? (
                      <FileUp className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-5 h-5 stroke-[3]" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                      {adminModalTab === 'upload_pool' && isAdmin ? 'Upload Numbers to Stock Pool' : 'Rent Numbers'}
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-none mt-1">
                      {adminModalTab === 'upload_pool' && isAdmin
                        ? 'Admin bulk upload numbers directly to the global stock pool for all users.'
                        : 'Select a termination range and specify how many numbers you want to rent.'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setPoolUploadSuccessData(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Admin Mode Switcher Tabs (Visible ONLY for Admins) */}
              {isAdmin && (
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 px-6 pt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminModalTab('rent');
                      setPoolUploadSuccessData(null);
                    }}
                    className={`pb-2.5 px-3.5 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminModalTab === 'rent'
                        ? 'border-[#65a30d] text-[#65a30d]'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Rent Numbers (ইউজার রেন্ট)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminModalTab('upload_pool');
                    }}
                    className={`pb-2.5 px-3.5 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      adminModalTab === 'upload_pool'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload to Stock Pool (স্টক পুলে ফাইল আপলোড)</span>
                  </button>
                </div>
              )}

              {/* Modal Body Container */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Dropdown "Select termination" */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Select termination
                    </label>
                    <span className="text-[10px] font-bold text-lime-600 dark:text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded-md">
                      {terminations.length} Ranges · 86 Countries
                    </span>
                  </div>

                  {/* Fast Search Filter input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={termSearchQuery}
                      onChange={(e) => setTermSearchQuery(e.target.value)}
                      placeholder="Filter country, operator or prefix (e.g. Bangladesh, Vodafone, MTN)..."
                      className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-[#65a30d] focus:border-[#65a30d] transition"
                    />
                    {termSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTermSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={selectedTerminationCode}
                      onChange={(e) => setSelectedTerminationCode(e.target.value)}
                      className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-bold focus:ring-[#65a30d] focus:border-[#65a30d] transition pr-10 cursor-pointer"
                    >
                      <option value="">
                        {terminations.length === 0 ? '-- No active ranges (Admin has not added any numbers yet) --' : '-- Choose a termination --'}
                      </option>
                      {(Object.entries(groupedTerminations) as [string, TerminationOption[]][]).map(([country, items]) => (
                        <optgroup key={country} label={`${country} (${items.length} ${items.length === 1 ? 'range' : 'ranges'})`}>
                          {items.map((t) => {
                            const avail = t.poolStats ? t.poolStats.available : 0;
                            const isOut = t.poolStats ? t.poolStats.outOfStock : false;
                            return (
                              <option key={t.code} value={t.code}>
                                {t.label} {isOut ? ' [🔴 Out of Stock - 0 Available]' : ` [🟢 ${avail} Available]`}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Range Live Stock & Usage Status Box */}
                  {selectedTerm && selectedTerm.poolStats && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Range Pool Stock Health
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          selectedTerm.poolStats.outOfStock
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : selectedTerm.poolStats.lowStock
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {selectedTerm.poolStats.outOfStock
                            ? '🔴 Out of Stock (0 Available)'
                            : selectedTerm.poolStats.lowStock
                            ? `🟡 Low Stock (${selectedTerm.poolStats.available} Available)`
                            : `🟢 In Stock (${selectedTerm.poolStats.available} Available)`}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Numbers</span>
                          <span className="text-xs font-black text-slate-800 dark:text-white">{selectedTerm.poolStats.total}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Used / Rented</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">{selectedTerm.poolStats.used}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Available</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{selectedTerm.poolStats.available}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] leading-normal text-slate-400 dark:text-slate-500 font-medium">
                    {terminations.length === 0
                      ? 'No active ranges available. Admin has not added any numbers for any country yet.'
                      : `Showing ${filteredTerminations.length} of ${terminations.length} active range sources added by Admin across ${Object.keys(groupedTerminations).length} countries.`}
                  </p>

                  {/* Add Custom Range toggler (ADMIN ONLY) */}
                  {isAdmin && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminModalTab('upload_pool');
                          setAdminWizardStep(1);
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1.5 focus:outline-none group cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span>+ Add / Upload new country numbers range to Stock Pool (Admin)</span>
                      </button>
                    </div>
                  )}
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
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          How many numbers?
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          Max: 50
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={numInputStr}
                          onChange={(e) => handleCustomCountChange(e.target.value)}
                          className="w-24 px-4 py-2.5 text-center text-xs font-black border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white rounded-xl focus:ring-[#65a30d] focus:border-[#65a30d]"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[1, 5, 10, 25, 50].map((pill) => (
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
                        You can request up to 50 numbers at a time.
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

      {/* ========================================================================= */}
      {/* RANGE NUMBERS STOCK TRACKER & INVENTORY MODAL (ADMIN)                     */}
      {/* ========================================================================= */}
      {isPoolTrackerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Range Numbers Stock Tracker & Inventory
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track total uploaded numbers, active user rents, and available stock per country range.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPoolTrackerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Inventory Metrics */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
              {(() => {
                let grandTotal = 0;
                let grandUsed = 0;
                let grandAvailable = 0;
                terminations.forEach(t => {
                  if (t.poolStats) {
                    grandTotal += t.poolStats.total;
                    grandUsed += t.poolStats.used;
                    grandAvailable += t.poolStats.available;
                  }
                });

                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total File Numbers
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {grandTotal}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                        Used by Users
                      </span>
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                        {grandUsed}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                        Available Stock
                      </span>
                      <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {grandAvailable}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Filter Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={poolSearchQuery}
                  onChange={(e) => setPoolSearchQuery(e.target.value)}
                  placeholder="Filter by country or range name (e.g. Iraq, Algeria, Telegram)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Ranges List */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              {terminations.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  No custom ranges uploaded yet. Use "Add number" &rarr; "Add manually" to create a range!
                </div>
              ) : (
                terminations
                  .filter(t => {
                    if (!poolSearchQuery.trim()) return true;
                    const q = poolSearchQuery.toLowerCase();
                    return (
                      (t.country && t.country.toLowerCase().includes(q)) ||
                      (t.operator && t.operator.toLowerCase().includes(q)) ||
                      (t.label && t.label.toLowerCase().includes(q))
                    );
                  })
                  .map((t) => {
                    const stats = t.poolStats || { total: 0, used: 0, available: 0, outOfStock: true, lowStock: false };
                    const isExpanded = selectedPoolRange?.code === t.code;

                    return (
                      <div
                        key={t.code}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                              {COUNTRY_PRESETS.find(p => p.country.toLowerCase() === t.country.toLowerCase())?.flag || '🌐'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                  {t.country} &middot; {t.operator}
                                </h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  stats.outOfStock
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : stats.lowStock
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {stats.outOfStock
                                    ? '🔴 Out of Stock (0 Available)'
                                    : stats.lowStock
                                    ? `🟡 Low Stock (${stats.available} Available)`
                                    : `🟢 ${stats.available} Available`}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Rate: {t.rate} &middot; Limit: {t.limit}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAppendModalRange(t);
                                setAppendFileName('');
                                setAppendFileRawText('');
                                setAppendParsedValidNumbers([]);
                                setAppendParsedRejectedNumbers([]);
                                setAppendErrorMsg('');
                                setAppendSuccessMsg('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-indigo-600/20"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add More Numbers</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedPoolRange(isExpanded ? null : t)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              {isExpanded ? 'Hide Pool' : 'Inspect Pool'}
                            </button>
                          </div>
                        </div>

                        {/* Stock progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                            <span>Total Pool: {stats.total} numbers</span>
                            <span>{stats.used} used &middot; {stats.available} available</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                            <div
                              style={{ width: `${stats.total > 0 ? (stats.used / stats.total) * 100 : 0}%` }}
                              className="bg-amber-500 transition-all duration-500"
                              title={`Used: ${stats.used}`}
                            />
                            <div
                              style={{ width: `${stats.total > 0 ? (stats.available / stats.total) * 100 : 0}%` }}
                              className="bg-emerald-500 transition-all duration-500"
                              title={`Available: ${stats.available}`}
                            />
                          </div>
                        </div>

                        {/* Expanded Pool Numbers View */}
                        {isExpanded && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Uploaded Numbers Pool ({t.numbersPool?.length || 0} numbers)
                              </span>
                            </div>
                            <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5 p-1 bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800/60">
                              {t.numbersPool && t.numbersPool.length > 0 ? (
                                t.numbersPool.map((pNum, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300"
                                  >
                                    {pNum}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 text-xs p-2">No pool numbers recorded.</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Live stock automatically syncs when users rent or return numbers.
              </span>
              <button
                onClick={() => setIsPoolTrackerOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPEND MORE NUMBERS TO EXISTING RANGE MODAL                               */}
      {/* ========================================================================= */}
      {appendModalRange && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Add Numbers to {appendModalRange.country} &middot; {appendModalRange.operator}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload an Excel (.xlsx), CSV, or TXT file to increase available stock for this range.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAppendModalRange(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {appendErrorMsg && (
                <div className="p-3 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{appendErrorMsg}</span>
                </div>
              )}

              {appendSuccessMsg && (
                <div className="p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{appendSuccessMsg}</span>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={appendFileInputRef}
                accept=".xlsx,.xls,.csv,.tsv,.txt"
                onChange={handleAppendFileUpload}
                className="hidden"
              />

              {/* Upload Drop Zone */}
              <div
                onClick={() => appendFileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 rounded-2xl bg-white/70 dark:bg-slate-900/70 text-center cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all group"
              >
                <FileSpreadsheet className="w-10 h-10 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  {appendFileName ? `Selected: ${appendFileName}` : 'Click to Upload Excel (.xlsx), CSV or TXT File'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Numbers will be checked against country dial code (e.g. {COUNTRY_PRESETS.find(p => p.country.toLowerCase() === (appendModalRange.country || '').toLowerCase())?.code || '+964'})
                </p>
              </div>

              {/* Paste Textarea Fallback */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Or Paste Additional Numbers Text:
                </label>
                <textarea
                  rows={3}
                  value={appendFileRawText}
                  onChange={(e) => {
                    const countryDial = (COUNTRY_PRESETS.find(p => p.country.toLowerCase() === (appendModalRange.country || '').toLowerCase())?.code || '+964');
                    processAppendNumbers(e.target.value, appendModalRange.country, countryDial);
                  }}
                  placeholder="Paste numbers here..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Verification Report for Append */}
              {(appendParsedValidNumbers.length > 0 || appendParsedRejectedNumbers.length > 0) && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold block uppercase">Ready to Append</span>
                        <span className="text-base font-black">{appendParsedValidNumbers.length}</span>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold block uppercase">Rejected</span>
                        <span className="text-base font-black">{appendParsedRejectedNumbers.length}</span>
                      </div>
                      <XCircle className="w-5 h-5 text-rose-500" />
                    </div>
                  </div>

                  {/* Sample Valid numbers */}
                  {appendParsedValidNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {appendParsedValidNumbers.slice(0, 4).map((num, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {num}
                        </span>
                      ))}
                      {appendParsedValidNumbers.length > 4 && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          +{appendParsedValidNumbers.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rejected details */}
                  {appendParsedRejectedNumbers.length > 0 && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAppendRejectedDetails(!showAppendRejectedDetails)}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{showAppendRejectedDetails ? 'Hide' : 'View'} {appendParsedRejectedNumbers.length} Rejected</span>
                      </button>
                      {showAppendRejectedDetails && (
                        <div className="mt-1 max-h-24 overflow-y-auto space-y-1 p-2 rounded-lg bg-rose-950/20 border border-rose-800/40 text-[10px]">
                          {appendParsedRejectedNumbers.map((r, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-2 text-rose-300">
                              <span className="font-mono font-bold shrink-0">{r.raw}</span>
                              <span className="text-[9px] opacity-80 text-right">{r.reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAppendModalRange(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAppending || appendParsedValidNumbers.length === 0}
                onClick={handleConfirmAppend}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isAppending ? (
                  <span>Appending Numbers...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Append {appendParsedValidNumbers.length} Numbers to Range</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
