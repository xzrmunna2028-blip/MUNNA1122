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
  UserPlus,
  Mail,
} from 'lucide-react';
import { RegisteredUser } from './ActivationChatBot.js';

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
  darkMode?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Login fields - strictly empty by default (no auto-fill/pre-saved credentials)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
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

  // Sign In submit handler
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
      setErrorMessage('Please enter your Password');
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

      // 2. Check dynamically registered users from localStorage
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

      // Invalid login credentials
      setIsLoading(false);
      setErrorMessage('Invalid Username/Email or Password! If you don\'t have an account, click "Create Account" below.');
    }, 600);
  };

  // Sign Up / Registration submit handler
  const handleRegister = (e: React.FormEvent) => {
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

    setTimeout(() => {
      const registeredUsersStr = localStorage.getItem('codeflow_registered_users');
      const registeredUsers: RegisteredUser[] = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];

      // Check if email already exists
      const isDuplicate = registeredUsers.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (isDuplicate) {
        setIsLoading(false);
        setErrorMessage('This Email Address is already registered. Please login.');
        return;
      }

      // Save new user safely
      const newUser: RegisteredUser = {
        name,
        email,
        pass,
        activatedAt: new Date().toISOString(),
      };

      registeredUsers.push(newUser);
      localStorage.setItem('codeflow_registered_users', JSON.stringify(registeredUsers));

      setIsLoading(false);
      setSuccessMessage('Account created successfully! You can now sign in.');
      
      // Auto-prefill the email for ease of login
      setIdentifier(email);
      setPassword('');
      
      // Reset form states
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      
      // Switch back to login mode after registration
      setTimeout(() => {
        setIsRegisterMode(false);
        setSuccessMessage('');
      }, 1500);
    }, 800);
  };

  const completeLogin = (userName: string) => {
    setIsLoading(false);
    setSuccessMessage('Login successful! Welcome back...');
    
    // Save login state in localStorage
    localStorage.setItem('codeflow_logged_in', 'true');
    localStorage.setItem('codeflow_user', userName);

    setTimeout(() => {
      onLoginSuccess(userName);
    }, 600);
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
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Elegant Container Card */}
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl shadow-cyan-950/30 p-6 sm:p-8 relative z-10 transition-all duration-300">
        
        {/* Logo and Brand Info */}
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
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mt-0.5">
            ENTERPRISE VIRTUAL SMS GATEWAY
          </p>
        </div>

        {/* Dynamic Headers based on Mode */}
        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-white">
            {isRegisterMode ? 'Create a New Account' : 'Sign In to Your Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegisterMode 
              ? 'Fill in your details to register for a secure connection'
              : 'Enter your credentials to manage your virtual gateway'}
          </p>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1 text-left">{errorMessage}</span>
          </div>
        )}

        {/* Success Message Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1 text-left">{successMessage}</span>
          </div>
        )}

        {/* Mode Forms */}
        {!isRegisterMode ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Username or Email ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your registered email or username"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-500/15 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
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
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. name@domain.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 5 characters"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm security password"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/15 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>CREATE REAL ACCOUNT</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Dynamic Navigation Mode Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-800/60 text-center">
          <p className="text-xs text-slate-400">
            {isRegisterMode ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition cursor-pointer"
            >
              {isRegisterMode ? 'Sign In Now' : 'Create Account'}
            </button>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-slate-100">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess(false);
                setForgotEmail('');
              }}
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
                  Password reset instructions have been dispatched to your email ({forgotEmail || 'your email'}). You can also contact support for instant help.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess(false);
                      setForgotEmail('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered Email ID. We will send you instructions to reset your password.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. user@domain.com"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
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
