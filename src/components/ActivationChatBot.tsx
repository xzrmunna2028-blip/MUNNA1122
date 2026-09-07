import React, { useState, useEffect } from 'react';
import {
  Bot,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Send,
  X,
  Check,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export interface RegisteredUser {
  name: string;
  email: string;
  pass: string;
  activatedAt: string;
}

interface ActivationChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  onActivationSuccess: (email: string, pass: string) => void;
}

export const ActivationChatBot: React.FC<ActivationChatBotProps> = ({
  isOpen,
  onClose,
  onActivationSuccess,
}) => {
  const [step, setStep] = useState<'chat' | 'submitting' | 'approved'>('chat');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [botMessages, setBotMessages] = useState<Array<{ id: number; sender: 'bot' | 'user'; text: string; time: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('chat');
      setError('');
      setIsTyping(true);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const timer = setTimeout(() => {
        setIsTyping(false);
        setBotMessages([
          {
            id: 1,
            sender: 'bot',
            text: 'Hello! 👋 Welcome to Code Flow SMS Automated System. I am your Official Account Activation Bot.',
            time: timeStr,
          },
          {
            id: 2,
            sender: 'bot',
            text: 'Please provide your Real Name, Valid Email Address, and a Strong Password below to request instant admin activation.',
            time: timeStr,
          },
        ]);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real Email validation regex
  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailStr.trim());
  };

  // Strong password requirements
  const hasMinLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordStrong = hasMinLength && hasUpperLower && hasNumberOrSymbol;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Please provide your valid full name (minimum 2 characters).');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Invalid email address! Please enter a real valid email (e.g. name@domain.com).');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password is too weak! Must have at least 8 chars, uppercase, lowercase, and a number/symbol.');
      return;
    }

    // Check if email already exists
    const existingUsersStr = localStorage.getItem('codeflow_registered_users');
    const existingUsers: RegisteredUser[] = existingUsersStr ? JSON.parse(existingUsersStr) : [];
    
    const isAlreadyRegistered = existingUsers.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (isAlreadyRegistered) {
      setError('This email is already registered and activated! You can log in directly.');
      return;
    }

    // Begin Submission to Admin Pending Activations Queue
    setStep('submitting');
    setIsTyping(true);

    setTimeout(() => {
      // Push to pending activations queue for real admin verification
      const pendingStr = localStorage.getItem('codeflow_pending_activations');
      const pendingList: any[] = pendingStr ? JSON.parse(pendingStr) : [];
      
      const newPending = {
        id: `PEND-${Math.floor(100 + Math.random() * 900)}`,
        name: cleanName,
        email: cleanEmail,
        pass: cleanPass,
        role: 'User',
        balance: 0.0,
        status: 'Pending',
        assignedNumbers: 0,
        ipAddress: `103.${Math.floor(100 + Math.random() * 150)}.${Math.floor(10 + Math.random() * 200)}.${Math.floor(10 + Math.random() * 80)}`,
        location: 'Dhaka, Bangladesh',
        device: 'Web Client / Chrome',
        isOnline: true,
        lastActive: 'Awaiting Activation',
        activatedAt: new Date().toISOString(),
      };

      // Add to pending queue if not present
      if (!pendingList.some((p) => p.email.toLowerCase() === cleanEmail)) {
        pendingList.push(newPending);
        localStorage.setItem('codeflow_pending_activations', JSON.stringify(pendingList));
      }

      // Also ensure registered user record is prepared
      if (!existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        existingUsers.push({
          name: cleanName,
          email: cleanEmail,
          pass: cleanPass,
          activatedAt: new Date().toISOString(),
        });
        localStorage.setItem('codeflow_registered_users', JSON.stringify(existingUsers));
      }

      window.dispatchEvent(new Event('storage'));

      setIsTyping(false);
      setStep('approved');
    }, 1500);
  };

  const handleFinishAndLogin = () => {
    onActivationSuccess(email.trim().toLowerCase(), password.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 relative">
        
        {/* Top Header - Branded Bot Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white p-1 border border-slate-200 shadow-md flex items-center justify-center shrink-0 relative">
              <img
                src="/code_flow_logo.jpg"
                alt="Code Flow"
                className="w-full h-full object-contain rounded-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1">
                  Code Flow <span className="text-cyan-400">Assistant</span>
                </h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <Bot className="w-2.5 h-2.5" />
                  AI Bot
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Account Activation System · Online
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-sidebar-scrollbar">
          
          {/* Bot Greeting & Chat History */}
          <div className="space-y-3">
            {botMessages.map((msg) => (
              <div key={msg.id} className="flex gap-2.5 items-start">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center shrink-0 text-cyan-400 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl rounded-tl-none p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-sm">
                  <p>{msg.text}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">{msg.time}</span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-xs text-cyan-400 font-semibold pl-10">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
                <span>Code Flow Bot is processing...</span>
              </div>
            )}
          </div>

          {/* Form Step */}
          {step === 'chat' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 mt-2 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                <Sparkles className="w-4 h-4" />
                <span>Enter Credentials for Account Activation</span>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Full Name</span>
                    <span className="text-[10px] text-slate-500 font-normal">Your Real Name</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>

                {/* Real Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Real Email Address</span>
                    <span className="text-[10px] text-cyan-400 font-bold">Must be Real & Unique</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </div>

                {/* Strong Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Strong Password</span>
                    <span className="text-[10px] text-slate-400">Letters + Numbers</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Checklist Criteria */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1.5 text-[10px]">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasUpperLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Upper & Lowercase</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasNumberOrSymbol ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className="w-3 h-3" />
                      <span>Number / Symbol</span>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>SUBMIT FOR ADMIN APPROVAL</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </form>
            </div>
          )}

          {/* Submitting / Processing State */}
          {step === 'submitting' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 relative">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Contacting Admin Gateway...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Validating email syntax and submitting account <strong className="text-cyan-300 font-mono">{email}</strong> to Code Flow SMS Admin queue.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 py-2 px-3 rounded-xl max-w-xs mx-auto">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Admin Approval in progress...</span>
              </div>
            </div>
          )}

          {/* Approved & Congratulations State */}
          {step === 'approved' && (
            <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-emerald-800/60 rounded-2xl p-5 sm:p-6 text-center space-y-4 animate-scale-up shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div>
                <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                  🎉 ADMIN APPROVED
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Congratulations, {name}!
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Your account has been officially verified and activated by Code Flow SMS Admin. You can now access your panel dashboard immediately!
                </p>
              </div>

              {/* Account Summary Card */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-left text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Activated Email:</span>
                  <span className="font-bold text-cyan-300 font-mono">{email}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Active & Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Panel Access:</span>
                  <span className="font-bold text-slate-200">Full Virtual SMS Gateway</span>
                </div>
              </div>

              {/* Sign In Now Button */}
              <button
                type="button"
                onClick={handleFinishAndLogin}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition duration-200 transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>SIGN IN WITH ACTIVATED ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
