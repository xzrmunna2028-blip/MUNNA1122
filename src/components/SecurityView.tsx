import React, { useState, useEffect } from 'react';
import * as OTPAuth from 'otpauth';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  Monitor, 
  Copy, 
  Check, 
  Loader2,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

// Helper to generate a RFC4648 Base32 secret string for TOTP
const generateRandomBase32Secret = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const cryptoObj = window.crypto || (window as any).msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const values = new Uint8Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      secret += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return secret;
};

export const SecurityView: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ksi_2fa_enabled') === 'true';
  });

  // Unique secret key for real-time TOTP generation
  const [secretKey, setSecretKey] = useState<string>(() => {
    const saved = localStorage.getItem('ksi_2fa_secret_key');
    if (saved) return saved;
    const newSecret = generateRandomBase32Secret();
    localStorage.setItem('ksi_2fa_secret_key', newSecret);
    return newSecret;
  });

  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const totpUri = `otpauth://totp/KSI:XZRMUNNA?secret=${secretKey}&issuer=KSI&algorithm=SHA1&digits=6&period=30`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(totpUri)}`;

  useEffect(() => {
    localStorage.setItem('ksi_2fa_enabled', is2FAEnabled ? 'true' : 'false');
  }, [is2FAEnabled]);

  const handleGenerateNewSecret = () => {
    const newSecret = generateRandomBase32Secret();
    setSecretKey(newSecret);
    localStorage.setItem('ksi_2fa_secret_key', newSecret);
    setVerificationCode('');
    setVerifyError('');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setVerifyError('Please enter a valid 6-digit code.');
      return;
    }

    try {
      // Validate TOTP code using standard OTPAuth library
      const totp = new OTPAuth.TOTP({
        issuer: 'KSI',
        label: 'XZRMUNNA',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretKey),
      });

      // Allow a time window drift of +- 1 period (30 seconds) for clock tolerance
      const delta = totp.validate({ token: cleanCode, window: 1 });

      if (delta !== null) {
        setVerifyError('');
        setIs2FAEnabled(true);
        setIsSettingUp(false);
        setVerificationCode('');
        setSuccessMsg('Two-factor authentication verified and enabled successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setVerifyError('Invalid verification code. Please check your authenticator app and try again.');
      }
    } catch (err) {
      setVerifyError('Error validating code. Please check your secret key.');
    }
  };

  const handleDisable = () => {
    if (window.confirm('Are you sure you want to disable two-factor authentication?')) {
      setIs2FAEnabled(false);
      setIsSettingUp(false);
      setSuccessMsg('Two-factor authentication has been disabled.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
        <span>Dashboard</span>
        <span>&gt;</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">Security</span>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main 2FA Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#84cc16]" />
        
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ecfccb] dark:bg-lime-950/50 text-[#65a30d] dark:text-lime-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Two-Factor Authentication
            </h3>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {/* Card Body Header */}
        <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-4">
            <Shield className={`w-8 h-8 stroke-[1.8] ${is2FAEnabled ? 'text-lime-600 dark:text-lime-400' : ''}`} />
          </div>

          <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {is2FAEnabled ? '2FA is Enabled' : '2FA is Not Enabled'}
          </h4>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
            {is2FAEnabled
              ? 'Your account is secured with two-factor authentication. Verification codes are required upon sign in.'
              : "Protect your account by enabling two-factor authentication. You'll need an authenticator app on your phone."}
          </p>

          {!is2FAEnabled && (
            <button
              onClick={() => setIsSettingUp(!isSettingUp)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-[#65a30d] hover:bg-lime-700 shadow-md transition cursor-pointer"
            >
              {isSettingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                  <span>Enable Two-Factor Authentication</span>
                </>
              )}
            </button>
          )}

          {is2FAEnabled && (
            <button
              onClick={handleDisable}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md transition cursor-pointer"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>Disable Two-Factor Authentication</span>
            </button>
          )}

          {/* Set Up Your Authenticator Form Section */}
          {!is2FAEnabled && isSettingUp && (
            <div className="w-full max-w-xl mt-8 pt-8 border-t border-slate-100 dark:border-slate-800/80 text-left space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h5 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Set Up Your Authenticator
                </h5>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Scan this QR code with your authenticator app:
                </p>
              </div>

              {/* QR Code Container Card */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="2FA QR Code" 
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback if image proxy is blocked
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 text-center">
                  Use Google Authenticator, Authy, or similar apps
                </p>
              </div>

              {/* Manual Secret Key Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Or enter this secret key manually:
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateNewSecret}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#65a30d] dark:text-slate-400 dark:hover:text-lime-400 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New Key</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    value={secretKey}
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono font-bold text-[#65a30d] dark:text-lime-400 tracking-wider pr-12 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="absolute right-2 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                    title="Copy Secret Key"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Secret key copied to clipboard!
                  </p>
                )}
              </div>

              {/* Enter 6-Digit Code Section */}
              <form onSubmit={handleVerify} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Enter the 6-digit verification code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setVerificationCode(val);
                      if (verifyError) setVerifyError('');
                    }}
                    placeholder="0 0 0 0 0 0"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-lg sm:text-xl font-mono font-bold tracking-[0.5em] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-[#65a30d] focus:outline-none"
                  />
                  {verifyError && (
                    <p className="text-xs font-bold text-rose-500">
                      {verifyError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#65a30d] hover:bg-lime-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Verify & Enable 2FA</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* About 2FA Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            About 2FA
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            INFO
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
            Two-factor authentication adds an extra layer of security by requiring a second form of verification when signing in.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-[#65a30d] shrink-0" />
              <span>Protects against password theft</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-[#65a30d] shrink-0" />
              <span>Prevents unauthorized access</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-[#65a30d] shrink-0" />
              <span>Secures your financial data</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-[#65a30d] shrink-0" />
              <span>Industry standard security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Apps Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Recommended Apps
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            TOTP
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {/* App 1: Google Authenticator */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-xs text-blue-600 shadow-xs shrink-0">
              G
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Google Authenticator
            </span>
          </div>

          {/* App 2: Authy */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-xs text-red-500 shadow-xs shrink-0">
              A
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Authy
            </span>
          </div>

          {/* App 3: 1Password */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-xs text-indigo-500 shadow-xs shrink-0">
              1P
            </div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              1Password
            </span>
          </div>
        </div>
      </div>

      {/* Session Security Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Session Security
          </h3>
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            NOW
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Your account is currently logged in from:
          </p>

          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                Current Session
              </p>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                103.231.238.223
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
    </div>
  );
};
