import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';

interface WelcomeNoticeBannerProps {
  darkMode?: boolean;
}

export const WelcomeNoticeBanner: React.FC<WelcomeNoticeBannerProps> = ({ darkMode = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('welcome_notice_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('welcome_notice_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-2.5 sm:top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
        >
          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-700/70 shadow-xl rounded-xl p-2.5 sm:p-3 text-white">
            <div className="flex items-center justify-between gap-2.5">
              {/* Official Logo & Clean English Text */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 p-0.5 shrink-0 border border-slate-700/80 shadow-sm flex items-center justify-center">
                  <img
                    src="/code_flow_logo.jpg"
                    alt="Code Flow"
                    className="w-full h-full object-contain rounded-md"
                  />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white tracking-tight truncate">
                      Code Flow SMS
                    </h4>
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      Official
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    Join our Telegram channel for live updates & news
                  </p>
                </div>
              </div>

              {/* Action Buttons: Join + Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="https://t.me/super_x_sms_s"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] active:scale-95 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  title="Join Official Telegram Channel (@super_x_sms_s)"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.55 3.93-1.64 4.74-1.93 5.27-1.94.12 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .37z"/>
                  </svg>
                  <span>Join</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-700/60"
                  title="Close"
                  aria-label="Close Notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
