import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  Sparkles,
  AlertTriangle,
  Info,
  Wrench,
  Gift,
  Mail,
  X,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Clock
} from 'lucide-react';

export interface SystemNoticeItem {
  id: string;
  title: string;
  message: string;
  type?: 'notice' | 'update' | 'maintenance' | 'feature' | 'alert' | 'personal' | 'offer' | string;
  targetAudience?: 'all' | 'specific';
  targetEmail?: string;
  targetName?: string;
  displayMode?: 'all' | 'banner' | 'popup' | 'inbox';
  priority?: 'normal' | 'high' | 'urgent';
  imageUrl?: string;
  image?: string;
  actionButton?: {
    text: string;
    url?: string;
    action?: string;
  };
  author?: string;
  active?: boolean;
  createdAt?: string;
  readBy?: string[];
}

interface UserNoticeModalProps {
  notices: SystemNoticeItem[];
  currentUserEmail?: string;
  darkMode?: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const UserNoticeModal: React.FC<UserNoticeModalProps> = ({
  notices,
  currentUserEmail = '',
  darkMode = true,
  onNavigateTab,
}) => {
  const [activeModalNotice, setActiveModalNotice] = useState<SystemNoticeItem | null>(null);

  useEffect(() => {
    if (!notices || notices.length === 0) {
      setActiveModalNotice(null);
      return;
    }

    const lowerEmail = (currentUserEmail || '').toLowerCase().trim();

    // Find the latest active notice that applies to this user and should popup
    const eligibleNotice = notices.find((n) => {
      if (!n.active) return false;

      // Check target audience
      if (n.targetAudience === 'specific' && n.targetEmail) {
        if (n.targetEmail.toLowerCase().trim() !== lowerEmail) {
          return false;
        }
      }

      // Check display mode or priority
      const isPopupRequested =
        !n.displayMode ||
        n.displayMode === 'popup' ||
        n.displayMode === 'all' ||
        n.priority === 'urgent' ||
        n.priority === 'high' ||
        n.targetAudience === 'specific'; // personal messages should always popup

      if (!isPopupRequested) return false;

      // Check if already dismissed locally
      const dismissedKey = `codeflow_dismissed_popup_${n.id}_${lowerEmail || 'anon'}`;
      if (localStorage.getItem(dismissedKey) === 'true') {
        return false;
      }

      // Check if read by this user on server
      if (lowerEmail && Array.isArray(n.readBy) && n.readBy.includes(lowerEmail)) {
        return false;
      }

      return true;
    });

    setActiveModalNotice(eligibleNotice || null);
  }, [notices, currentUserEmail]);

  const handleDismiss = async (noticeId: string) => {
    const lowerEmail = (currentUserEmail || '').toLowerCase().trim();
    const dismissedKey = `codeflow_dismissed_popup_${noticeId}_${lowerEmail || 'anon'}`;
    localStorage.setItem(dismissedKey, 'true');

    // Notify server of dismissal if user is logged in
    if (lowerEmail) {
      try {
        fetch(`/api/broadcasts/${encodeURIComponent(noticeId)}/dismiss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: lowerEmail }),
        }).catch(() => {});
      } catch (e) {}
    }

    setActiveModalNotice(null);
  };

  if (!activeModalNotice) return null;

  const noticeImg = activeModalNotice.imageUrl || activeModalNotice.image;
  const isPersonal = activeModalNotice.targetAudience === 'specific';
  const isUrgent = activeModalNotice.priority === 'urgent';
  const isHigh = activeModalNotice.priority === 'high';

  const getTypeTheme = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'update':
      case 'feature':
        return {
          icon: <Sparkles className="w-5 h-5" />,
          badge: 'System Update & Features',
          gradient: 'from-cyan-600 to-blue-600',
          bgLight: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          accent: 'text-cyan-400',
        };
      case 'urgent':
      case 'alert':
        return {
          icon: <ShieldAlert className="w-5 h-5" />,
          badge: 'Important Security Alert',
          gradient: 'from-rose-600 to-red-700',
          bgLight: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          accent: 'text-rose-400',
        };
      case 'maintenance':
        return {
          icon: <Wrench className="w-5 h-5" />,
          badge: 'Maintenance Notice',
          gradient: 'from-amber-600 to-orange-600',
          bgLight: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          accent: 'text-amber-400',
        };
      case 'offer':
        return {
          icon: <Gift className="w-5 h-5" />,
          badge: 'Special Offer & Bonus',
          gradient: 'from-emerald-600 to-teal-600',
          bgLight: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          accent: 'text-emerald-400',
        };
      case 'personal':
        return {
          icon: <Mail className="w-5 h-5" />,
          badge: 'Direct Admin Message',
          gradient: 'from-purple-600 to-indigo-600',
          bgLight: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          accent: 'text-purple-400',
        };
      default:
        return {
          icon: <Megaphone className="w-5 h-5" />,
          badge: 'Official Platform Notice',
          gradient: 'from-blue-600 to-indigo-600',
          bgLight: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          accent: 'text-blue-400',
        };
    }
  };

  const theme = getTypeTheme(activeModalNotice.type);

  return (
    <AnimatePresence>
      <div
        id="user-notice-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/90 shadow-2xl shadow-black/80 overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Top Decorative Header Accent */}
          <div className={`h-2 w-full bg-gradient-to-r ${theme.gradient}`} />

          {/* Close Button Top Right */}
          <button
            type="button"
            onClick={() => handleDismiss(activeModalNotice.id)}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer z-10"
            title="Close Notice"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 sm:p-7 overflow-y-auto space-y-4">
            {/* Badges Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${theme.bgLight}`}
              >
                {theme.icon}
                <span>{theme.badge}</span>
              </span>

              {isPersonal && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <Mail className="w-3 h-3" />
                  <span>Personal to You</span>
                </span>
              )}

              {isUrgent && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Urgent</span>
                </span>
              )}
            </div>

            {/* Notice Title */}
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                {activeModalNotice.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-medium">
                <span>By {activeModalNotice.author || 'Master Admin'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activeModalNotice.createdAt || 'Recent'}
                </span>
              </div>
            </div>

            {/* Optional Banner Graphic */}
            {noticeImg && (
              <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 max-h-56 flex items-center justify-center shadow-inner">
                <img
                  src={noticeImg}
                  alt={activeModalNotice.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Message Body */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-line font-normal">
              {activeModalNotice.message}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {activeModalNotice.actionButton?.text && activeModalNotice.actionButton?.url ? (
                <a
                  href={activeModalNotice.actionButton.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <span>{activeModalNotice.actionButton.text}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => handleDismiss(activeModalNotice.id)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Got It, Understood</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
