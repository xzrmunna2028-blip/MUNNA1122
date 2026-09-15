import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { safeJson, safeFetchJson } from '../utils/safeFetch';
import { 
  User, 
  MapPin, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Calendar,
  Send,
  Globe,
  Bell,
  Mail,
  Shield,
  ArrowRight,
  XCircle,
  Search,
  Check,
  Zap,
  KeyRound,
  ShieldAlert,
  CreditCard,
  Building2,
  Copy
} from 'lucide-react';

interface OnboardingViewProps {
  token: string;
  onComplete: (userEmail: string, userName: string) => void;
  onGoToLogin: () => void;
  darkMode?: boolean;
}

interface InvitationDetails {
  token: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  inviter: string;
  expiresAt: number;
  status: 'active' | 'used' | 'expired';
}

export interface CountryItem {
  name: string;
  code: string;
  flag: string;
  areaCode: string;
  continent: 'Asia' | 'Global';
}

export const ALL_COUNTRIES: CountryItem[] = [
  // Asian Continent (Suggested First)
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩', areaCode: '+880', continent: 'Asia' },
  { name: 'India', code: 'IN', flag: '🇮🇳', areaCode: '+91', continent: 'Asia' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', areaCode: '+92', continent: 'Asia' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', areaCode: '+966', continent: 'Asia' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', areaCode: '+971', continent: 'Asia' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦', areaCode: '+974', continent: 'Asia' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼', areaCode: '+965', continent: 'Asia' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲', areaCode: '+968', continent: 'Asia' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭', areaCode: '+973', continent: 'Asia' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', areaCode: '+60', continent: 'Asia' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', areaCode: '+65', continent: 'Asia' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', areaCode: '+62', continent: 'Asia' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', areaCode: '+66', continent: 'Asia' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', areaCode: '+84', continent: 'Asia' },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵', areaCode: '+977', continent: 'Asia' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰', areaCode: '+94', continent: 'Asia' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', areaCode: '+81', continent: 'Asia' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', areaCode: '+82', continent: 'Asia' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', areaCode: '+63', continent: 'Asia' },
  { name: 'China', code: 'CN', flag: '🇨🇳', areaCode: '+86', continent: 'Asia' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', areaCode: '+90', continent: 'Asia' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶', areaCode: '+964', continent: 'Asia' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴', areaCode: '+962', continent: 'Asia' },

  // Global Continent
  { name: 'United States', code: 'US', flag: '🇺🇸', areaCode: '+1', continent: 'Global' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', areaCode: '+44', continent: 'Global' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', areaCode: '+1', continent: 'Global' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', areaCode: '+61', continent: 'Global' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', areaCode: '+49', continent: 'Global' },
  { name: 'France', code: 'FR', flag: '🇫🇷', areaCode: '+33', continent: 'Global' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', areaCode: '+39', continent: 'Global' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', areaCode: '+34', continent: 'Global' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺', areaCode: '+7', continent: 'Global' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', areaCode: '+55', continent: 'Global' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', areaCode: '+27', continent: 'Global' },
];

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  token,
  onComplete,
  onGoToLogin,
  darkMode = true,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPendingSubmitted, setIsPendingSubmitted] = useState<boolean>(false);
  const [isApprovedSuccess, setIsApprovedSuccess] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registeredName, setRegisteredName] = useState<string>('');

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 minutes default
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  // Step 1: About You (User fills in their own details)
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');

  // Step 2: Location & Interactive Country Search
  const [country, setCountry] = useState<string>('Bangladesh');
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const q = countrySearch.toLowerCase().trim();
    return ALL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.areaCode.includes(q)
    );
  }, [countrySearch]);

  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
    } catch {
      return 'Asia/Dhaka';
    }
  });

  // Step 3: Contact
  const [phone, setPhone] = useState<string>('+880 ');
  const [telegram, setTelegram] = useState<string>('');
  const [notificationChannel, setNotificationChannel] = useState<string>('Email (Primary) & Telegram Alerts');

  // Step 4: Security
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [securityPin, setSecurityPin] = useState<string>('');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Not set', color: 'bg-slate-700' };
    let s = 0;
    if (password.length >= 6) s += 1;
    if (password.length >= 9) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) s += 1;

    switch (s) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Moderate', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-cyan-500' };
      case 4:
        return { score: 100, label: 'Strong & Secure', color: 'bg-emerald-500' };
      default:
        return { score: 15, label: 'Too short', color: 'bg-red-500' };
    }
  }, [password]);

  // Fast Instant Hydration + Token Verification
  useEffect(() => {
    let timerId: any = null;

    const verifyToken = async () => {
      if (!token || !token.trim()) {
        setIsExpired(true);
        setErrorMessage('Invalid invitation token. Please check your link.');
        setLoading(false);
        return;
      }

      const cleanToken = token.trim();
      setIsExpired(false);
      setErrorMessage('');

      // 1. FAST LOCAL HYDRATION for 0ms visual rendering across all browsers
      let hydrated = false;
      try {
        const localStr = localStorage.getItem('codeflow_invitations_cache');
        if (localStr) {
          const list = JSON.parse(localStr);
          const found = list.find((i: any) => i.token && i.token.trim().toLowerCase() === cleanToken.toLowerCase());
          if (found) {
            setInvitation(found);
            const rem = Math.max(10, Math.floor((found.expiresAt - Date.now()) / 1000));
            setSecondsRemaining(rem);
            if (found.name && !firstName) {
              const parts = found.name.split(' ');
              setFirstName(parts[0] || '');
              if (parts.length > 1) setLastName(parts.slice(1).join(' '));
            }
            setIsExpired(false);
            setLoading(false);
            hydrated = true;
          }
        }
      } catch (e) {}

      // 1b. INSTANT URL PARAMETER HYDRATION (Supports ANY new device, mobile data, incognito, or browser)
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const paramsStr = hash.includes('?') ? hash.substring(hash.indexOf('?') + 1) : search;
        const p = new URLSearchParams(paramsStr);
        const urlEmail = p.get('email');
        const urlName = p.get('name');
        const urlRole = p.get('role');
        const urlBal = p.get('bal');
        const urlExp = p.get('exp');

        if (urlEmail && urlEmail.includes('@')) {
          const expMs = urlExp ? parseInt(urlExp, 10) : (Date.now() + 15 * 60 * 1000);
          const now = Date.now();
          if (now < expMs) {
            const urlInv = {
              token: cleanToken,
              email: urlEmail.toLowerCase().trim(),
              name: urlName || urlEmail.split('@')[0],
              role: urlRole || 'User',
              balance: urlBal ? parseFloat(urlBal) : 50.0,
              inviter: 'VoltxSMS Support',
              createdAt: now,
              expiresAt: expMs,
              status: 'active' as const,
            };
            setInvitation(urlInv);
            const rem = Math.max(10, Math.floor((expMs - now) / 1000));
            setSecondsRemaining(rem);
            if (urlInv.name && !firstName) {
              const parts = urlInv.name.split(' ');
              setFirstName(parts[0] || '');
              if (parts.length > 1) setLastName(parts.slice(1).join(' '));
            }
            setIsExpired(false);
            setLoading(false);
            hydrated = true;
          }
        }
      } catch (e) {}

      // 2. PARALLEL SERVER VERIFICATION (Non-blocking fail-safe)
      try {
        const { ok, data } = await safeFetchJson<any>(
          `/api/verify-invitation?token=${encodeURIComponent(cleanToken)}`,
          { method: 'GET' },
          { valid: false }
        );

        if (ok && data?.valid) {
          const inv = data.invitation;
          setInvitation(inv);
          setIsExpired(false);
          setErrorMessage('');

          if (inv.name && !firstName) {
            const parts = inv.name.split(' ');
            setFirstName(parts[0] || '');
            if (parts.length > 1) {
              setLastName(parts.slice(1).join(' '));
            }
          }

          const remSec = data.remainingSeconds || Math.max(0, Math.floor((inv.expiresAt - Date.now()) / 1000));
          setSecondsRemaining(remSec);
          if (remSec <= 0) {
            setIsExpired(true);
            setErrorMessage('LINK EXPIRED');
          }
          setLoading(false);
        } else if (data?.reason === 'already_used') {
          setIsExpired(true);
          setErrorMessage('This invitation link has already been used to create an account.');
          setLoading(false);
        } else if (data?.reason === 'expired') {
          setIsExpired(true);
          setErrorMessage('This invitation link has expired (15-minute validity exceeded).');
          setLoading(false);
        } else {
          // If server didn't find it or was offline, but we have URL or local hydration:
          if (hydrated) {
            setIsExpired(false);
            setLoading(false);
          } else {
            setIsExpired(true);
            setErrorMessage(data?.message || 'Invalid or expired invitation token.');
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.warn('Server verification notice, relied on instant client hydration:', err);
        if (hydrated) {
          setIsExpired(false);
        }
        setLoading(false);
      }
    };

    verifyToken();

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [token]);

  // Live 15-Minute Countdown Clock
  useEffect(() => {
    if (loading || isExpired) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          setErrorMessage('This invitation link has expired (15-minute validity exceeded).');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isExpired]);

  // Poll server & local storage for real-time approval status
  useEffect(() => {
    if (!isPendingSubmitted || !registeredEmail) return;

    const checkApproval = async () => {
      try {
        // 1. Check server API
        const { ok, data } = await safeFetchJson(
          `/api/user-status?email=${encodeURIComponent(registeredEmail)}`,
          { method: 'GET' },
          { success: false, status: 'Pending' }
        );
        if (ok && data?.success && data?.status === 'Active') {
          setIsApprovedSuccess(true);
          return;
        }

        // 2. Fallback check local storage
        const regRaw = localStorage.getItem('codeflow_registered_users');
        const regList = regRaw ? JSON.parse(regRaw) : [];
        if (regList.some((u: any) => u.email.toLowerCase() === registeredEmail.toLowerCase())) {
          setIsApprovedSuccess(true);
          return;
        }

        const adminRaw = localStorage.getItem('codeflow_admin_users_list_v2');
        const adminUsers = adminRaw ? JSON.parse(adminRaw) : [];
        const u = adminUsers.find((item: any) => item.email.toLowerCase() === registeredEmail.toLowerCase());
        if (u && u.status === 'Active') {
          setIsApprovedSuccess(true);
        }
      } catch (e) {
        console.warn('Error checking user approval status:', e);
      }
    };

    checkApproval();
    const interval = setInterval(checkApproval, 2000);
    return () => clearInterval(interval);
  }, [isPendingSubmitted, registeredEmail]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyEmail = () => {
    if (invitation?.email) {
      navigator.clipboard?.writeText(invitation.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  // Step 1 Validation
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMessage('Please enter your First Name.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim() || !city.trim()) {
      setErrorMessage('Please enter your Country and City.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(3);
  };

  // Step 3 Validation
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMessage('Please enter your Phone Number.');
      return;
    }
    setErrorMessage('');
    setCurrentStep(4);
  };

  // Step 4: Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }
    if (!agreedTerms) {
      setErrorMessage('Please agree to the Terms of Service to proceed.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    const assembledFullName = `${firstName.trim()} ${lastName.trim()}`.trim() || invitation?.name || 'User';
    const targetEmail = invitation?.email || '';

    try {
      await safeFetchJson('/api/complete-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          phone,
          telegram,
          country,
          city,
          address,
          timezone,
          pin: securityPin,
        }),
      }, { success: true });

      // Synchronize with admin pending activations queue so Admin can approve
      const pendingRecord = {
        id: `PEND-${Math.floor(100 + Math.random() * 900)}`,
        name: assembledFullName,
        email: targetEmail.toLowerCase(),
        pass: password,
        role: invitation?.role || 'User',
        balance: invitation?.balance || 50.0,
        status: 'Pending',
        assignedNumbers: 0,
        ipAddress: '103.114.98.24',
        location: `${city}, ${country}`,
        device: 'Chrome / Desktop',
        isOnline: false,
        lastActive: 'Just registered (Pending Approval)',
        activatedAt: new Date().toISOString(),
        customNotifications: [],
      };

      // 1. Add to pending activations list
      try {
        const pendingRaw = localStorage.getItem('codeflow_pending_activations');
        const pendingList = pendingRaw ? JSON.parse(pendingRaw) : [];
        const filteredPending = pendingList.filter((u: any) => u.email.toLowerCase() !== targetEmail.toLowerCase());
        filteredPending.unshift(pendingRecord);
        localStorage.setItem('codeflow_pending_activations', JSON.stringify(filteredPending));
      } catch (e) {}

      // 2. Also record in admin users list with status 'Pending'
      try {
        const adminUsersRaw = localStorage.getItem('codeflow_admin_users_list_v2');
        const adminUsers = adminUsersRaw ? JSON.parse(adminUsersRaw) : [];
        const filteredAdminUsers = adminUsers.filter((u: any) => u.email.toLowerCase() !== targetEmail.toLowerCase());
        filteredAdminUsers.unshift(pendingRecord);
        localStorage.setItem('codeflow_admin_users_list_v2', JSON.stringify(filteredAdminUsers));
      } catch (e) {}

      // Inform user that registration is complete and now in Pending state
      setRegisteredEmail(targetEmail);
      setRegisteredName(assembledFullName);
      setIsPendingSubmitted(true);
      setIsSubmitting(false);
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Error completing account setup. Please try again.');
      setIsSubmitting(false);
    }
  };

  // PENDING & APPROVED VERIFICATION SCREEN
  if (isPendingSubmitted) {
    if (isApprovedSuccess) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] text-white p-4 sm:p-6 font-sans relative overflow-hidden">
          {/* Animated Glow Orbs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-md w-full bg-[#0b1329]/95 border border-emerald-500/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-2xl relative overflow-hidden z-10"
          >
            {/* Rainbow Glowing Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 shadow-sm" />
            
            {/* Real Logo */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/90 p-1 border border-emerald-500/40 shadow-xl flex items-center justify-center mb-3 group hover:scale-105 transition-transform duration-300">
                <img
                  src="/code_flow_logo.jpg"
                  alt="Code Flow Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
                Code Flow <span className="text-emerald-400 font-extrabold">SMS</span>
              </h1>
            </div>

            {/* Animated Celebration Icon */}
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50 relative">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                STATUS: APPROVED & ACTIVATED
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Account Approved! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-emerald-300 font-semibold leading-relaxed">
                অভিনন্দন! এডমিন আপনার অ্যাকাউন্টটি সফলভাবে অনুমোদন ও সক্রিয় করেছেন।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left text-xs space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-slate-400">
                <span>Account Name:</span>
                <span className="font-bold text-white">{registeredName || invitation?.name || 'User'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Email:</span>
                <span className="font-mono font-bold text-cyan-300">{registeredEmail || invitation?.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Account Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-black tracking-wider">
                  ACTIVE
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#65a30d] to-[#4d7c0f] hover:from-[#54880b] hover:to-[#3f670c] text-white font-black text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-lime-950/80 active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>লগইন প্যানেলে প্রবেশ করুন (Sign In Now)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] text-white p-4 sm:p-6 font-sans relative overflow-hidden">
        {/* Animated Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-md w-full bg-[#0b1329]/95 border border-amber-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl shadow-amber-950/30 backdrop-blur-2xl relative overflow-hidden z-10"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shadow-sm" />
          
          {/* Real Logo */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-xl flex items-center justify-center mb-2">
              <img
                src="/code_flow_logo.jpg"
                alt="Code Flow Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
              Code Flow <span className="text-amber-400 font-extrabold">SMS</span>
            </h1>
          </div>

          {/* Animated Hourglass / Clock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner relative">
            <Clock className="w-8 h-8 animate-pulse" />
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              STATUS: PENDING APPROVAL
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Registration Submitted!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনার সকল তথ্য এবং অ্যাকাউন্ট তৈরির প্রক্রিয়া সফলভাবে সম্পন্ন হয়েছে। আপনার অ্যাকাউন্টটি বর্তমানে <strong className="text-amber-300">Pending (অনুমোদনের অপেক্ষায়)</strong> রয়েছে।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Account Name:</span>
              <span className="font-bold text-white">{registeredName || invitation?.name || 'New User'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Email:</span>
              <span className="font-mono font-bold text-cyan-300">{registeredEmail || invitation?.email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Approval Status:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-black tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" />
                <span>WAITING FOR ADMIN</span>
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200/90 text-left leading-relaxed">
            এডমিন আপনার অ্যাকাউন্টটি অনুমোদন (Approve) করার সাথে সাথে এই স্ক্রিনটি স্বয়ংক্রিয়ভাবে সক্রিয় হয়ে যাবে।
          </div>

          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Return to Sign In</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Loading Screen with Sleek Spinner
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] text-white p-4 font-sans relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="text-center space-y-4 max-w-sm w-full p-8 bg-[#0b1329]/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-2xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1 border border-slate-800 shadow-xl flex items-center justify-center mx-auto mb-2">
            <img
              src="/code_flow_logo.jpg"
              alt="Code Flow Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-200">Verifying VIP Invitation Link...</p>
          <p className="text-xs text-slate-400 font-mono">Instant Token Authorization</p>
        </div>
      </div>
    );
  }

  // EXPIRED STATE - Clean Full-Screen Design
  if (isExpired || !invitation) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#030712] text-white p-6 font-sans relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px]" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0b1329]/95 border border-red-500/30 rounded-3xl p-8 text-center space-y-6 z-10 shadow-2xl backdrop-blur-2xl"
        >
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-slate-900 p-1 border border-slate-800 shadow-xl flex items-center justify-center mx-auto mb-1">
            <img
              src="/code_flow_logo.jpg"
              alt="Code Flow Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto shadow-2xl border border-red-500/30">
            <XCircle className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              LINK EXPIRED
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              This personalized invitation link has expired or has already been used. Please request a fresh invitation link from your administrator.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToLogin}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:text-white"
            >
              <span>Return to Sign In</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ACTIVE 4-STEP ONBOARDING
  const stepTitles = [
    { num: 1, label: 'Profile', subtitle: 'Personal Details', icon: User },
    { num: 2, label: 'Location', subtitle: 'Region & Timezone', icon: MapPin },
    { num: 3, label: 'Contact', subtitle: 'Phone & Telegram', icon: Phone },
    { num: 4, label: 'Security', subtitle: 'Password & PIN', icon: Lock },
  ];

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-sans relative overflow-x-hidden">
      
      {/* Background Ambience Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Main Form Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-xl bg-[#0b1329]/95 border border-slate-800/90 rounded-3xl shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl relative overflow-hidden my-4 z-10"
      >
        
        {/* Animated Progress Bar */}
        <div className="w-full h-1 bg-slate-900 relative overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 shadow-sm"
            initial={{ width: '25%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          />
        </div>

        {/* Brand Header */}
        <div className="p-5 sm:p-6 pb-4 text-center space-y-3.5 border-b border-slate-800/80">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-xl flex items-center justify-center mb-2 transform hover:scale-105 transition-transform duration-300">
              <img
                src="/code_flow_logo.jpg"
                alt="Code Flow Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5 justify-center">
              Code Flow <span className="text-cyan-400 font-extrabold">SMS</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
              VIP CLIENT REGISTRATION PORTAL
            </p>
          </div>

          {/* Invitation Info Pill Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-slate-400 font-medium">Invited:</span>
              <span className="font-mono font-bold text-emerald-300 truncate max-w-[150px] sm:max-w-[200px]">
                {invitation.email}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                title="Copy Email"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/90 border border-cyan-700/60 text-[10px] font-black text-cyan-300 shadow-sm">
                ${invitation.balance?.toFixed(2) || '50.00'} BONUS
              </span>

              {/* Real-time Countdown Timer */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-300 font-mono text-[11px] font-black shadow-sm">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{formatCountdown(secondsRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Stepper Navigation Pills */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {stepTitles.map((step) => {
              const isCompleted = step.num < currentStep;
              const isCurrent = step.num === currentStep;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all duration-200 ${
                    isCurrent
                      ? 'bg-slate-800/90 border border-cyan-500/50 text-white font-black shadow-lg shadow-cyan-950/40'
                      : isCompleted
                      ? 'bg-slate-950/70 text-emerald-400 font-bold border border-emerald-900/40'
                      : 'bg-slate-950/40 text-slate-500 font-medium'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1 text-[11px]">
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <StepIcon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                      )}
                      <span className="font-bold truncate">{step.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Dynamic Multi-Step Body with Motion Transitions */}
        <AnimatePresence mode="wait">
          {/* STEP 1: A BIT ABOUT YOU */}
          {currentStep === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep1Submit}
              className="p-5 sm:p-6 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  <span>Step 1: Account Information</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Please enter your name details to personalize your Code Flow SMS account.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      FIRST NAME <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      LAST NAME <span className="text-cyan-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    DATE OF BIRTH (OPTIONAL)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Invited Email (Readonly Verified) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>AUTHORIZED VIP EMAIL ADDRESS</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Token</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={invitation.email}
                      disabled
                      readOnly
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/60 border border-emerald-500/40 text-emerald-300 font-mono rounded-xl text-xs font-bold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-500">
                  Step 1 of 4
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition active:scale-[0.98]"
                >
                  <span>Continue to Location</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Already have an account? <strong className="text-cyan-400 underline">Sign in</strong>
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 2: WHERE YOU ARE */}
          {currentStep === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep2Submit}
              className="p-5 sm:p-6 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span>Step 2: Location & Region</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select your country and regional settings for optimized IPRN route delivery.
                </p>
              </div>

              <div className="space-y-4">
                {/* Interactive Searchable Country Selector */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>SELECT COUNTRY / REGION <span className="text-cyan-400">*</span></span>
                    <span className="text-[10px] text-cyan-400 font-medium">Asia Continent Suggested</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs font-semibold text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const found = ALL_COUNTRIES.find((c) => c.name.toLowerCase() === country.toLowerCase());
                        return found ? (
                          <>
                            <span className="text-base">{found.flag}</span>
                            <span>{found.name} ({found.areaCode})</span>
                          </>
                        ) : (
                          <span>{country}</span>
                        );
                      })()}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isCountryDropdownOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 flex flex-col animate-fade-in">
                      <div className="p-2 border-b border-slate-800/80 sticky top-0 bg-slate-900 z-10">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country or dial code (e.g. Bangladesh, India, +91)..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-800/40">
                        {filteredCountries.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No country matched "{countrySearch}"
                          </div>
                        ) : (
                          <>
                            {filteredCountries.some(c => c.continent === 'Asia') && (
                              <div className="pt-1 pb-1">
                                <div className="px-2 py-1 text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                                  🌏 Asia Continent (Suggested)
                                </div>
                                {filteredCountries.filter(c => c.continent === 'Asia').map((c) => {
                                  const isSel = country.toLowerCase() === c.name.toLowerCase();
                                  return (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setCountry(c.name);
                                        setPhone(`${c.areaCode} `);
                                        setIsCountryDropdownOpen(false);
                                        setCountrySearch('');
                                      }}
                                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                                        isSel ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30' : 'hover:bg-slate-800 text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">{c.flag}</span>
                                        <span>{c.name}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{c.areaCode}</span>
                                      </div>
                                      {isSel && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {filteredCountries.some(c => c.continent === 'Global') && (
                              <div className="pt-2 pb-1">
                                <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                  🌐 Global Countries
                                </div>
                                {filteredCountries.filter(c => c.continent === 'Global').map((c) => {
                                  const isSel = country.toLowerCase() === c.name.toLowerCase();
                                  return (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setCountry(c.name);
                                        setPhone(`${c.areaCode} `);
                                        setIsCountryDropdownOpen(false);
                                        setCountrySearch('');
                                      }}
                                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                                        isSel ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30' : 'hover:bg-slate-800 text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">{c.flag}</span>
                                        <span>{c.name}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{c.areaCode}</span>
                                      </div>
                                      {isSel && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    CITY <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter your city (e.g. Dhaka, Chittagong, Sylhet)"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    ADDRESS (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your street / area address"
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    TIME ZONE
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="America/New_York">America/New_York (EST / EDT)</option>
                      <option value="Europe/London">Europe/London (GMT / BST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT +8)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <span className="text-xs font-mono text-slate-500">
                  Step 2 of 4
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition active:scale-[0.98]"
                >
                  <span>Continue to Contact</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: CONTACT & ALERTS */}
          {currentStep === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep3Submit}
              className="p-5 sm:p-6 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <span>Step 3: Contact & Alerts</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Provide your WhatsApp/Phone and Telegram for instant OTP reports and live alert notifications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    PHONE / WHATSAPP NUMBER <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1647-783682"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    TELEGRAM HANDLE (OPTIONAL)
                  </label>
                  <div className="relative">
                    <Send className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="@your_telegram_handle"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    PREFERRED NOTIFICATION CHANNEL
                  </label>
                  <div className="relative">
                    <Bell className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={notificationChannel}
                      onChange={(e) => setNotificationChannel(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Email (Primary) & Telegram Alerts">Email (Primary) & Telegram Alerts</option>
                      <option value="Email Only">Email Only</option>
                      <option value="Telegram Alerts Only">Telegram Alerts Only</option>
                      <option value="In-App Portal Only">In-App Portal Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <span className="text-xs font-mono text-slate-500">
                  Step 3 of 4
                </span>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition active:scale-[0.98]"
                >
                  <span>Continue to Security</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 4: SET YOUR SECURITY */}
          {currentStep === 4 && (
            <motion.form
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleFinalSubmit}
              className="p-5 sm:p-6 space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <span>Step 4: Security & Authentication</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Create a strong account password and an optional 4-digit security PIN.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      CREATE PASSWORD <span className="text-cyan-400">*</span>
                    </label>
                    <span className={`text-[10px] font-bold ${passwordStrength.score >= 75 ? 'text-emerald-400' : passwordStrength.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    CONFIRM PASSWORD <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type your password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>SECURITY PIN (4 DIGITS)</span>
                    <span className="text-[10px] text-slate-400">For Fast Verification</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={4}
                      value={securityPin}
                      onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:outline-none tracking-widest"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-950 border-slate-800"
                    />
                    <span>
                      I agree to the <strong className="text-cyan-400">Terms of Service</strong>, <strong className="text-cyan-400">Privacy Policy</strong>, and standard IPRN telecommunication policies.
                    </span>
                  </label>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-[0.98]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950 flex items-center gap-2 cursor-pointer transition disabled:opacity-50 active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration'}</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

      </motion.div>

      {/* Footer Info */}
      <div className="text-center space-y-1 text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} Code Flow SMS Platform. All rights reserved.</p>
      </div>
    </div>
  );
};
