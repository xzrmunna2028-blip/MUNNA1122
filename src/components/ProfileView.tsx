import React, { useState, useEffect } from 'react';
import { getUserDisplayName } from '../utils/userProfileHelper';
import { 
  User, 
  CreditCard, 
  ShieldCheck, 
  ChevronRight, 
  Mail, 
  Phone, 
  Key, 
  Bell, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Headphones,
  RefreshCw,
  Sparkles,
  Shield,
  BadgeCheck,
  Send,
  ExternalLink
} from 'lucide-react';

interface ProfileViewProps {
  onNavigate?: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  // Current Logged-in User Detection
  const loggedUserEmail = localStorage.getItem('codeflow_user') || 'xzrmunna7788@gmail.com';
  const isAdmin = 
    loggedUserEmail.toLowerCase() === 'xzrmunna7788@gmail.com' || 
    loggedUserEmail.toLowerCase() === 'xzrmunna974@gmail.com' ||
    loggedUserEmail.toLowerCase() === 'xzrmunna7788' ||
    localStorage.getItem('user_role') === 'admin';

  // 2FA status from local storage
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ksi_2fa_enabled') === 'true';
  });

  // Check if API access is approved for this user
  // (Admin is always unlocked; regular users are locked unless specifically unlocked in storage)
  const [isApiUnlocked, setIsApiUnlocked] = useState<boolean>(() => {
    if (isAdmin) return true;
    const explicitUnlock = localStorage.getItem(`ksi_api_unlocked_${loggedUserEmail.toLowerCase()}`);
    if (explicitUnlock === 'true') return true;
    
    // Check if key exists in admin keys list with Active status
    const savedKeys = localStorage.getItem('codeflow_admin_apikeys');
    if (savedKeys) {
      try {
        const list = JSON.parse(savedKeys);
        const userKey = list.find((k: any) => k.user?.toLowerCase() === loggedUserEmail.toLowerCase() && k.status === 'Active');
        if (userKey) return true;
      } catch (e) {}
    }
    return false; // Default: LOCKED for regular users
  });

  // API Key States
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedApiKey, setCopiedApiKey] = useState<boolean>(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [keyAlertMsg, setKeyAlertMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKeys = localStorage.getItem('codeflow_admin_apikeys');
    if (savedKeys) {
      try {
        const list = JSON.parse(savedKeys);
        const userKey = list.find((k: any) => 
          k.user?.toLowerCase() === loggedUserEmail.toLowerCase() ||
          k.user?.toLowerCase() === 'xzrmunna974@gmail.com' || 
          k.user?.toLowerCase() === 'xzrmunna7788@gmail.com'
        );
        if (userKey) return userKey.key;
      } catch (e) {}
    }
    return 'sk_live_7B3KOCo2dfr8yvPsAI345HYeuPGBsCIzkpy3dz2Z';
  });

  useEffect(() => {
    const handleStorage = () => {
      const savedKeys = localStorage.getItem('codeflow_admin_apikeys');
      if (savedKeys) {
        try {
          const list = JSON.parse(savedKeys);
          const userKey = list.find((k: any) => k.user?.toLowerCase() === loggedUserEmail.toLowerCase());
          if (userKey) {
            setApiKey(userKey.key);
            setIsApiUnlocked(true);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loggedUserEmail]);

  const handleCopyApiKey = () => {
    if (!isApiUnlocked) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  // Generate / Regenerate New Secure API Key
  const handleGenerateNewApiKey = () => {
    if (!isApiUnlocked) return;
    setIsGeneratingKey(true);

    setTimeout(() => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let randomString = '';
      for (let i = 0; i < 38; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const newKey = `sk_live_${randomString}`;
      setApiKey(newKey);
      setShowApiKey(true);

      // Save to admin api keys registry
      try {
        const saved = localStorage.getItem('codeflow_admin_apikeys');
        let list: any[] = saved ? JSON.parse(saved) : [];
        const existingIdx = list.findIndex((k: any) => k.user?.toLowerCase() === loggedUserEmail.toLowerCase());
        if (existingIdx >= 0) {
          list[existingIdx].key = newKey;
          list[existingIdx].created = new Date().toISOString().split('T')[0];
        } else {
          list.push({
            id: `KEY-${Date.now().toString().slice(-4)}`,
            name: 'Client Active REST Key',
            key: newKey,
            user: loggedUserEmail,
            rateLimit: '2000 req/min',
            created: new Date().toISOString().split('T')[0],
            status: 'Active',
          });
        }
        localStorage.setItem('codeflow_admin_apikeys', JSON.stringify(list));
      } catch (e) {}

      setIsGeneratingKey(false);
      setKeyAlertMsg({
        type: 'success',
        text: 'New API Key generated successfully! Your previous API key has been revoked.'
      });
      setTimeout(() => setKeyAlertMsg(null), 5000);
    }, 600);
  };

  // Profile Form States
  const [username, setUsername] = useState(() => {
    return getUserDisplayName(loggedUserEmail);
  });
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState(loggedUserEmail);
  const [phone, setPhone] = useState('+8801647783682');
  const [address, setAddress] = useState('Your full address');
  const [city, setCity] = useState('New York');
  const [stateProv, setStateProv] = useState('NY');
  const [postalCode, setPostalCode] = useState('10001');
  const [country, setCountry] = useState('Bangladesh');
  const [timezone, setTimezone] = useState('UTC');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification Preference Toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [prefSavedMsg, setPrefSavedMsg] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = localStorage.getItem('codeflow_user') || 'xzrmunna7788@gmail.com';
      setEmail(currentUser);
      setIs2FAEnabled(localStorage.getItem('ksi_2fa_enabled') === 'true');
      setUsername(getUserDisplayName(currentUser));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('codeflow_user_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('codeflow_user_updated', handleStorageChange);
    };
  }, [loggedUserEmail]);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  const handleSavePreferences = () => {
    setPrefSavedMsg(true);
    setTimeout(() => setPrefSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs with Right-Aligned Support Shortcut */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <span>Dashboard</span>
          <span>&gt;</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">My Profile</span>
        </div>

        {/* Right-aligned Manager Quick Contact */}
        <div className="flex items-center gap-1.5">
          <a
            href="https://t.me/super_x_sms_support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] dark:text-[#38a5e1] text-xs font-bold transition shadow-2xs"
            title="Open Telegram Support (@super_x_sms_support)"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.55 3.93-1.64 4.74-1.93 5.27-1.94.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/>
            </svg>
            <span className="hidden sm:inline">Telegram</span>
          </a>

          <a
            href="https://teams.microsoft.com/l/chat/0/0?users=codeflowsupport%40gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00aff0]/10 hover:bg-[#00aff0]/20 border border-[#00aff0]/30 text-[#00aff0] dark:text-[#33c2ff] text-xs font-bold transition shadow-2xs"
            title="Open Teams Account (codeflowsupport@gmail.com)"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.257.234 2.46.662 3.568A9.99 9.99 0 0 0 2 19c0 .552.448 1 1 1a9.99 9.99 0 0 0 3.432-.662C7.54 19.766 8.743 20 10.001 20c5.522 0 10-4.478 10-10 0-1.257-.234-2.46-.662-3.568A9.99 9.99 0 0 0 20 5c0-.552-.448-1-1-1a9.99 9.99 0 0 0-3.432.662C14.46 4.234 13.257 4 12.001 2zm3.328 12.637c-.637.795-1.637 1.264-2.887 1.346-1.428.093-2.618-.328-3.447-1.222-.507-.547-.795-1.25-.83-2.032a.75.75 0 0 1 .746-.782h1.562a.75.75 0 0 1 .744.665c.08.718.59 1.157 1.364 1.157.653 0 1.187-.315 1.187-.805 0-.414-.372-.647-1.127-.866l-1.156-.335c-1.61-.468-2.39-1.29-2.39-2.523 0-1.275.98-2.296 2.532-2.492 1.314-.166 2.457.26 3.193 1.05.474.508.736 1.152.756 1.86a.75.75 0 0 1-.749.771h-1.572a.75.75 0 0 1-.745-.678c-.067-.577-.478-.934-1.115-.934-.582 0-1.047.284-1.047.727 0 .393.35.592 1.054.795l1.096.317c1.782.518 2.593 1.353 2.593 2.627 0 1.272-.924 2.378-2.563 2.592z"/>
            </svg>
            <span className="hidden sm:inline">Skype</span>
          </a>
        </div>
      </div>

      {/* 1. Enhanced Header Banner Card with Agent Account Badge */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        <div className="bg-gradient-to-b from-[#65a30d] to-[#4d7c0f] p-8 sm:p-10 flex flex-col items-center justify-center text-center text-white space-y-4 relative overflow-hidden">
          {/* Subtle background glow accents */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-lime-300/20 rounded-full blur-2xl pointer-events-none" />

          {/* User Avatar with sleek border & verified badge */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 backdrop-blur-md border-4 border-white/30 flex items-center justify-center shadow-xl shadow-black/10 group-hover:scale-105 transition-transform duration-300">
              <User className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-lime-400 text-slate-950 shadow-md border-2 border-[#4d7c0f]">
              <BadgeCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* User Name & Email */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-white drop-shadow-xs">
              {username}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-lime-100">
              {email}
            </p>
          </div>

          {/* Dedicated Agent Account Identifier & 2FA Pill */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {/* AGENT ACCOUNT BADGE */}
            <div 
              id="agent-account-badge"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-950/40 border border-white/25 text-white shadow-sm backdrop-blur-md"
            >
              <Shield className="w-3.5 h-3.5 text-lime-300 stroke-[2.5]" />
              <span className="text-xs font-black tracking-wide text-white">Agent Account</span>
            </div>

            {/* 2FA Status Badge */}
            <button
              onClick={() => onNavigate?.('security')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold shadow-sm transition cursor-pointer backdrop-blur-md ${
                is2FAEnabled 
                  ? 'bg-emerald-950/50 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-900/60' 
                  : 'bg-black/30 text-lime-100 border border-white/20 hover:bg-black/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full animate-pulse ${is2FAEnabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[11px] font-bold">
                {is2FAEnabled ? '2FA Active' : '! 2FA Off'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 text-center border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <span>Member since September 2026</span>
          <span>&middot;</span>
          <span className="text-[#65a30d] dark:text-lime-400 font-bold">Verified Agent Portal</span>
        </div>
      </div>

      {/* 2. Compact Manager & Support Channels (Docked / Side-aligned Pill Buttons) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Manager & Support</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-lime-100 dark:bg-lime-950 text-[#65a30d] dark:text-lime-400 border border-lime-300 dark:border-lime-800/80 uppercase">
                  24/7
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                One-tap direct contact for API access and portal support
              </p>
            </div>
          </div>

          {/* Compact Button Group */}
          <div className="flex items-center gap-2 sm:self-center flex-wrap">
            {/* Telegram Support Button */}
            <a
              href="https://t.me/super_x_sms_support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              title="Contact Telegram Support (@super_x_sms_support)"
            >
              {/* Official Telegram Plane Icon */}
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.55 3.93-1.64 4.74-1.93 5.27-1.94.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/>
              </svg>
              <span>Telegram</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            {/* Skype / Teams Manager Button */}
            <a
              href="https://teams.microsoft.com/l/chat/0/0?users=codeflowsupport%40gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00aff0] hover:bg-[#009fdc] active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              title="Contact Manager on Teams (codeflowsupport@gmail.com)"
            >
              {/* Official Skype 'S' Icon */}
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.257.234 2.46.662 3.568A9.99 9.99 0 0 0 2 19c0 .552.448 1 1 1a9.99 9.99 0 0 0 3.432-.662C7.54 19.766 8.743 20 10.001 20c5.522 0 10-4.478 10-10 0-1.257-.234-2.46-.662-3.568A9.99 9.99 0 0 0 20 5c0-.552-.448-1-1-1a9.99 9.99 0 0 0-3.432.662C14.46 4.234 13.257 4 12.001 2zm3.328 12.637c-.637.795-1.637 1.264-2.887 1.346-1.428.093-2.618-.328-3.447-1.222-.507-.547-.795-1.25-.83-2.032a.75.75 0 0 1 .746-.782h1.562a.75.75 0 0 1 .744.665c.08.718.59 1.157 1.364 1.157.653 0 1.187-.315 1.187-.805 0-.414-.372-.647-1.127-.866l-1.156-.335c-1.61-.468-2.39-1.29-2.39-2.523 0-1.275.98-2.296 2.532-2.492 1.314-.166 2.457.26 3.193 1.05.474.508.736 1.152.756 1.86a.75.75 0 0 1-.749.771h-1.572a.75.75 0 0 1-.745-.678c-.067-.577-.478-.934-1.115-.934-.582 0-1.047.284-1.047.727 0 .393.35.592 1.054.795l1.096.317c1.782.518 2.593 1.353 2.593 2.627 0 1.272-.924 2.378-2.563 2.592z"/>
              </svg>
              <span>Skype</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Quick Actions
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            SHORTCUTS
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {/* Action 1: Payment Methods */}
          <div 
            onClick={() => onNavigate?.('my_invoices')}
            className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-lime-500 dark:hover:border-lime-500 rounded-xl flex items-center justify-between cursor-pointer transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#65a30d] transition">
                  Payment Methods
                </h4>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  Manage your payment options
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>

          {/* Action 2: Security Settings */}
          <div 
            onClick={() => onNavigate?.('security')}
            className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-lime-500 dark:hover:border-lime-500 rounded-xl flex items-center justify-between cursor-pointer transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#65a30d] transition">
                  Security Settings
                </h4>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                  Enable 2FA, manage security
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Client Active Key (API Key) Card - LOCKED / UNLOCKED WITH REGENERATE   */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isApiUnlocked 
                ? 'bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400' 
                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
            }`}>
              <Key className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Client Active Key (API Key)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Use this key to integrate Client Active SMS, Numbers, and Statistics into your website
              </p>
            </div>
          </div>

          {/* Status Badge */}
          {isApiUnlocked ? (
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>APPROVED & ACTIVE</span>
            </span>
          ) : (
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>LOCKED / APPROVAL REQUIRED</span>
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Key Notification message */}
          {keyAlertMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{keyAlertMsg.text}</span>
            </div>
          )}

          {/* STATE A: API KEY IS UNLOCKED (Admin or Approved Users) */}
          {isApiUnlocked ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    Active Key:
                  </span>
                  <span className="font-mono text-sm font-bold text-[#65a30d] dark:text-lime-400 truncate select-all">
                    {showApiKey ? apiKey : 'sk_live_••••••••••••••••••••••••••••••••••••••••'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Unhide / Hide Button */}
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {showApiKey ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Unhide</span>
                      </>
                    )}
                  </button>

                  {/* Copy Key Button */}
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    className="px-3.5 py-1.5 rounded-lg bg-[#65a30d] hover:bg-[#54880b] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {copiedApiKey ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>

                  {/* GENERATE NEW API KEY BUTTON (NEW FEATURE) */}
                  <button
                    type="button"
                    disabled={isGeneratingKey}
                    onClick={handleGenerateNewApiKey}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                    title="Generate a new secure API Key if compromised"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingKey ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingKey ? 'Generating...' : 'Generate Key'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    If someone saw your key or it got exposed, click <strong>"Generate Key"</strong> to immediately rotate and revoke the old one.
                  </span>
                </span>
                <a
                  href="https://t.me/super_x_sms_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#65a30d] dark:text-lime-400 font-bold hover:underline flex items-center gap-1 shrink-0"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Contact Admin</span>
                </a>
              </div>
            </div>
          ) : (
            /* STATE B: API KEY IS LOCKED (Regular Users who need Admin Approval) */
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-200">
                    API Access is Locked for this Account
                  </h4>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-medium">
                    Direct API access is restricted by default. To request an API key for your account, please contact our administrator support below for verification and activation. Once approved, you will be able to view, copy, and rotate your API keys.
                  </p>
                </div>
              </div>

              {/* Locked Key Preview */}
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>sk_live_••••••••••••••••••••••••••••••••••••••••</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded">
                  Restricted
                </span>
              </div>

              {/* Direct Contact Admin Buttons (Telegram & Skype) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  Need API integration access? Contact Admin Support directly:
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://t.me/super_x_sms_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                    title="Telegram Support (@super_x_sms_support)"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.55 3.93-1.64 4.74-1.93 5.27-1.94.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/>
                    </svg>
                    <span>Telegram</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <a
                    href="https://teams.microsoft.com/l/chat/0/0?users=codeflowsupport%40gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#00aff0] hover:bg-[#009fdc] active:scale-95 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                    title="Teams Manager (codeflowsupport@gmail.com)"
                  >
                    <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.257.234 2.46.662 3.568A9.99 9.99 0 0 0 2 19c0 .552.448 1 1 1a9.99 9.99 0 0 0 3.432-.662C7.54 19.766 8.743 20 10.001 20c5.522 0 10-4.478 10-10 0-1.257-.234-2.46-.662-3.568A9.99 9.99 0 0 0 20 5c0-.552-.448-1-1-1a9.99 9.99 0 0 0-3.432.662C14.46 4.234 13.257 4 12.001 2zm3.328 12.637c-.637.795-1.637 1.264-2.887 1.346-1.428.093-2.618-.328-3.447-1.222-.507-.547-.795-1.25-.83-2.032a.75.75 0 0 1 .746-.782h1.562a.75.75 0 0 1 .744.665c.08.718.59 1.157 1.364 1.157.653 0 1.187-.315 1.187-.805 0-.414-.372-.647-1.127-.866l-1.156-.335c-1.61-.468-2.39-1.29-2.39-2.523 0-1.275.98-2.296 2.532-2.492 1.314-.166 2.457.26 3.193 1.05.474.508.736 1.152.756 1.86a.75.75 0 0 1-.749.771h-1.572a.75.75 0 0 1-.745-.678c-.067-.577-.478-.934-1.115-.934-.582 0-1.047.284-1.047.727 0 .393.35.592 1.054.795l1.096.317c1.782.518 2.593 1.353 2.593 2.627 0 1.272-.924 2.378-2.563 2.592z"/>
                    </svg>
                    <span>Skype</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Personal Information Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Personal Information
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            ACCOUNT
          </span>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          {/* Form Grid */}
          <div className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Username
              </label>
              <input
                type="text"
                readOnly
                value={username}
                className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-not-allowed select-all"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your full address"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            {/* State / Province */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                State/Province
              </label>
              <input
                type="text"
                value={stateProv}
                onChange={(e) => setStateProv(e.target.value)}
                placeholder="NY"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Postal Code
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="10001"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            {/* Country Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none cursor-pointer"
              >
                <option value="Select Country">Select Country</option>
                <option value="Bangladesh">Bangladesh</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="India">India</option>
              </select>
            </div>

            {/* Timezone Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none cursor-pointer"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          {/* Password Update Form Section */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            {passwordMsg && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                passwordMsg.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-300'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
              />
            </div>

            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
              Password must be at least 8 characters with uppercase, lowercase and numbers
            </p>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#65a30d] hover:bg-lime-700 shadow-md transition cursor-pointer"
            >
              <Key className="w-4 h-4 stroke-[2.2]" />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* 4. Notification Preferences Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Notification Preferences
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            ALERTS
          </span>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          {prefSavedMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Notification preferences saved successfully!</span>
            </div>
          )}

          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800/80">
            {/* Toggle 1: Email Notifications */}
            <div className="pt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Email Notifications
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Receive important updates via email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifs(!emailNotifs)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  emailNotifs ? 'bg-[#65a30d]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    emailNotifs ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: SMS Notifications */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    SMS Notifications
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Receive alerts via SMS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmsNotifs(!smsNotifs)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  smsNotifs ? 'bg-[#65a30d]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    smsNotifs ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Payment Alerts */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Payment Alerts
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Get notified about payment activities
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentAlerts(!paymentAlerts)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  paymentAlerts ? 'bg-[#65a30d]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    paymentAlerts ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 4: Security Alerts */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Security Alerts
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Important security notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSecurityAlerts(!securityAlerts)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  securityAlerts ? 'bg-[#65a30d]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    securityAlerts ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 5: Marketing Emails */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Marketing Emails
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Receive promotional content and updates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarketingEmails(!marketingEmails)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                  marketingEmails ? 'bg-[#65a30d]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    marketingEmails ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSavePreferences}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#65a30d] hover:bg-lime-700 shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.2]" />
              <span>Save Preferences</span>
            </button>
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
    </div>
  );
};
