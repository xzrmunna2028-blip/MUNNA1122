import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
  UserPlus,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { RegisteredUser } from './ActivationChatBot.js';
import { getUserDisplayName } from '../utils/userProfileHelper';

const isCreateAccountUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  return (
    path.includes('create-account') ||
    path.includes('createaccount') ||
    hash.includes('create-account') ||
    hash.includes('createaccount') ||
    search.includes('create-account') ||
    search.includes('createaccount') ||
    search.includes('action=create') ||
    search.includes('mode=create')
  );
};

const isRegisterUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  return (
    path.includes('register') ||
    path.includes('signup') ||
    hash.includes('register') ||
    hash.includes('signup') ||
    search.includes('register') ||
    search.includes('signup') ||
    search.includes('action=register') ||
    search.includes('mode=register')
  );
};

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
  darkMode?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(() => !isCreateAccountUrl() && isRegisterUrl());
  const [showCreateAccountView, setShowCreateAccountView] = useState(() => isCreateAccountUrl());
  
  // URL routing synchronization
  useEffect(() => {
    const handleUrlChange = () => {
      if (isCreateAccountUrl()) {
        setShowCreateAccountView(true);
        setIsRegisterMode(false);
      } else if (isRegisterUrl()) {
        setShowCreateAccountView(false);
        setIsRegisterMode(true);
      }
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const openCreateAccount = () => {
    setShowCreateAccountView(true);
    setIsRegisterMode(false);
    setErrorMessage('');
    setSuccessMessage('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/#create-account');
    }
  };

  const closeCreateAccount = () => {
    setShowCreateAccountView(false);
    setIsRegisterMode(false);
    setErrorMessage('');
    setSuccessMessage('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/#login');
    }
  };

  const openRegisterMode = () => {
    setShowCreateAccountView(false);
    setIsRegisterMode(true);
    setErrorMessage('');
    setSuccessMessage('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/#register');
    }
  };
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Load remembered credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('codeflow_remembered_email');
    if (savedEmail) {
      setIdentifier(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Real-time listener for user approval while waiting on login screen
  const startApprovalPolling = (email: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/user-status/${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'Active') {
            clearInterval(checkInterval);
            setSuccessMessage('🎉 আপনার অ্যাকাউন্টটি অ্যাডমিন অনুমোদন করেছেন! ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...');
            setTimeout(() => {
              completeLogin(email, data.user?.name);
            }, 1000);
          }
        }
      } catch (e) {}
    }, 2500);

    setTimeout(() => clearInterval(checkInterval), 180000);
  };

  // Sign In submit handler with Universal Server Database Support
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const inputUser = identifier.trim();
    const inputPass = password.trim();

    if (!inputUser) {
      setErrorMessage('Please enter your Email Address');
      return;
    }
    if (!inputPass) {
      setErrorMessage('Please enter your Password');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Universal Server Authentication across Any Browser
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputUser, password: inputPass }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        completeLogin(data.user.email, data.user.name);
        return;
      }

      if (data.status === 'Pending') {
        setIsLoading(false);
        setErrorMessage(
          '⚠️ আপনার অ্যাকাউন্টটি এখনো অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে (Pending Approval)। অ্যাডমিন অনুমোদন দিলে আপনি সাথে সাথে যেকোনো ব্রাউজার থেকে প্রবেশ করতে পারবেন।'
        );
        startApprovalPolling(inputUser.toLowerCase());
        return;
      }

      if (data.status === 'Suspended') {
        setIsLoading(false);
        setErrorMessage('আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে (Suspended)।');
        return;
      }

      if (data.status === 'Rejected') {
        setIsLoading(false);
        setErrorMessage('আপনার অ্যাকাউন্ট নিবন্ধনটি বাতিল করা হয়েছে।');
        return;
      }

      if (data.error && !res.ok) {
        setIsLoading(false);
        setErrorMessage(data.error);
        return;
      }
    } catch (err) {
      console.warn('[Auth] Server login failed, checking local fallback:', err);
    }

    // Local Fallback Check
    const lowerUser = inputUser.toLowerCase();

    // 1. Master Admin Login Check
    if (
      (lowerUser === 'xzrmunna7788@gmail.com' || lowerUser === 'xzrmunna7788') &&
      inputPass === 'XZRMUNNA12061'
    ) {
      completeLogin('xzrmunna7788@gmail.com');
      return;
    }

    // 2. Demo User Fallback
    if (
      (lowerUser === 'user@codeflow.com' || lowerUser === 'xzrmunna974@gmail.com') &&
      (inputPass === 'codeflow123' || inputPass === 'MUNNA11')
    ) {
      completeLogin(inputUser);
      return;
    }

    // 3. Check admin users in localStorage
    const adminUsersStr = localStorage.getItem('codeflow_admin_users_list_v2');
    if (adminUsersStr) {
      try {
        const adminUsers = JSON.parse(adminUsersStr);
        if (Array.isArray(adminUsers)) {
          const foundAdminUser = adminUsers.find(
            (u: any) =>
              u.email?.toLowerCase().trim() === lowerUser ||
              u.name?.toLowerCase().trim() === lowerUser
          );
          if (foundAdminUser && foundAdminUser.pass === inputPass) {
            if (foundAdminUser.status === 'Pending') {
              setIsLoading(false);
              setErrorMessage('Your account status is PENDING approval. Please wait for an administrator to activate your access.');
              return;
            }
            completeLogin(foundAdminUser.email, foundAdminUser.name);
            return;
          }
        }
      } catch (e) {}
    }

    // 4. Check registered users in localStorage
    const registeredUsersStr = localStorage.getItem('codeflow_registered_users');
    const registeredUsers: RegisteredUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
    const foundUser = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === lowerUser ||
        u.name.toLowerCase() === lowerUser
    );

    if (foundUser && foundUser.pass === inputPass) {
      completeLogin(foundUser.email, foundUser.name);
      return;
    }

    setIsLoading(false);
    setErrorMessage('Invalid Email or Password! Please try again.');
  };

  // Sign Up / Registration submit handler with Server Persistence
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const name = regName.trim();
    const email = regEmail.trim();
    const pass = regPassword;
    const confirmPass = regConfirmPassword;

    if (!name) {
      setErrorMessage('Please enter your Full Name');
      return;
    }
    if (!email) {
      setErrorMessage('Please enter your Email Address');
      return;
    }
    if (pass.length < 5) {
      setErrorMessage('Password must be at least 5 characters long');
      return;
    }
    if (pass !== confirmPass) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Call server registration
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        setIsLoading(false);
        setErrorMessage(data.error);
        return;
      }
    } catch (e) {
      console.warn('[Register] Server offline, saving locally:', e);
    }

    // Save locally
    const registeredUsersStr = localStorage.getItem('codeflow_registered_users');
    const registeredUsers: RegisteredUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
    const newUser: RegisteredUser = {
      name,
      email,
      pass,
      activatedAt: new Date().toISOString(),
    };

    registeredUsers.push(newUser);
    localStorage.setItem('codeflow_registered_users', JSON.stringify(registeredUsers));

    setIsLoading(false);
    setSuccessMessage('Account registered successfully! Awaiting admin approval.');

    // Auto-prefill the email for ease of login
    setIdentifier(email);
    setPassword('');

    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');

    setTimeout(() => {
      setIsRegisterMode(false);
      setSuccessMessage('');
    }, 1500);
  };

  const completeLogin = (userEmail: string, explicitName?: string) => {
    setIsLoading(false);
    setSuccessMessage('Successfully authenticated! Welcome back.');
    
    // Remember me check
    if (rememberMe) {
      localStorage.setItem('codeflow_remembered_email', identifier);
    } else {
      localStorage.removeItem('codeflow_remembered_email');
    }

    // Save login state in localStorage
    localStorage.setItem('codeflow_logged_in', 'true');
    localStorage.setItem('codeflow_user', userEmail);
    const resolvedName = explicitName || getUserDisplayName(userEmail);
    localStorage.setItem('codeflow_username', resolvedName);

    setTimeout(() => {
      onLoginSuccess(userEmail);
    }, 600);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#05070f] text-slate-100 relative overflow-hidden font-sans p-4 sm:p-6">
      
      {/* Sleek Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated dynamic grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
        
        {/* Soft, rotating glowing ambient spheres */}
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 -left-48 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{
            x: [0, -30, 50, 0],
            y: [0, 60, -40, 0],
            scale: [1, 0.95, 1.05, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/40 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Brand Info (Only shown when not on Create Account screen to avoid duplicate logo) */}
        <AnimatePresence>
          {!showCreateAccountView && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center text-center mb-6 overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-900/60 p-0.5 shadow-xl flex items-center justify-center shrink-0 border border-slate-800 transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/code_flow_logo.jpg"
                  alt="Code Flow Logo"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5 justify-center mt-2.5">
                Code Flow <span className="text-indigo-400 font-extrabold">SMS</span>
              </h1>
              <p className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase mt-1">
                ENTERPRISE VERIFICATION NETWORK
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Container Card with AnimatePresence */}
        <AnimatePresence mode="wait">
          {showCreateAccountView ? (
            /* CREATE AN ACCOUNT SCREEN (EXACT MATCH FOR USER SCREENSHOT) */
            <motion.div 
              key="create-account-card"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-[#0b1329] backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 relative text-center"
            >
              {/* Top subtle decorative accent line */}
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

              {/* Brand Logo & Title */}
              <div className="flex flex-col items-center justify-center mb-5">
                <div className="w-16 h-16 rounded-2xl bg-slate-900/90 p-1 border border-slate-800 shadow-xl flex items-center justify-center mb-3 transform hover:scale-105 transition-transform duration-300">
                  <img
                    src="/code_flow_logo.jpg"
                    alt="FOX SMS Logo"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Create an Account
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Contact our team to get your account created
                </p>
              </div>

              <div className="w-full h-[1px] bg-slate-800/70 my-5" />

              {/* ENGLISH Section */}
              <div className="text-left space-y-2">
                <h4 className="text-emerald-400 font-bold text-xs tracking-wider uppercase">
                  ENGLISH
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  To get started, please contact us on <strong>Telegram</strong> or <strong>Skype</strong> with your company name and the service you require. Our team will set up your account and send you your login credentials.
                </p>
              </div>

              <div className="w-full h-[1px] bg-slate-800/70 my-5" />

              {/* ARABIC Section */}
              <div className="text-right space-y-2" dir="rtl">
                <h4 className="text-emerald-400 font-bold text-xs tracking-wider uppercase text-right">
                  ARABIC
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal text-right">
                  يتم إنشاء الحسابات على هذه اللوحة بواسطة فريقنا. للبدء، يرجى التواصل معنا عبر التيليجرام أو سكايب مع اسم شركتك والخدمة التي تحتاجها. سيقوم فريقنا بإعداد حسابك وإرسال بيانات الدخول إليك.
                </p>
              </div>

              <div className="w-full h-[1px] bg-slate-800/70 my-6" />

              {/* Support Channels: Telegram & Skype (Compact, Pill Style matching Profile) */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {/* Option 1: Telegram Support Pill */}
                  <a
                    href="https://t.me/super_x_sms_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    title="Telegram Support (@super_x_sms_support)"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.55 3.93-1.64 4.74-1.93 5.27-1.94.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/>
                    </svg>
                    <span>Telegram</span>
                  </a>

                  {/* Option 2: Skype Support (Opens Teams Chat) Pill */}
                  <a
                    href="https://teams.microsoft.com/l/chat/0/0?users=codeflowsupport%40gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00aff0] hover:bg-[#009fdc] active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    title="Skype / Teams Support (codeflowsupport@gmail.com)"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.257.234 2.46.662 3.568A9.99 9.99 0 0 0 2 19c0 .552.448 1 1 1a9.99 9.99 0 0 0 3.432-.662C7.54 19.766 8.743 20 10.001 20c5.522 0 10-4.478 10-10 0-1.257-.234-2.46-.662-3.568A9.99 9.99 0 0 0 20 5c0-.552-.448-1-1-1a9.99 9.99 0 0 0-3.432.662C14.46 4.234 13.257 4 12.001 2zm3.328 12.637c-.637.795-1.637 1.264-2.887 1.346-1.428.093-2.618-.328-3.447-1.222-.507-.547-.795-1.25-.83-2.032a.75.75 0 0 1 .746-.782h1.562a.75.75 0 0 1 .744.665c.08.718.59 1.157 1.364 1.157.653 0 1.187-.315 1.187-.805 0-.414-.372-.647-1.127-.866l-1.156-.335c-1.61-.468-2.39-1.29-2.39-2.523 0-1.275.98-2.296 2.532-2.492 1.314-.166 2.457.26 3.193 1.05.474.508.736 1.152.756 1.86a.75.75 0 0 1-.749.771h-1.572a.75.75 0 0 1-.745-.678c-.067-.577-.478-.934-1.115-.934-.582 0-1.047.284-1.047.727 0 .393.35.592 1.054.795l1.096.317c1.782.518 2.593 1.353 2.593 2.627 0 1.272-.924 2.378-2.563 2.592z"/>
                    </svg>
                    <span>Skype</span>
                  </a>
                </div>

                <p className="text-[11px] text-slate-400">
                  Direct support active 24/7. Click either channel to initiate direct setup.
                </p>
              </div>

              <div className="w-full h-[1px] bg-slate-800/70 my-4" />

              {/* Direct Registration Form Option */}
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[11px] text-slate-400">Prefer instant self-registration?</span>
                <button
                  type="button"
                  onClick={openRegisterMode}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Direct Registration Form &rarr;</span>
                </button>
              </div>

              <div className="w-full h-[1px] bg-slate-800/70 my-4" />

              {/* Back to Login Button */}
              <div className="flex flex-col items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={closeCreateAccount}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>← Back to Login</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="login-main-card"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-slate-950/60 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 relative"
            >
          {/* Top subtle decorative accent line */}
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

          {/* Dynamic Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isRegisterMode ? 'Create New Account' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              {isRegisterMode 
                ? 'Submit your information for immediate admin activation' 
                : 'Sign in to access your secure SMS portal'}
            </p>
          </div>

          {/* Alerts using AnimatePresence */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1 text-left leading-relaxed">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="flex-1 text-left leading-relaxed">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Login/Register Forms */}
          <AnimatePresence mode="wait">
            {!isRegisterMode ? (
              /* LOGIN FORM */
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                {/* Email input field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Password input field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail('');
                        setForgotSuccess(false);
                        setShowForgotModal(true);
                      }}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition focus:outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Extra actions */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300 transition cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-md border transition-all duration-200 flex items-center justify-center ${
                        rememberMe 
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' 
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}>
                        {rememberMe && <ShieldCheck className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <span>Remember me</span>
                  </label>
                </div>

                {/* Animated Prominent Sign In button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01, translateY: -1 }}
                  whileTap={{ scale: 0.99, translateY: 0 }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-950/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none pt-3 pb-3 mt-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4 ml-0.5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              /* REGISTRATION FORM */
              <motion.form 
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleRegister} 
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 5 characters"
                      required
                      className="w-full pl-10 pr-11 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 font-mono"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01, translateY: -1 }}
                  whileTap={{ scale: 0.99, translateY: 0 }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-950/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none pt-3 pb-3 mt-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 ml-0.5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Reserved slot for custom options */}
          <div className="mt-6 pt-5 border-t border-slate-800/60 text-center flex items-center justify-center gap-1.5">
            {isRegisterMode ? (
              <>
                <span className="text-xs text-slate-400 font-medium">Already have an account?</span>
                <button
                  type="button"
                  onClick={closeCreateAccount}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-400 font-medium">Don't have an account?</span>
                <button
                  type="button"
                  onClick={openCreateAccount}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
                >
                  Create an Account
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-slate-100"
            >
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                  setForgotEmail('');
                }}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">Recover your Code Flow SMS account</p>
                </div>
              </div>

              {forgotSuccess ? (
                <div className="space-y-4 py-3">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium leading-relaxed">
                    <p className="font-bold text-emerald-200 mb-1">Reset Link Sent!</p>
                    Instructions have been dispatched to your email address ({forgotEmail}). You can follow the directions inside to access your account.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotSuccess(false);
                        setForgotEmail('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your registered Email Address. We will send you instructions to reset your password.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotSuccess(false);
                        setForgotEmail('');
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      {forgotLoading ? 'Processing...' : 'Send Reset Request'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
