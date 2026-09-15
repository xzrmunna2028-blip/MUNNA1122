import React, { useState, useEffect } from 'react';
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
  ArrowRight
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

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  token,
  onComplete,
  onGoToLogin,
  darkMode = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPendingSubmitted, setIsPendingSubmitted] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [registeredName, setRegisteredName] = useState<string>('');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 minutes default

  // Step 1: About You
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('1998-05-15');

  // Step 2: Location
  const [country, setCountry] = useState<string>('Bangladesh');
  const [city, setCity] = useState<string>('Khulna');
  const [address, setAddress] = useState<string>('Vill: Paikgacha, Post: Kamilmuni');
  const [timezone, setTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
    } catch {
      return 'Asia/Dhaka';
    }
  });

  // Step 3: Contact
  const [phone, setPhone] = useState<string>('+880 1647-783682');
  const [telegram, setTelegram] = useState<string>('@ruman_traffic');
  const [notificationChannel, setNotificationChannel] = useState<string>('Email (Primary) & Telegram Alerts');

  // Step 4: Security
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [securityPin, setSecurityPin] = useState<string>('1234');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);

  // 1. Verify Token on Mount
  useEffect(() => {
    let timerId: any = null;

    const verifyToken = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/verify-invitation/${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!data.valid) {
          setIsExpired(true);
          setErrorMessage(data.message || 'This invitation link has expired or is invalid.');
          setLoading(false);
          return;
        }

        const inv = data.invitation;
        setInvitation(inv);

        // Pre-fill name parts if available
        const nameParts = (inv.name || '').trim().split(' ');
        if (nameParts.length > 1) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(' '));
        } else if (nameParts.length === 1 && nameParts[0]) {
          setFirstName(nameParts[0]);
          setLastName('');
        }

        // Calculate initial remaining seconds
        const remSec = data.remainingSeconds || Math.max(0, Math.floor((inv.expiresAt - Date.now()) / 1000));
        setSecondsRemaining(remSec);

        if (remSec <= 0) {
          setIsExpired(true);
          setErrorMessage('This invitation link has expired (10-minute validity exceeded).');
        }

        setLoading(false);
      } catch (err: any) {
        // Fallback: check if stored in localStorage
        console.warn('Backend verify check error, using local fallback:', err);
        try {
          const localStr = localStorage.getItem('codeflow_invitations_cache');
          if (localStr) {
            const list = JSON.parse(localStr);
            const found = list.find((i: any) => i.token === token);
            if (found) {
              const now = Date.now();
              if (now > found.expiresAt) {
                setIsExpired(true);
                setErrorMessage('This invitation link has expired after 10 minutes.');
              } else {
                setInvitation(found);
                setSecondsRemaining(Math.floor((found.expiresAt - now) / 1000));
              }
            }
          }
        } catch (e) {}
        setLoading(false);
      }
    };

    verifyToken();

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [token]);

  // Live 10-Minute Countdown Clock
  useEffect(() => {
    if (loading || isExpired) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          setErrorMessage('This invitation link has expired (10-minute validity exceeded).');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, isExpired]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
      const response = await fetch('/api/complete-invitation', {
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
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

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

  // PENDING VERIFICATION SCREEN
  if (isPendingSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#060911] text-white p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900/95 border border-amber-500/40 rounded-3xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
          
          {/* Animated Hourglass / Clock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner relative">
            <Clock className="w-8 h-8 animate-pulse" />
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              STATUS: PENDING
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Registration Complete!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              আপনার সকল তথ্য এবং অ্যাকাউন্ট তৈরির প্রক্রিয়া সফলভাবে সম্পন্ন হয়েছে। আপনার অ্যাকাউন্টটি বর্তমানে <strong className="text-amber-300">Pending (অপেক্ষারত)</strong> অবস্থায় রয়েছে।
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
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-black tracking-wider">
                PENDING APPROVAL
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Next Step:</span>
              <span className="text-slate-300 font-medium">Admin verification</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200/90 text-left leading-relaxed">
            এডমিন আপনার অ্যাকাউন্টটি রিভিউ করে অনুমোদন (Approve) করলে আপনি সরাসরি আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
          </div>

          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
          >
            <span>Go to Login Page</span>
            <ChevronRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16] text-white p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-300">Verifying secure invitation link...</p>
          <p className="text-xs text-slate-500">Checking 10-minute token validity</p>
        </div>
      </div>
    );
  }

  // EXPIRED STATE
  if (isExpired || !invitation) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#060911] text-white p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 text-center space-y-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />
          
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 stroke-[2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              Invitation Link Expired
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {errorMessage || 'For strict security reasons, personalized onboarding links expire exactly 10 minutes after generation.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Target Account:</span>
              <span className="font-mono font-bold text-slate-200">{invitation?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Validity Limit:</span>
              <span className="font-bold text-rose-400">10 Minutes (Elapsed)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 text-[10px] font-extrabold">
                EXPIRED
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Please ask the administrator or support to generate a fresh invitation link for your email address.
          </p>

          <button
            type="button"
            onClick={onGoToLogin}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Return to Sign In</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE 4-STEP ONBOARDING
  const stepTitles = [
    { num: 1, label: 'ABOUT YOU', icon: User },
    { num: 2, label: 'LOCATION', icon: MapPin },
    { num: 3, label: 'CONTACT', icon: Phone },
    { num: 4, label: 'SECURITY', icon: Lock },
  ];

  return (
    <div className="min-h-screen w-full bg-[#060913] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-sans relative overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-lime-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Outer Card Container */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden my-4 z-10">
        
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#65a30d] via-lime-400 to-emerald-500" />

        {/* 10-Minute Expiration Banner */}
        <div className="bg-slate-950/90 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-slate-400 text-[11px] truncate">
              Link exclusive to <strong className="text-slate-200 font-mono">{invitation.email}</strong>
            </span>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-black text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatCountdown(secondsRemaining)}</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="p-6 pb-4 text-center space-y-2 border-b border-slate-800/60">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#65a30d] to-[#4d7c0f] text-white flex items-center justify-center font-black text-lg shadow-md shadow-lime-950">
              T
            </div>
            <h1 className="text-lg font-black text-white tracking-wide">
              Welcome to Traffic Analytics
            </h1>
          </div>
          
          <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
            STEP {currentStep} OF 4 &bull; {stepTitles[currentStep - 1].label} &bull; INVITED BY {invitation.inviter.toUpperCase()}
          </p>

          {/* Stepper Navigation Pills */}
          <div className="grid grid-cols-4 gap-1.5 pt-3">
            {stepTitles.map((step) => {
              const isCompleted = step.num < currentStep;
              const isCurrent = step.num === currentStep;
              return (
                <div
                  key={step.num}
                  className={`py-2 px-1 rounded-xl text-center transition-all ${
                    isCurrent
                      ? 'bg-slate-800 border-b-2 border-lime-400 text-white font-black'
                      : isCompleted
                      ? 'bg-slate-950/60 text-lime-400 font-bold'
                      : 'bg-slate-950/40 text-slate-500 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-lime-400" />
                    ) : (
                      <span>{step.num}.</span>
                    )}
                    <span className="truncate hidden sm:inline">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: A BIT ABOUT YOU */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white">
                A bit about you
              </h2>
              <p className="text-xs text-slate-400">
                We use this on your profile and on the invoices we generate for you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    FIRST NAME <span className="text-lime-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    LAST NAME
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  BIRTH DATE
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Used for age-verification on payouts.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-500">
                &bull; 1 / 4
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#65a30d] to-[#4d7c0f] hover:from-[#54880b] hover:to-[#3f670c] text-white font-black text-xs shadow-lg shadow-lime-950 flex items-center gap-2 cursor-pointer transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onGoToLogin}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Already onboarded? <strong className="text-lime-400 underline">Sign in</strong>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: WHERE YOU ARE */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white">
                Where you are
              </h2>
              <p className="text-xs text-slate-400">
                Your country sets the default currency and matches reports to your timezone.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  COUNTRY
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="Bangladesh">🇧🇩 Bangladesh</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="Pakistan">🇵🇰 Pakistan</option>
                  <option value="Other">🌍 Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  CITY
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Khulna or Dhaka"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  ADDRESS
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Vill / Road, Post Office / Area"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  TIME ZONE
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST / EDT)</option>
                  <option value="Europe/London">Europe/London (GMT / BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Auto-detected from your browser — change if it's wrong. Dashboard timestamps render in this zone.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <span className="text-xs font-mono text-slate-500">
                &bull; 2 / 4
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#65a30d] to-[#4d7c0f] hover:from-[#54880b] hover:to-[#3f670c] text-white font-black text-xs shadow-lg shadow-lime-950 flex items-center gap-2 cursor-pointer transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: HOW WE REACH YOU */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit} className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white">
                How we reach you
              </h2>
              <p className="text-xs text-slate-400">
                Email is verified now — the others stay editable from your profile later.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  PHONE NUMBER <span className="text-lime-400">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1647-783682"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  TELEGRAM
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@your_username"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>EMAIL (FROM YOUR INVITATION)</span>
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </label>
                <input
                  type="email"
                  value={invitation.email}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-emerald-500/30 text-emerald-300 font-mono rounded-xl text-xs font-bold cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-500">
                  Locked to your invitation recipient. Cannot be changed.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  NOTIFICATION CHANNEL
                </label>
                <select
                  value={notificationChannel}
                  onChange={(e) => setNotificationChannel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="Email (Primary) & Telegram Alerts">Email (Primary) & Telegram Alerts</option>
                  <option value="Email Only">Email Only</option>
                  <option value="Telegram Alerts Only">Telegram Alerts Only</option>
                  <option value="In-App Portal Only">In-App Portal Only</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Where alerts, OTPs, and balance updates land.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <span className="text-xs font-mono text-slate-500">
                &bull; 3 / 4
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#65a30d] to-[#4d7c0f] hover:from-[#54880b] hover:to-[#3f670c] text-white font-black text-xs shadow-lg shadow-lime-950 flex items-center gap-2 cursor-pointer transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SET YOUR SECURITY */}
        {currentStep === 4 && (
          <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white">
                Set your security
              </h2>
              <p className="text-xs text-slate-400">
                Create a secure password and quick PIN to protect your account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  CREATE PASSWORD <span className="text-lime-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  CONFIRM PASSWORD <span className="text-lime-400">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your password"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  SECURITY PIN (4 DIGITS)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 rounded-xl text-xs font-mono font-bold text-lime-400 placeholder-slate-500 focus:outline-none tracking-widest"
                />
                <p className="text-[11px] text-slate-500">
                  Used for fast PIN confirmations on API requests and invoice approvals.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded text-lime-500 focus:ring-lime-400 bg-slate-950 border-slate-800"
                  />
                  <span>
                    I agree to the <strong className="text-lime-400">Terms of Service</strong>, <strong className="text-lime-400">Privacy Policy</strong>, and standard IPRN traffic regulations.
                  </span>
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#65a30d] to-[#4d7c0f] hover:from-[#54880b] hover:to-[#3f670c] text-white font-black text-xs shadow-lg shadow-lime-950 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Activating Account...' : 'Complete Setup & Launch Dashboard'}</span>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Footer Info */}
      <div className="text-center space-y-1 text-slate-500 text-xs">
        <p>Traffic Analytics &bull; Secure 10-Minute Invitation Gateway</p>
        <p className="text-[11px]">Protected by End-to-End Encryption & Brevo Relay</p>
      </div>
    </div>
  );
};
