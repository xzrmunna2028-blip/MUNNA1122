import React, { useState } from 'react';
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
  Bot,
  Sparkles,
} from 'lucide-react';
import { ActivationChatBot, RegisteredUser } from './ActivationChatBot';

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
  darkMode?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('xzrmunna7788@gmail.com');
  const [password, setPassword] = useState('MUNNA11');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Account Activation Chatbot state
  const [showActivationBot, setShowActivationBot] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const inputUser = identifier.trim();
    const inputPass = password.trim();

    if (!inputUser) {
      setErrorMessage('Please enter your Username or Email ID');
      return;
    }
    if (!inputPass) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. Check default admin/standard credentials
      const defaultUsernames = [
        'xzrmunna7788@gmail.com',
        'xzrmunna7788',
        'munna',
        'xzrmunna',
        'xzrmunna974@gmail.com'
      ];
      const isDefaultUser = defaultUsernames.includes(inputUser.toLowerCase());
      const isDefaultPass = inputPass === 'MUNNA11' || inputPass === 'codeflow123';

      if (isDefaultUser && isDefaultPass) {
        completeLogin(inputUser);
        return;
      }

      // 2. Check dynamically registered & admin-approved users from Chatbot
      const registeredUsersStr = localStorage.getItem('codeflow_registered_users');
      const registeredUsers: RegisteredUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
      
      const foundUser = registeredUsers.find(
        (u) =>
          u.email.toLowerCase() === inputUser.toLowerCase() ||
          u.name.toLowerCase() === inputUser.toLowerCase()
      );

      if (foundUser && foundUser.pass === inputPass) {
        completeLogin(foundUser.name || foundUser.email);
        return;
      }

      // Invalid login
      setIsLoading(false);
      setErrorMessage('Invalid Email/Username or Password! If you are a new user, click "Account Active" below to activate.');
    }, 600);
  };

  const completeLogin = (userName: string) => {
    setIsLoading(false);
    setSuccessMessage('Login successful! Entering Code Flow SMS Dashboard...');
    
    // Save login state in localStorage
    localStorage.setItem('codeflow_logged_in', 'true');
    localStorage.setItem('codeflow_user', userName);

    setTimeout(() => {
      onLoginSuccess(userName);
    }, 600);
  };

  const handleActivationSuccess = (newEmail: string, newPass: string) => {
    setIdentifier(newEmail);
    setPassword(newPass);
    setSuccessMessage('Account activated & approved! Signing you in automatically...');
    
    setTimeout(() => {
      completeLogin(newEmail);
    }, 800);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden font-sans p-4 sm:p-6">
      {/* Background Animated Subtle Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Single Card - High Elegance, Unified Border */}
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl shadow-cyan-950/30 p-6 sm:p-8 relative z-10">
        
        {/* Top Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl shadow-cyan-500/20 flex items-center justify-center shrink-0 border border-slate-200 mb-3 transform hover:scale-105 transition-transform duration-300">
            <img
              src="/code_flow_logo.jpg"
              alt="Code Flow Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-1.5 justify-center">
            Code Flow <span className="text-cyan-400">SMS</span>
          </h1>
          <p className="text-[11px] font-extrabold tracking-widest text-slate-400 uppercase mt-0.5">
            ENTERPRISE VIRTUAL SMS GATEWAY
          </p>
        </div>

        {/* Section Heading */}
        <div className="mb-5 text-center">
          <h2 className="text-base font-bold text-slate-200">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your email or username and password to continue
          </p>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Message Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Field 1: Username or Email ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
              Username or Email ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="xzrmunna7788@gmail.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          {/* Field 2: Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-3 bg-slate-950/90 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0 cursor-pointer accent-cyan-500"
              />
              <span className="text-xs font-bold text-slate-400 hover:text-slate-300">
                Remember Me
              </span>
            </label>

            {/* Forgot Password Link */}
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotSuccess(false);
              }}
              className="text-xs font-extrabold text-cyan-400 hover:text-cyan-300 hover:underline transition cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>SIGN IN TO PANEL</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Bottom Account Activation Trigger Button - Clean & Single Integrated Area */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">New to Code Flow?</span>
          
          <button
            type="button"
            onClick={() => setShowActivationBot(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-700/60 text-cyan-300 hover:text-cyan-200 text-xs font-black shadow-md shadow-cyan-950/40 transition duration-200 cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span>Account Active</span>
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Account Activation Chatbot Modal */}
      <ActivationChatBot
        isOpen={showActivationBot}
        onClose={() => setShowActivationBot(false)}
        onActivationSuccess={handleActivationSuccess}
      />

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-slate-100">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Recover your Code Flow SMS account</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-medium leading-relaxed">
                  <p className="font-bold text-emerald-200 mb-1">Reset Link Sent!</p>
                  Password reset instructions have been dispatched to your email (xzrmunna7788@gmail.com). You can also contact support for instant help.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setShowActivationBot(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Open Activation Bot
                  </button>
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered Username or Email ID. We will send you instructions to reset your password.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Username or Email</label>
                  <input
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. xzrmunna7788@gmail.com"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                  >
                    {forgotLoading ? 'Processing...' : 'Send Reset Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

