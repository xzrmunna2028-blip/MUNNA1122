import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Upload,
  Image as ImageIcon,
  Power,
  Clock,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  RefreshCw,
  Eye,
  User as UserIcon,
  Users,
  Layers,
  X,
  ExternalLink,
  ShieldAlert,
  Wrench,
  Gift,
  Mail,
  Filter,
  Check,
  Search,
  Bell
} from 'lucide-react';
import { SystemNoticeItem } from './UserNoticeModal';

interface AdminUpdateNoticeManagerProps {
  showToast: (msg: string) => void;
  broadcasts: any[];
  setBroadcasts: React.Dispatch<React.SetStateAction<any[]>>;
  darkMode?: boolean;
  allUsers?: any[];
}

export const AdminUpdateNoticeManager: React.FC<AdminUpdateNoticeManagerProps> = ({
  showToast,
  broadcasts,
  setBroadcasts,
  darkMode = true,
  allUsers = [],
}) => {
  // Target Audience Selection
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific'>('all');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Notice Content Fields
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeType, setNoticeType] = useState<string>('update');
  const [noticeAuthor, setNoticeAuthor] = useState('Munna (Master Admin)');
  const [noticeImageUrl, setNoticeImageUrl] = useState('');
  const [displayMode, setDisplayMode] = useState<'all' | 'popup' | 'banner' | 'inbox'>('all');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');

  // Action Button
  const [hasActionButton, setHasActionButton] = useState(false);
  const [actionBtnText, setActionBtnText] = useState('Open Support');
  const [actionBtnUrl, setActionBtnUrl] = useState('https://t.me/super_x_sms_s');

  const [isSendingNotice, setIsSendingNotice] = useState(false);

  // Live Preview Mode in Admin Panel
  const [previewMode, setPreviewMode] = useState<'popup' | 'banner'>('popup');

  // Filter list tab
  const [filterTab, setFilterTab] = useState<'all' | 'broadcast' | 'personal' | 'active'>('all');

  // Loaded Users list from server for accurate targeting
  const [serverUsers, setServerUsers] = useState<any[]>(allUsers || []);

  // System Maintenance Mode State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('Scheduled System Upgrade in Progress');
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Our engineering team is actively upgrading carrier routes and server latency. Normal operations will resume shortly.'
  );
  const [maintenanceEta, setMaintenanceEta] = useState('Approx. 15-30 mins');
  const [maintenanceImage, setMaintenanceImage] = useState('');
  const [maintenanceAuthor, setMaintenanceAuthor] = useState('Master Admin');
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

  // Fetch Users & Maintenance State from Server
  const fetchInitialData = async () => {
    try {
      // 1. Fetch Users
      const userRes = await fetch('/api/all-registered-users');
      if (userRes.ok) {
        const data = await userRes.json();
        if (data.users && Array.isArray(data.users)) {
          setServerUsers(data.users);
        }
      }
    } catch (e) {}

    try {
      // 2. Fetch Maintenance
      const maintRes = await fetch('/api/system-maintenance');
      if (maintRes.ok) {
        const data = await maintRes.json();
        if (data.maintenance) {
          setMaintenanceEnabled(data.maintenance.enabled || false);
          setMaintenanceTitle(data.maintenance.title || 'Scheduled System Upgrade');
          setMaintenanceMessage(data.maintenance.message || '');
          setMaintenanceEta(data.maintenance.eta || '15-30 mins');
          setMaintenanceImage(data.maintenance.image || '');
          setMaintenanceAuthor(data.maintenance.author || 'Master Admin');
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sync serverUsers if allUsers prop changes
  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      setServerUsers(allUsers);
    }
  }, [allUsers]);

  // Handle image upload via file reader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'notice' | 'maintenance') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size exceeds 3MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === 'notice') {
        setNoticeImageUrl(base64);
      } else {
        setMaintenanceImage(base64);
      }
      showToast('Image attached successfully!');
    };
    reader.readAsDataURL(file);
  };

  // Publish or send update notice broadcast
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      showToast('Please enter both a title and message');
      return;
    }

    if (targetAudience === 'specific' && !targetEmail.trim()) {
      showToast('Please select or specify a target user email for this personal notice');
      return;
    }

    setIsSendingNotice(true);

    const newNotice: SystemNoticeItem = {
      id: `NOTICE-${Date.now()}`,
      title: noticeTitle.trim(),
      message: noticeMessage.trim(),
      type: noticeType,
      targetAudience,
      targetEmail: targetAudience === 'specific' ? targetEmail.trim().toLowerCase() : undefined,
      targetName: targetAudience === 'specific' ? (targetName.trim() || targetEmail.split('@')[0]) : undefined,
      displayMode,
      priority,
      author: noticeAuthor.trim() || 'Master Admin',
      imageUrl: noticeImageUrl || undefined,
      image: noticeImageUrl || undefined,
      actionButton:
        hasActionButton && actionBtnText.trim()
          ? {
              text: actionBtnText.trim(),
              url: actionBtnUrl.trim() || undefined,
            }
          : undefined,
      active: true,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      readBy: [],
    };

    try {
      // 1. Send to server
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice: newNotice }),
      });

      if (!res.ok) {
        throw new Error('Server returned error while saving notice');
      }

      // 2. Update local state
      const updated = [newNotice, ...broadcasts.filter((b) => b.id !== newNotice.id)];
      setBroadcasts(updated);
      localStorage.setItem('codeflow_broadcasts', JSON.stringify(updated));
      window.dispatchEvent(new Event('codeflow_broadcasts_updated'));

      const audienceDesc =
        targetAudience === 'all'
          ? 'Broadcasted to ALL platform users'
          : `Sent personally to user ${targetEmail}`;

      showToast(`Notice "${newNotice.title}" published! (${audienceDesc})`);

      // Reset Form fields
      setNoticeTitle('');
      setNoticeMessage('');
      setNoticeImageUrl('');
      if (targetAudience === 'specific') {
        setTargetEmail('');
        setTargetName('');
      }
    } catch (err: any) {
      showToast(`Broadcast error: ${err.message}`);
    } finally {
      setIsSendingNotice(false);
    }
  };

  // Toggle Notice Active State
  const handleToggleBroadcastActive = async (id: string) => {
    try {
      const res = await fetch(`/api/broadcasts/${encodeURIComponent(id)}/toggle`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.broadcasts) {
          setBroadcasts(data.broadcasts);
          localStorage.setItem('codeflow_broadcasts', JSON.stringify(data.broadcasts));
          window.dispatchEvent(new Event('codeflow_broadcasts_updated'));
          showToast('Notice visibility status updated.');
          return;
        }
      }
    } catch (e) {}

    // Fallback local toggle
    const updated = broadcasts.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    setBroadcasts(updated);
    localStorage.setItem('codeflow_broadcasts', JSON.stringify(updated));
    window.dispatchEvent(new Event('codeflow_broadcasts_updated'));
    showToast('Notice visibility status updated.');
  };

  // Delete Notice
  const handleDeleteBroadcast = async (id: string) => {
    try {
      await fetch(`/api/broadcasts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    const updated = broadcasts.filter((b) => b.id !== id);
    setBroadcasts(updated);
    localStorage.setItem('codeflow_broadcasts', JSON.stringify(updated));
    window.dispatchEvent(new Event('codeflow_broadcasts_updated'));
    showToast('Notice removed successfully.');
  };

  // Save Maintenance Mode
  const handleToggleMaintenance = async (enableOverride?: boolean) => {
    const nextState = enableOverride !== undefined ? enableOverride : !maintenanceEnabled;
    setIsSavingMaintenance(true);

    try {
      const payload = {
        enabled: nextState,
        title: maintenanceTitle.trim(),
        message: maintenanceMessage.trim(),
        eta: maintenanceEta.trim(),
        image: maintenanceImage,
        author: maintenanceAuthor.trim(),
      };

      const res = await fetch('/api/system-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance: payload }),
      });

      if (res.ok) {
        setMaintenanceEnabled(nextState);
        showToast(
          nextState
            ? '🔴 Maintenance Mode Activated globally across all user sessions!'
            : '🟢 Maintenance Mode Deactivated. Full platform restored.'
        );
      }
    } catch (e: any) {
      showToast(`Maintenance toggle error: ${e.message}`);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  // Filtered list of registered users for target user picker
  const filteredUsers = serverUsers.filter((u) => {
    if (!userSearchTerm.trim()) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(term) ||
      u.name?.toLowerCase().includes(term) ||
      u.id?.toLowerCase().includes(term)
    );
  });

  // Filtered broadcast notices for the list table
  const displayedBroadcasts = broadcasts.filter((b) => {
    if (filterTab === 'active') return b.active;
    if (filterTab === 'broadcast') return !b.targetAudience || b.targetAudience === 'all';
    if (filterTab === 'personal') return b.targetAudience === 'specific';
    return true;
  });

  return (
    <div className="space-y-6 text-slate-100 font-sans animate-fade-in">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>Notice & User Update Control Center</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                Multi-Audience & Realtime
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Send global updates to all users or send personalized notices directly to an individual user.
            </p>
          </div>
        </div>

        {/* Global Maintenance Toggle */}
        <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-2xl border border-slate-800">
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-300">Maintenance Mode</p>
            <p className={`text-[10px] font-black ${maintenanceEnabled ? 'text-rose-400' : 'text-emerald-400'}`}>
              {maintenanceEnabled ? '🔴 ACTIVE DOWNTIME' : '🟢 PLATFORM LIVE'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleMaintenance()}
            disabled={isSavingMaintenance}
            className={`px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md ${
              maintenanceEnabled
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{maintenanceEnabled ? 'Turn OFF' : 'Turn ON'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Update Notice Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">Create & Dispatch Notice</h3>
            </div>
            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
              Real-Time Push Enabled
            </span>
          </div>

          <form onSubmit={handlePublishNotice} className="space-y-4">
            {/* Step 1: Target Audience Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Audience (কাদের কাছে যাবে)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {targetAudience === 'all' ? 'All active user sessions' : 'One specific user only'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetAudience('all')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition cursor-pointer ${
                    targetAudience === 'all'
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      targetAudience === 'all' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black">All Users (সকলকে)</p>
                    <p className="text-[10px] text-slate-400">Broadcast to all accounts</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetAudience('specific')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition cursor-pointer ${
                    targetAudience === 'specific'
                      ? 'bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border-purple-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      targetAudience === 'specific'
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black">Specific User (একক ইউজার)</p>
                    <p className="text-[10px] text-slate-400">Target individual account</p>
                  </div>
                </button>
              </div>

              {/* User Selection Dropdown / Input if Specific User */}
              {targetAudience === 'specific' && (
                <div className="pt-2 space-y-2 animate-fade-in border-t border-slate-800/80">
                  <label className="block text-xs font-bold text-purple-300">
                    Select or Enter User Email
                  </label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={targetEmail}
                          onChange={(e) => {
                            setTargetEmail(e.target.value);
                            setUserSearchTerm(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          placeholder="Type or select user email (e.g. user@codeflow.com)..."
                          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-purple-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
                      >
                        {showUserDropdown ? 'Close List' : 'Pick User'}
                      </button>
                    </div>

                    {/* Auto-suggest dropdown */}
                    {showUserDropdown && (
                      <div className="absolute top-full mt-1 left-0 right-0 z-30 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 space-y-1">
                        <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-800 flex justify-between">
                          <span>Registered Users ({filteredUsers.length})</span>
                          <span>Click to select</span>
                        </div>
                        {filteredUsers.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">No users found.</div>
                        ) : (
                          filteredUsers.map((u) => (
                            <button
                              key={u.id || u.email}
                              type="button"
                              onClick={() => {
                                setTargetEmail(u.email);
                                setTargetName(u.name || '');
                                setShowUserDropdown(false);
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-purple-950/60 transition cursor-pointer flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate">{u.name || 'User'}</p>
                                <p className="text-[11px] font-mono text-purple-300 truncate">{u.email}</p>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  u.status === 'Active'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : 'bg-amber-950 text-amber-400'
                                }`}
                              >
                                {u.status || 'Active'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Type & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notice Category</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-none font-medium"
                >
                  <option value="update">🚀 System / Feature Update</option>
                  <option value="notice">📢 Official Notice</option>
                  <option value="alert">⚠️ Urgent Alert</option>
                  <option value="maintenance">🛠️ Maintenance Notice</option>
                  <option value="offer">🎁 Bonus / Offer</option>
                  <option value="personal">✉️ Direct Admin Message</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Display Destination</label>
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-none font-medium"
                >
                  <option value="all">✨ Everywhere (Popup + Banner + Bell)</option>
                  <option value="popup">🪟 Interactive Popup Modal</option>
                  <option value="banner">🎚️ Top Dashboard Banner</option>
                  <option value="inbox">🔔 Notification Bell Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-none font-medium"
                >
                  <option value="normal">🟢 Normal Priority</option>
                  <option value="high">🟡 High Priority</option>
                  <option value="urgent">🔴 Urgent / Critical (Pulsing)</option>
                </select>
              </div>
            </div>

            {/* Author & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-300 mb-1">Author Name</label>
                <input
                  type="text"
                  value={noticeAuthor}
                  onChange={(e) => setNoticeAuthor(e.target.value)}
                  placeholder="e.g. Munna (Master Admin)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Notice Headline Title</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Important Carrier Route Update & Instant Otp Speed Increase"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Notice Detailed Message</label>
              <textarea
                required
                rows={3}
                value={noticeMessage}
                onChange={(e) => setNoticeMessage(e.target.value)}
                placeholder="Write the full message or instructions for the user..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none custom-sidebar-scrollbar"
              />
            </div>

            {/* Graphic Image Attachment (Upload or URL) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Attach Graphic Banner (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={noticeImageUrl}
                    onChange={(e) => setNoticeImageUrl(e.target.value)}
                    placeholder="Paste Image URL or choose file below..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>

                <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'notice')}
                    className="hidden"
                  />
                </label>

                {noticeImageUrl && (
                  <button
                    type="button"
                    onClick={() => setNoticeImageUrl('')}
                    className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs transition cursor-pointer"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Optional Call To Action Button */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasActionButton}
                  onChange={(e) => setHasActionButton(e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-200">
                  Add Interactive Call-To-Action (CTA) Button
                </span>
              </label>

              {hasActionButton && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Button Label</label>
                    <input
                      type="text"
                      value={actionBtnText}
                      onChange={(e) => setActionBtnText(e.target.value)}
                      placeholder="e.g. Join Telegram Group"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Link / URL</label>
                    <input
                      type="text"
                      value={actionBtnUrl}
                      onChange={(e) => setActionBtnUrl(e.target.value)}
                      placeholder="https://t.me/..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                {targetAudience === 'all'
                  ? '🌐 Will instantly broadcast to all users.'
                  : `👤 Will target: ${targetEmail || 'Select user above'}`}
              </span>

              <button
                type="submit"
                disabled={isSendingNotice}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                {isSendingNotice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish & Push Live</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live User View Preview Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-black text-white">Live User Experience Preview</h4>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode('popup')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    previewMode === 'popup' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Modal Popup
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('banner')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                    previewMode === 'banner' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Top Banner
                </button>
              </div>
            </div>

            {/* Preview Body */}
            {previewMode === 'popup' ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
                {/* Modal header stripe */}
                <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-cyan-500 to-blue-500 rounded-full" />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      {noticeType}
                    </span>
                    {targetAudience === 'specific' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        👤 Direct to User
                      </span>
                    )}
                    {priority === 'urgent' && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Just now</span>
                </div>

                <div>
                  <h5 className="text-sm font-black text-white leading-snug">
                    {noticeTitle || 'Your Notice Title Here'}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">By {noticeAuthor || 'Master Admin'}</p>
                </div>

                {noticeImageUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 max-h-36 flex items-center justify-center">
                    <img
                      src={noticeImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {noticeMessage || 'Detailed notice message text will appear here exactly as written.'}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {hasActionButton && (
                    <span className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                      {actionBtnText}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold ml-auto">
                    Got It, Understood
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Top Dashboard Bar</p>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase shrink-0">
                      {noticeType}
                    </span>
                    <p className="text-white font-bold truncate">
                      {noticeTitle || 'Important Update Headline'}
                    </p>
                  </div>
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Configuration Card */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-black text-white">Maintenance Screen Settings</h4>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  maintenanceEnabled ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {maintenanceEnabled ? 'Active' : 'Standby'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Headline</label>
                <input
                  type="text"
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Estimated Time (ETA)</label>
                <input
                  type="text"
                  value={maintenanceEta}
                  onChange={(e) => setMaintenanceEta(e.target.value)}
                  placeholder="e.g. 15-30 mins"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Message</label>
                <textarea
                  rows={2}
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500 custom-sidebar-scrollbar"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleMaintenance()}
                  disabled={isSavingMaintenance}
                  className={`w-full py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
                    maintenanceEnabled
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{maintenanceEnabled ? 'Turn Maintenance OFF' : 'Activate Maintenance Screen'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: EXISTING NOTICES & DIRECT USER NOTICES LIST */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Active & Dispatched Notices ({broadcasts.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage existing broadcasts and individual user notices in real time.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            {(['all', 'broadcast', 'personal', 'active'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  filterTab === tab
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'broadcast' ? 'Broadcasts (All)' : tab === 'personal' ? 'Personal (User)' : tab}
              </button>
            ))}
          </div>
        </div>

        {displayedBroadcasts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No notices match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedBroadcasts.map((b) => {
              const isSpecific = b.targetAudience === 'specific';
              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    b.active
                      ? isSpecific
                        ? 'bg-purple-950/20 border-purple-800/60'
                        : 'bg-slate-950/80 border-slate-800'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isSpecific ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{b.targetEmail}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>All Users</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase">
                          {b.type || 'Notice'}
                        </span>

                        {b.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                            Urgent
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-white text-sm leading-snug">{b.title}</h4>
                      <p className="text-[11px] text-slate-400">
                        Author: {b.author || 'Admin'} • {b.createdAt || 'Recent'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBroadcastActive(b.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          b.active
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                        title={b.active ? 'Active (Click to Hide)' : 'Inactive (Click to Activate)'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBroadcast(b.id)}
                        className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-400 text-xs transition cursor-pointer"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{b.message}</p>

                  {(b.imageUrl || b.image) && (
                    <div className="h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                      <img
                        src={b.imageUrl || b.image}
                        alt={b.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {b.actionButton?.text && (
                    <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <span>CTA: {b.actionButton.text}</span>
                      {b.actionButton.url && <span>→ {b.actionButton.url}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
