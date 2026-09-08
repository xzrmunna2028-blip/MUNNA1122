import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Copy,
  Check,
  Headphones
} from 'lucide-react';

interface ProfileViewProps {
  onNavigate?: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  // 2FA status from local storage
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ksi_2fa_enabled') === 'true';
  });

  // API Key States
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedApiKey, setCopiedApiKey] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKeys = localStorage.getItem('codeflow_admin_apikeys');
    if (savedKeys) {
      try {
        const list = JSON.parse(savedKeys);
        const userKey = list.find((k: any) => k.user?.toLowerCase() === 'xzrmunna974@gmail.com' || k.user?.toLowerCase() === 'xzrmunna7788@gmail.com');
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
          const userKey = list.find((k: any) => k.user?.toLowerCase() === 'xzrmunna7788@gmail.com');
          if (userKey) setApiKey(userKey.key);
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(true);
    setTimeout(() => setCopiedApiKey(false), 2000);
  };

  // Profile Form States
  const [username] = useState('XZRMUNNA');
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('xzrmunna7788@gmail.com');
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
      setIs2FAEnabled(localStorage.getItem('ksi_2fa_enabled') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <span>Dashboard</span>
        <span>&gt;</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">My Profile</span>
      </div>

      {/* 1. Header Banner Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="bg-[#65a30d] p-8 sm:p-10 flex flex-col items-center justify-center text-center text-white space-y-3">
          {/* User Avatar Placeholder */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-200/90 dark:bg-slate-800 border-4 border-white/20 flex items-center justify-center shadow-lg">
            <User className="w-14 h-14 sm:w-16 sm:h-16 text-slate-400 stroke-[1.5]" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-white">
              {username}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-lime-100 mt-0.5">
              {email}
            </p>
          </div>

          {/* 2FA Status Badge */}
          <button
            onClick={() => onNavigate?.('security')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs transition cursor-pointer ${
              is2FAEnabled 
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-400/30' 
                : 'bg-lime-950/30 text-lime-100 border border-lime-400/30 hover:bg-lime-900/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${is2FAEnabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[11px]">
              {is2FAEnabled ? '2FA On' : '! 2FA Off'}
            </span>
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Member since September 2026
          </p>
        </div>
      </div>

      {/* 2. Quick Actions Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
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

      {/* API Key / Active Key Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-lime-100 dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
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
          <span className="text-[10px] font-extrabold text-lime-600 dark:text-lime-400 bg-lime-100 dark:bg-lime-950/80 px-2 py-0.5 rounded border border-lime-300 dark:border-lime-800 uppercase tracking-widest shrink-0">
            Approved
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Active Key:
              </span>
              <span className="font-mono text-sm font-bold text-[#65a30d] dark:text-lime-400 truncate">
                {showApiKey ? apiKey : 'sk_live_••••••••••••••••••••••••••••'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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

              <button
                type="button"
                onClick={handleCopyApiKey}
                className="px-3.5 py-1.5 rounded-lg bg-[#65a30d] hover:bg-[#54880b] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
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
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>To regenerate or request a new API Key, contact Admin Support.</span>
            <a
              href="https://t.me/super_x_sms_s"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#65a30d] dark:text-lime-400 font-bold hover:underline flex items-center gap-1"
            >
              <Headphones className="w-3 h-3" />
              Contact Admin
            </a>
          </div>
        </div>
      </div>

      {/* 3. Personal Information Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
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
