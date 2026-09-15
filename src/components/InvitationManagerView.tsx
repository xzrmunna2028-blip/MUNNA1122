import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  User, 
  DollarSign, 
  ArrowRight,
  Link2,
  AlertTriangle
} from 'lucide-react';

interface InvitationItem {
  token: string;
  email: string;
  name: string;
  role: string;
  balance: number;
  inviter: string;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'used' | 'expired';
  usedAt?: number;
  link?: string;
  remainingSeconds?: number;
  isExpired?: boolean;
}

interface InvitationManagerViewProps {
  showToast: (msg: string) => void;
}

export const InvitationManagerView: React.FC<InvitationManagerViewProps> = ({ showToast }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'User' | 'VIP' | 'Sub-Admin'>('User');
  const [balance, setBalance] = useState('50.00');
  const [inviter, setInviter] = useState('Admin Support');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [activeInvite, setActiveInvite] = useState<InvitationItem | null>(null);
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [emailErrorNotice, setEmailErrorNotice] = useState<{
    isIpUnauthorized?: boolean;
    serverIp?: string;
    resolution?: string;
    error?: string;
  } | null>(null);

  // Fetch invitations from server
  const fetchInvitations = async () => {
    try {
      const res = await fetch('/api/invitations');
      const data = await res.json();
      if (data.success && Array.isArray(data.invitations)) {
        setInvitations(data.invitations);
        // Cache to local storage as backup
        localStorage.setItem('codeflow_invitations_cache', JSON.stringify(data.invitations));
      }
    } catch (e) {
      console.warn('Failed to fetch invitations:', e);
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please provide a valid recipient email address');
      return;
    }

    setIsGenerating(true);
    try {
      const origin = window.location.origin;
      const res = await fetch('/api/create-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || email.split('@')[0],
          role,
          balance: parseFloat(balance) || 50.0,
          inviter: inviter.trim() || 'Admin Support',
          hostUrl: origin,
        }),
      });

      const data = await res.json();
      if (data.success && data.invitation) {
        const inv = data.invitation;
        setActiveInvite(inv);
        showToast(`10-Minute Invitation Link generated for ${inv.email}!`);
        fetchInvitations();
      } else {
        showToast('Error: ' + (data.error || 'Failed to create invitation'));
      }
    } catch (err: any) {
      showToast('Network error creating invitation: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async (targetInvite: InvitationItem) => {
    setIsSendingEmail(true);
    try {
      const inviteUrl = targetInvite.link || `${window.location.origin}/#onboarding?token=${targetInvite.token}`;
      const res = await fetch('/api/send-invitation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetInvite.email,
          link: inviteUrl,
          name: targetInvite.name,
          inviter: targetInvite.inviter || 'Traffic Analytics Support',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailErrorNotice(null);
        showToast(`Invitation sent directly to ${targetInvite.email} via Brevo SMTP!`);
      } else {
        if (data.isIpUnauthorized) {
          setEmailErrorNotice({
            isIpUnauthorized: true,
            serverIp: data.serverIp,
            resolution: data.resolution,
            error: data.error,
          });
          // Auto-copy link so user is not blocked
          navigator.clipboard.writeText(inviteUrl);
          setCopiedToken(targetInvite.token);
          showToast(`Brevo IP Block (525): Link copied! Whitelist IP ${data.serverIp} in Brevo.`);
        } else {
          showToast('SMTP Error: ' + (data.error || 'Could not send email'));
        }
      }
    } catch (err: any) {
      showToast('Error sending email: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyLink = (targetLink: string, token: string) => {
    navigator.clipboard.writeText(targetLink);
    setCopiedToken(token);
    showToast('Invitation link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleRevoke = async (token: string) => {
    try {
      const res = await fetch('/api/revoke-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Invitation link revoked.');
        fetchInvitations();
        if (activeInvite?.token === token) {
          setActiveInvite(null);
        }
      }
    } catch (e) {
      showToast('Failed to revoke invitation');
    }
  };

  const formatSeconds = (sec?: number) => {
    if (typeof sec !== 'number' || sec <= 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-lime-950/40 via-slate-900 to-slate-950 border border-lime-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#65a30d] to-[#4d7c0f] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-lime-950/50 shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2.5">
              <span>10-Minute User Verification Links</span>
              <span className="px-2.5 py-0.5 rounded-full bg-lime-950 text-lime-400 border border-lime-800 text-[10px] font-extrabold uppercase tracking-wider">
                4-Step Onboarding
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Generate personalized verification links that grant prospective users access to the 4-step onboarding interface (About You, Location, Contact, Security). 
              For security, links automatically expire in <strong>exactly 10 minutes</strong> and are exclusive to the recipient.
            </p>
          </div>
        </div>

        <button
          onClick={fetchInvitations}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Grid: Generator Form & Active Link Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FORM: Generate Link */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span>Generate New 10-Minute Link</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>10-Min Expiry</span>
            </span>
          </div>

          <form onSubmit={handleCreateInvitation} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                RECIPIENT EMAIL <span className="text-lime-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. client.traffic@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                The link can only be used by this verified recipient.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                PRE-ASSIGNED USER FULL NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Md Ruman Hossain"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                This exact name will be locked and displayed in their profile view.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  STARTING BALANCE ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full pl-7 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  ASSIGNED ROLE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 rounded-xl text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="User">User (Standard Agent)</option>
                  <option value="VIP">VIP (Priority Routes)</option>
                  <option value="Sub-Admin">Sub-Admin (Moderator)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                INVITER DISPLAY NAME
              </label>
              <input
                type="text"
                value={inviter}
                onChange={(e) => setInviter(e.target.value)}
                placeholder="e.g. Master Admin or Support Team"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-lime-500 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#65a30d] to-[#4d7c0f] hover:from-[#54880b] hover:to-[#3f670c] text-white font-black text-xs sm:text-sm shadow-lg shadow-lime-950 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 mt-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Secure Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate 10-Minute Invitation Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ACTIVE LINK & EMAIL ACTION */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Generated Invitation Output</span>
              </h4>
              {activeInvite && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Now
                </span>
              )}
            </div>

            {activeInvite ? (
              <div className="space-y-4 animate-fade-in">
                {/* Countdown Box */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-200">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Time remaining before link expires:</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-black text-sm">
                    {formatSeconds(Math.max(0, Math.floor((activeInvite.expiresAt - Date.now()) / 1000)))}
                  </span>
                </div>

                {/* Recipient Details Pill */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Recipient:</span>
                    <span className="font-bold text-white font-mono">{activeInvite.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Name:</span>
                    <span className="font-bold text-lime-400">{activeInvite.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Role & Balance:</span>
                    <span className="font-bold text-cyan-300">{activeInvite.role} &bull; ${activeInvite.balance.toFixed(2)}</span>
                  </div>
                </div>

                {/* URL Display with Copy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>ONBOARDING URL</span>
                    <span className="text-[10px] text-slate-500">Contains 4-step wizard</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={activeInvite.link || `${window.location.origin}/#onboarding?token=${activeInvite.token}`}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeInvite.link || `${window.location.origin}/#onboarding?token=${activeInvite.token}`, activeInvite.token)}
                      className="px-3.5 py-2 bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                    >
                      {copiedToken === activeInvite.token ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === activeInvite.token ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Actions: Direct Link Sharing & Email */}
                <div className="pt-2 space-y-2.5">
                  <div className="p-3 rounded-2xl bg-lime-950/30 border border-lime-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-lime-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ইউজারকে সরাসরি পাঠানোর লিংক (Direct Share Link)</span>
                      </span>
                      <span className="text-[10px] text-lime-400 font-mono font-bold">10-Min Active</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      নিচের বাটনে চাপ দিয়ে লিংকটি কপি করে নিন এবং সরাসরি আপনার ইমেইল, WhatsApp বা Telegram দিয়ে ইউজারকে পাঠিয়ে দিন:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(activeInvite.link || `${window.location.origin}/#onboarding?token=${activeInvite.token}`, activeInvite.token)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition"
                      >
                        {copiedToken === activeInvite.token ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedToken === activeInvite.token ? 'Link Copied!' : 'Copy Onboarding Link'}</span>
                      </button>
                      <a
                        href={`mailto:${activeInvite.email}?subject=Your%20Invitation%20to%20Traffic%20Analytics&body=Hello%20${encodeURIComponent(activeInvite.name)},%0A%0APlease%20use%20the%20following%20link%20to%20complete%20your%20account%20setup%20(valid%20for%2010%20minutes):%0A${encodeURIComponent(activeInvite.link || `${window.location.origin}/#onboarding?token=${activeInvite.token}`)}%0A%0AOnce%20completed,%20your%20account%20will%20be%20reviewed%20and%20approved.`}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 border border-cyan-500/30 transition cursor-pointer"
                        title="Send via your Default Mail Client (Gmail / Outlook)"
                      >
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Open My Email Client</span>
                      </a>
                    </div>
                  </div>

                  <a
                    href={activeInvite.link || `${window.location.origin}/#onboarding?token=${activeInvite.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition text-center border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open & Test 4-Step Onboarding View</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-300">No Link Generated Yet</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Fill out the form on the left to generate a 10-minute temporary link and dispatch it to the user's email.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Emails sent with Brevo Relay automatically embed the 10-minute security expiration warning.</span>
          </div>
        </div>
      </div>

      {/* TABLE: All Generated Links */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-400" />
              <span>All Generated 10-Minute Verification Links ({invitations.length})</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Live tracking of link statuses, remaining countdowns, and completion logs.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Recipient & Pre-assigned Name</th>
                <th className="py-3 px-3">Role & Balance</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3">10-Min Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No invitation links have been generated yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => {
                  const now = Date.now();
                  const remainingSec = Math.max(0, Math.floor((inv.expiresAt - now) / 1000));
                  const isExpired = now > inv.expiresAt || inv.status === 'expired';
                  const isUsed = inv.status === 'used';
                  const isActive = !isExpired && !isUsed;

                  return (
                    <tr key={inv.token} className="hover:bg-slate-950/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{inv.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 text-[10px] font-bold">
                          {inv.role}
                        </span>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold mt-0.5">
                          ${inv.balance.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        {isUsed ? (
                          <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            Completed
                          </span>
                        ) : isActive ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black font-mono flex items-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {formatSeconds(remainingSec)} remaining
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-[10px] font-extrabold w-fit">
                            Expired
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv.link || `${window.location.origin}/#onboarding?token=${inv.token}`, inv.token)}
                            title="Copy Link"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition"
                          >
                            {copiedToken === inv.token ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendEmail(inv)}
                            title="Send via Brevo SMTP Relay"
                            disabled={!isActive}
                            className="p-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={inv.link || `${window.location.origin}/#onboarding?token=${inv.token}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Onboarding Wizard"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(inv.token)}
                              title="Revoke / Expire Now"
                              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 cursor-pointer transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
