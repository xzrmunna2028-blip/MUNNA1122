import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Zap,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Phone,
  Radio,
  Server,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { RealSmsLog, RentedNumber } from '../types.js';
import { dispatchIncomingOtp, getRealSmsLogs } from '../utils/realtimeSmsService.js';

interface OtpSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Starting mode: can start on a specific number (Level 1) or directly on an OTP log (Level 2)
  initialNumber?: RentedNumber | null;
  initialLog?: RealSmsLog | null;
}

export const OtpSessionModal: React.FC<OtpSessionModalProps> = ({
  isOpen,
  onClose,
  initialNumber,
  initialLog,
}) => {
  // Session level: 1 = Number Session, 2 = Deep OTP Inspector Session
  const [sessionLevel, setSessionLevel] = useState<1 | 2>(initialLog ? 2 : 1);
  const [selectedNumber, setSelectedNumber] = useState<RentedNumber | null>(initialNumber || null);
  const [selectedLog, setSelectedLog] = useState<RealSmsLog | null>(initialLog || null);
  const [numberLogs, setNumberLogs] = useState<RealSmsLog[]>([]);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedNum, setCopiedNum] = useState(false);
  const [isReceivingOtp, setIsReceivingOtp] = useState(false);

  // Sync state whenever props change
  useEffect(() => {
    if (initialLog) {
      setSelectedLog(initialLog);
      setSessionLevel(2);
    } else if (initialNumber) {
      setSelectedNumber(initialNumber);
      setSessionLevel(1);
    }
  }, [initialNumber, initialLog, isOpen]);

  // Load logs for the selected number
  const refreshNumberLogs = () => {
    const allLogs = getRealSmsLogs();
    if (selectedNumber && selectedNumber.number) {
      const cleanTarget = (selectedNumber.number || '').replace(/\s+/g, '');
      const filtered = allLogs.filter((l) => {
        const cleanLogNum = (l?.number || '').replace(/\s+/g, '');
        return cleanLogNum === cleanTarget || (cleanTarget && cleanLogNum.includes(cleanTarget)) || (cleanLogNum && cleanTarget.includes(cleanLogNum));
      });
      setNumberLogs(filtered);
    } else if (selectedLog && selectedLog.number) {
      const cleanTarget = (selectedLog.number || '').replace(/\s+/g, '');
      const filtered = allLogs.filter((l) => {
        const cleanLogNum = (l?.number || '').replace(/\s+/g, '');
        return cleanLogNum === cleanTarget || (cleanTarget && cleanLogNum.includes(cleanTarget)) || (cleanLogNum && cleanTarget.includes(cleanLogNum));
      });
      setNumberLogs(filtered);
    } else {
      setNumberLogs(allLogs.slice(0, 20));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshNumberLogs();

    const handleUpdate = () => {
      refreshNumberLogs();
      // If we are inspecting a log, see if it was updated
      if (selectedLog) {
        const allLogs = getRealSmsLogs();
        const found = allLogs.find((l) => l.id === selectedLog.id);
        if (found) setSelectedLog(found);
      }
    };

    window.addEventListener('real_sms_updated', handleUpdate);
    return () => {
      window.removeEventListener('real_sms_updated', handleUpdate);
    };
  }, [isOpen, selectedNumber, selectedLog]);

  if (!isOpen) return null;

  // Handle trigger live OTP on this number via real-time Python IPRN sync
  const handleTriggerLiveOtp = async () => {
    setIsReceivingOtp(true);
    try {
      const res = await fetch('/api/trigger-sync', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.active_sms_logs && json.data.active_sms_logs.length > 0) {
          const latestLog = json.data.active_sms_logs[0];
          localStorage.setItem('real_sms_logs', JSON.stringify(json.data.active_sms_logs));
          window.dispatchEvent(new Event('real_sms_updated'));
          setSelectedLog(latestLog);
          setSessionLevel(2);
          setIsReceivingOtp(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Live API sync trigger error:', e);
    }

    const newLog = dispatchIncomingOtp({
      targetNumber: selectedNumber?.number || selectedLog?.number,
      targetRoute: selectedNumber?.range || selectedLog?.termination,
    });
    setIsReceivingOtp(false);
    setSelectedLog(newLog);
    setSessionLevel(2);
  };

  // Copy helpers
  const handleCopyOtp = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleCopyText = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyNumber = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const currentNumberStr = selectedNumber?.number || selectedLog?.number || 'Active Session';
  const currentRouteStr = selectedNumber?.range || selectedLog?.termination || 'Global A2P Route';

  const deliveredCount = numberLogs.filter((l) => l.status === 'DELIVERED').length;
  const failedCount = numberLogs.filter((l) => l.status === 'FAILED').length;
  const totalCount = numberLogs.length;
  const successRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            {sessionLevel === 2 && (
              <button
                onClick={() => setSessionLevel(1)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Back to Number Session"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-ping" />
                <h3 className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{sessionLevel === 1 ? 'Number Session (নম্বর সেশন)' : 'Deep OTP Inspector (ওটিপি সেশন)'}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-lime-500/15 text-lime-600 dark:text-lime-400 border border-lime-500/30">
                    Live Active
                  </span>
                </h3>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                {currentNumberStr} · {currentRouteStr}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-sidebar-scrollbar">
          
          {/* ========================================================================= */}
          {/* SESSION LEVEL 1: NUMBER & ROUTE SESSION                                  */}
          {/* ========================================================================= */}
          {sessionLevel === 1 && (
            <div className="space-y-5 animate-fade-in">
              {/* Number Card Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">
                      CONNECTED NUMBER
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5 flex items-center gap-3">
                      <span>{currentNumberStr}</span>
                      <button
                        onClick={() => handleCopyNumber(currentNumberStr)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs"
                        title="Copy Number"
                      >
                        {copiedNum ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {currentRouteStr} · Rate: <span className="text-lime-400 font-bold">{selectedNumber?.cost || (selectedNumber as any)?.rate || '0.0096 USD'}</span>
                    </p>
                  </div>

                  {/* Primary Trigger Live OTP Button */}
                  <button
                    onClick={handleTriggerLiveOtp}
                    disabled={isReceivingOtp}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#65a30d] hover:bg-[#54870a] text-white font-black text-xs tracking-wide uppercase transition-all shadow-md shadow-lime-950/40 cursor-pointer active:scale-95 disabled:opacity-75"
                  >
                    <Zap className={`w-4 h-4 ${isReceivingOtp ? 'animate-spin text-amber-300' : 'fill-white'}`} />
                    <span>{isReceivingOtp ? 'Receiving OTP...' : 'Receive Live OTP Now (ওটিপি রিসিভ করুন)'}</span>
                  </button>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-slate-800/80">
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total OTPs</span>
                    <span className="text-lg font-black text-white">{totalCount}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Delivered</span>
                    <span className="text-lg font-black text-emerald-300">{deliveredCount}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Success Rate</span>
                    <span className="text-lg font-black text-amber-300">{successRate}%</span>
                  </div>
                </div>
              </div>

              {/* Received OTPs Feed Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#65a30d]" />
                    <span>Received OTP Messages ({numberLogs.length})</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">
                    Tap any message to open detailed OTP session
                  </span>
                </div>

                {numberLogs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      No OTPs received on this number yet.
                    </p>
                    <button
                      onClick={handleTriggerLiveOtp}
                      className="px-4 py-2 bg-[#65a30d] text-white rounded-xl text-xs font-bold hover:bg-[#54870a] transition cursor-pointer"
                    >
                      Receive First Test OTP Now
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-xs">
                    {numberLogs.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => {
                          setSelectedLog(log);
                          setSessionLevel(2);
                        }}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-850/60 transition cursor-pointer flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                              {log.sid || log.brand || 'Service'}
                            </span>

                            {log.otp && (
                              <span className="px-3 py-0.5 rounded-lg text-xs font-black font-mono tracking-widest bg-lime-500/15 text-lime-700 dark:text-lime-300 border border-lime-500/40">
                                OTP: {log.otp}
                              </span>
                            )}

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              log.status === 'DELIVERED'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              {log.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                            {log.text}
                          </p>

                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-1 text-xs font-black text-[#65a30d] group-hover:translate-x-0.5 transition-transform pt-1">
                          <span className="hidden sm:inline">Inspect</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SESSION LEVEL 2: DEEP OTP INSPECTOR SESSION                               */}
          {/* ========================================================================= */}
          {sessionLevel === 2 && selectedLog && (
            <div className="space-y-5 animate-fade-in">
              
              {/* BIG HERO OTP DISPLAY BOX */}
              {selectedLog.otp ? (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-lime-950/80 via-slate-900 to-slate-950 border-2 border-lime-500/50 shadow-xl text-center space-y-3 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-lime-500/20 text-lime-400 border border-lime-500/40 animate-pulse">
                      Extracted OTP
                    </span>
                  </div>

                  <span className="text-xs font-extrabold uppercase tracking-widest text-lime-400 block">
                    {selectedLog.sid || selectedLog.brand || 'Service'} VERIFICATION CODE
                  </span>

                  {/* Gigantic Spaced OTP Digits */}
                  <div className="py-2">
                    <div className="inline-block px-6 py-3 rounded-2xl bg-black/60 border border-lime-500/40 text-3xl sm:text-5xl font-black font-mono tracking-[0.25em] sm:tracking-[0.35em] text-white select-all shadow-inner">
                      {selectedLog.otp}
                    </div>
                  </div>

                  {/* Instant 1-Click Copy OTP Button */}
                  <div className="pt-1 flex items-center justify-center">
                    <button
                      onClick={() => handleCopyOtp(selectedLog.otp || '')}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#65a30d] hover:bg-[#54870a] text-white font-black text-sm transition shadow-lg shadow-lime-950/50 cursor-pointer active:scale-95"
                    >
                      {copiedOtp ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>OTP Copied! (কপি সম্পন্ন)</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy OTP Code (ওটিপি কপি করুন)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-black text-rose-800 dark:text-rose-300">
                    Delivery Failed
                  </h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto">
                    {selectedLog.text}
                  </p>
                </div>
              )}

              {/* RAW SMS TEXT BOX */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Full SMS Payload Text
                  </span>
                  <button
                    onClick={() => handleCopyText(selectedLog.text)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-lime-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-mono select-all">
                  {selectedLog.text}
                </div>
              </div>

              {/* TELEMETRY METADATA GRID */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Carrier Route & Telemetry
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SENDER ID (SID)</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{selectedLog.sid || selectedLog.brand || 'Service'}</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RECIPIENT NUMBER</span>
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-lime-500" />
                      <span>{selectedLog.number}</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CARRIER TERMINATION</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-amber-500" />
                      <span>{selectedLog.termination}</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DELIVERY STATUS</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{selectedLog.status} (HTTP 200 DELIVRD)</span>
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIMESTAMP & HANDSHAKE</span>
                    <span className="text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(selectedLog.timestamp).toISOString()} ({new Date(selectedLog.timestamp).toLocaleTimeString()})</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => setSessionLevel(1)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ← Back to Number List
                </button>

                <button
                  onClick={handleTriggerLiveOtp}
                  disabled={isReceivingOtp}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#65a30d] hover:bg-[#54870a] text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Receive Another OTP on this Number</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
