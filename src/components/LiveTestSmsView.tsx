import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Trash2, 
  Download, 
  Search, 
  Layers, 
  Mail, 
  Radio, 
  Plus, 
  Check,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
  EyeOff,
  Clipboard,
  Zap,
  RefreshCw
} from 'lucide-react';

interface SmsLog {
  id?: string;
  timestamp: string;
  status: 'DELIVERED' | 'FAILED';
  termination: string;
  number: string;
  sid: string;
  cost?: string;
  text: string;
  otp?: string;
}

interface CountryData {
  name: string;
  code: string;
  emoji: string;
}

const prefixToCountryMap: { [key: string]: CountryData } = {
  '1': { name: 'United States', code: 'US', emoji: '🇺🇸' },
  '77': { name: 'Kazakhstan', code: 'KZ', emoji: '🇰🇿' },
  '76': { name: 'Kazakhstan', code: 'KZ', emoji: '🇰🇿' },
  '70': { name: 'Kazakhstan', code: 'KZ', emoji: '🇰🇿' },
  '74': { name: 'Kazakhstan', code: 'KZ', emoji: '🇰🇿' },
  '78': { name: 'Kazakhstan', code: 'KZ', emoji: '🇰🇿' },
  '7': { name: 'Russia', code: 'RU', emoji: '🇷🇺' },
  '20': { name: 'Egypt', code: 'EG', emoji: '🇪🇬' },
  '27': { name: 'South Africa', code: 'ZA', emoji: '🇿🇦' },
  '30': { name: 'Greece', code: 'GR', emoji: '🇬🇷' },
  '31': { name: 'Netherlands', code: 'NL', emoji: '🇳🇱' },
  '32': { name: 'Belgium', code: 'BE', emoji: '🇧🇪' },
  '33': { name: 'France', code: 'FR', emoji: '🇫🇷' },
  '34': { name: 'Spain', code: 'ES', emoji: '🇪🇸' },
  '36': { name: 'Hungary', code: 'HU', emoji: '🇭🇺' },
  '39': { name: 'Italy', code: 'IT', emoji: '🇮🇹' },
  '40': { name: 'Romania', code: 'RO', emoji: '🇷🇴' },
  '41': { name: 'Switzerland', code: 'CH', emoji: '🇨🇭' },
  '43': { name: 'Austria', code: 'AT', emoji: '🇦🇹' },
  '44': { name: 'United Kingdom', code: 'GB', emoji: '🇬🇧' },
  '45': { name: 'Denmark', code: 'DK', emoji: '🇩🇰' },
  '46': { name: 'Sweden', code: 'SE', emoji: '🇸🇪' },
  '47': { name: 'Norway', code: 'NO', emoji: '🇳🇴' },
  '48': { name: 'Poland', code: 'PL', emoji: '🇵🇱' },
  '49': { name: 'Germany', code: 'DE', emoji: '🇩🇪' },
  '51': { name: 'Peru', code: 'PE', emoji: '🇵🇪' },
  '52': { name: 'Mexico', code: 'MX', emoji: '🇲🇽' },
  '53': { name: 'Cuba', code: 'CU', emoji: '🇨🇺' },
  '54': { name: 'Argentina', code: 'AR', emoji: '🇦🇷' },
  '55': { name: 'Brazil', code: 'BR', emoji: '🇧🇷' },
  '56': { name: 'Chile', code: 'CL', emoji: '🇨🇱' },
  '57': { name: 'Colombia', code: 'CO', emoji: '🇨🇴' },
  '58': { name: 'Venezuela', code: 'VE', emoji: '🇻🇪' },
  '60': { name: 'Malaysia', code: 'MY', emoji: '🇲🇾' },
  '61': { name: 'Australia', code: 'AU', emoji: '🇦🇺' },
  '62': { name: 'Indonesia', code: 'ID', emoji: '🇮🇩' },
  '63': { name: 'Philippines', code: 'PH', emoji: '🇵🇭' },
  '64': { name: 'New Zealand', code: 'NZ', emoji: '🇳🇿' },
  '65': { name: 'Singapore', code: 'SG', emoji: '🇸🇬' },
  '66': { name: 'Thailand', code: 'TH', emoji: '🇹🇭' },
  '81': { name: 'Japan', code: 'JP', emoji: '🇯🇵' },
  '82': { name: 'South Korea', code: 'KR', emoji: '🇰🇷' },
  '84': { name: 'Vietnam', code: 'VN', emoji: '🇻🇳' },
  '86': { name: 'China', code: 'CN', emoji: '🇨🇳' },
  '90': { name: 'Turkey', code: 'TR', emoji: '🇹🇷' },
  '91': { name: 'India', code: 'IN', emoji: '🇮🇳' },
  '92': { name: 'Pakistan', code: 'PK', emoji: '🇵🇰' },
  '93': { name: 'Afghanistan', code: 'AF', emoji: '🇦🇫' },
  '94': { name: 'Sri Lanka', code: 'LK', emoji: '🇱🇰' },
  '95': { name: 'Myanmar', code: 'MM', emoji: '🇲🇲' },
  '98': { name: 'Iran', code: 'IR', emoji: '🇮🇷' },
  '212': { name: 'Morocco', code: 'MA', emoji: '🇲🇦' },
  '213': { name: 'Algeria', code: 'DZ', emoji: '🇩🇿' },
  '216': { name: 'Tunisia', code: 'TN', emoji: '🇹🇳' },
  '218': { name: 'Libya', code: 'LY', emoji: '🇱🇾' },
  '220': { name: 'Gambia', code: 'GM', emoji: '🇬🇲' },
  '221': { name: 'Senegal', code: 'SN', emoji: '🇸🇳' },
  '222': { name: 'Mauritania', code: 'MR', emoji: '🇲🇷' },
  '223': { name: 'Mali', code: 'ML', emoji: '🇲🇱' },
  '224': { name: 'Guinea', code: 'GN', emoji: '🇬🇳' },
  '225': { name: 'Ivory Coast', code: 'CI', emoji: '🇨🇮' },
  '226': { name: 'Burkina Faso', code: 'BF', emoji: '🇧🇫' },
  '227': { name: 'Niger', code: 'NE', emoji: '🇳🇪' },
  '228': { name: 'Togo', code: 'TG', emoji: '🇹🇬' },
  '229': { name: 'Benin', code: 'BJ', emoji: '🇧🇯' },
  '230': { name: 'Mauritius', code: 'MU', emoji: '🇲🇺' },
  '231': { name: 'Liberia', code: 'LR', emoji: '🇱🇷' },
  '232': { name: 'Sierra Leone', code: 'SL', emoji: '🇸🇱' },
  '233': { name: 'Ghana', code: 'GH', emoji: '🇬🇭' },
  '234': { name: 'Nigeria', code: 'NG', emoji: '🇳🇬' },
  '240': { name: 'Equatorial Guinea', code: 'GQ', emoji: '🇬🇶' },
  '241': { name: 'Gabon', code: 'GA', emoji: '🇬🇦' },
  '242': { name: 'Congo', code: 'CG', emoji: '🇨🇬' },
  '243': { name: 'DR Congo', code: 'CD', emoji: '🇨🇩' },
  '244': { name: 'Angola', code: 'AO', emoji: '🇦🇴' },
  '249': { name: 'Sudan', code: 'SD', emoji: '🇸🇩' },
  '251': { name: 'Ethiopia', code: 'ET', emoji: '🇪🇹' },
  '252': { name: 'Somalia', code: 'SO', emoji: '🇸🇴' },
  '253': { name: 'Djibouti', code: 'DJ', emoji: '🇩🇯' },
  '254': { name: 'Kenya', code: 'KE', emoji: '🇰🇪' },
  '255': { name: 'Tanzania', code: 'TZ', emoji: '🇹🇿' },
  '256': { name: 'Uganda', code: 'UG', emoji: '🇺🇬' },
  '257': { name: 'Burundi', code: 'BI', emoji: '🇧🇮' },
  '258': { name: 'Mozambique', code: 'MZ', emoji: '🇲🇿' },
  '260': { name: 'Zambia', code: 'ZM', emoji: '🇿🇲' },
  '261': { name: 'Madagascar', code: 'MG', emoji: '🇲🇬' },
  '263': { name: 'Zimbabwe', code: 'ZW', emoji: '🇿🇼' },
  '264': { name: 'Namibia', code: 'NA', emoji: '🇳🇦' },
  '351': { name: 'Portugal', code: 'PT', emoji: '🇵🇹' },
  '352': { name: 'Luxembourg', code: 'LU', emoji: '🇱🇺' },
  '353': { name: 'Ireland', code: 'IE', emoji: '🇮🇪' },
  '354': { name: 'Iceland', code: 'IS', emoji: '🇮🇸' },
  '355': { name: 'Albania', code: 'AL', emoji: '🇦🇱' },
  '356': { name: 'Malta', code: 'MT', emoji: '🇲🇹' },
  '357': { name: 'Cyprus', code: 'CY', emoji: '🇨🇾' },
  '358': { name: 'Finland', code: 'FI', emoji: '🇫🇮' },
  '359': { name: 'Bulgaria', code: 'BG', emoji: '🇧🇬' },
  '370': { name: 'Lithuania', code: 'LT', emoji: '🇱🇹' },
  '371': { name: 'Latvia', code: 'LV', emoji: '🇱🇻' },
  '372': { name: 'Estonia', code: 'EE', emoji: '🇪🇪' },
  '373': { name: 'Moldova', code: 'MD', emoji: '🇲🇩' },
  '374': { name: 'Armenia', code: 'AM', emoji: '🇦🇲' },
  '375': { name: 'Belarus', code: 'BY', emoji: '🇧🇾' },
  '376': { name: 'Andorra', code: 'AD', emoji: '🇦🇩' },
  '377': { name: 'Monaco', code: 'MC', emoji: '🇲🇨' },
  '378': { name: 'San Marino', code: 'SM', emoji: '🇸🇲' },
  '380': { name: 'Ukraine', code: 'UA', emoji: '🇺🇦' },
  '381': { name: 'Serbia', code: 'RS', emoji: '🇷🇸' },
  '382': { name: 'Montenegro', code: 'ME', emoji: '🇲🇪' },
  '385': { name: 'Croatia', code: 'HR', emoji: '🇭🇷' },
  '386': { name: 'Slovenia', code: 'SI', emoji: '🇸🇮' },
  '387': { name: 'Bosnia', code: 'BA', emoji: '🇧🇦' },
  '389': { name: 'North Macedonia', code: 'MK', emoji: '🇲🇰' },
  '420': { name: 'Czech Republic', code: 'CZ', emoji: '🇨🇿' },
  '421': { name: 'Slovakia', code: 'SK', emoji: '🇸🇰' },
  '423': { name: 'Liechtenstein', code: 'LI', emoji: '🇱🇮' },
  '501': { name: 'Belize', code: 'BZ', emoji: '🇧🇿' },
  '502': { name: 'Guatemala', code: 'GT', emoji: '🇬🇹' },
  '503': { name: 'El Salvador', code: 'SV', emoji: '🇸🇻' },
  '504': { name: 'Honduras', code: 'HN', emoji: '🇭🇳' },
  '505': { name: 'Nicaragua', code: 'NI', emoji: '🇳🇮' },
  '506': { name: 'Costa Rica', code: 'CR', emoji: '🇨🇷' },
  '507': { name: 'Panama', code: 'PA', emoji: '🇵🇦' },
  '509': { name: 'Haiti', code: 'HT', emoji: '🇭🇹' },
  '590': { name: 'Guadeloupe', code: 'GP', emoji: '🇬🇵' },
  '591': { name: 'Bolivia', code: 'BO', emoji: '🇧🇴' },
  '592': { name: 'Guyana', code: 'GY', emoji: '🇬🇾' },
  '593': { name: 'Ecuador', code: 'EC', emoji: '🇪🇨' },
  '595': { name: 'Paraguay', code: 'PY', emoji: '🇵🇾' },
  '597': { name: 'Suriname', code: 'SR', emoji: '🇸🇷' },
  '598': { name: 'Uruguay', code: 'UY', emoji: '🇺🇾' },
  '852': { name: 'Hong Kong', code: 'HK', emoji: '🇭🇰' },
  '853': { name: 'Macau', code: 'MO', emoji: '🇲🇴' },
  '855': { name: 'Cambodia', code: 'KH', emoji: '🇰🇭' },
  '856': { name: 'Laos', code: 'LA', emoji: '🇱🇦' },
  '880': { name: 'Bangladesh', code: 'BD', emoji: '🇧🇩' },
  '886': { name: 'Taiwan', code: 'TW', emoji: '🇹🇼' },
  '960': { name: 'Maldives', code: 'MV', emoji: '🇲🇻' },
  '961': { name: 'Lebanon', code: 'LB', emoji: '🇱🇧' },
  '962': { name: 'Jordan', code: 'JO', emoji: '🇯🇴' },
  '963': { name: 'Syria', code: 'SY', emoji: '🇸🇾' },
  '964': { name: 'Iraq', code: 'IQ', emoji: '🇮🇶' },
  '965': { name: 'Kuwait', code: 'KW', emoji: '🇰🇼' },
  '966': { name: 'Saudi Arabia', code: 'SA', emoji: '🇸🇦' },
  '967': { name: 'Yemen', code: 'YE', emoji: '🇾🇪' },
  '968': { name: 'Oman', code: 'OM', emoji: '🇴🇲' },
  '971': { name: 'United Arab Emirates', code: 'AE', emoji: '🇦🇪' },
  '972': { name: 'Israel', code: 'IL', emoji: '🇮🇱' },
  '973': { name: 'Bahrain', code: 'BH', emoji: '🇧🇭' },
  '974': { name: 'Qatar', code: 'QA', emoji: '🇶🇦' },
  '975': { name: 'Bhutan', code: 'BT', emoji: '🇧🇹' },
  '976': { name: 'Mongolia', code: 'MN', emoji: '🇲🇳' },
  '977': { name: 'Nepal', code: 'NP', emoji: '🇳🇵' },
  '992': { name: 'Tajikistan', code: 'TJ', emoji: '🇹🇯' },
  '993': { name: 'Turkmenistan', code: 'TM', emoji: '🇹🇲' },
  '994': { name: 'Azerbaijan', code: 'AZ', emoji: '🇦🇿' },
  '995': { name: 'Georgia', code: 'GE', emoji: '🇬🇪' },
  '996': { name: 'Kyrgyzstan', code: 'KG', emoji: '🇰🇬' },
  '998': { name: 'Uzbekistan', code: 'UZ', emoji: '🇺🇿' }
};

const getCountryInfoByPhone = (phone: string, fallbackTermination?: string) => {
  const cleanPhone = (phone || '').replace(/^\+/, '').trim();
  
  // 1. Check phone number prefix matching (longest prefix first)
  for (let len = 4; len >= 1; len--) {
    if (cleanPhone.length >= len) {
      const sub = cleanPhone.substring(0, len);
      if (prefixToCountryMap[sub]) {
        return prefixToCountryMap[sub];
      }
    }
  }

  // 2. Match country name in fallbackTermination strictly
  if (fallbackTermination) {
    const cleanTerm = fallbackTermination.toLowerCase();
    const sortedCountries = Object.values(prefixToCountryMap).sort((a, b) => b.name.length - a.name.length);
    for (const data of sortedCountries) {
      if (cleanTerm.includes(data.name.toLowerCase())) {
        return data;
      }
    }

    // 3. Match country code/prefix from digits in fallbackTermination
    const m = cleanTerm.match(/\+?(\d{1,4})/);
    if (m) {
      const matchPrefix = m[1];
      for (let len = 4; len >= 1; len--) {
        if (matchPrefix.length >= len) {
          const sub = matchPrefix.substring(0, len);
          if (prefixToCountryMap[sub]) {
            return prefixToCountryMap[sub];
          }
        }
      }
    }
  }

  return { name: fallbackTermination || 'Global Route', code: 'GL', emoji: '🌐' };
};

const maskPhoneWithAreaCodeAndThreeDigits = (phone: string, fallbackTermination?: string): string => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/^\+/, '').trim();
  
  // Find the country prefix
  let matchedPrefix = '';
  for (let len = 4; len >= 1; len--) {
    if (cleanPhone.length >= len) {
      const sub = cleanPhone.substring(0, len);
      if (prefixToCountryMap[sub]) {
        matchedPrefix = sub;
        break;
      }
    }
  }

  // If we couldn't find prefix directly from phone, try finding it using fallbackTermination or a generic regex
  if (!matchedPrefix && fallbackTermination) {
    const cleanTerm = fallbackTermination.toLowerCase();
    for (const prefix of Object.keys(prefixToCountryMap)) {
      const data = prefixToCountryMap[prefix];
      if (
        cleanTerm.includes(data.name.toLowerCase()) || 
        cleanTerm.includes(prefix) || 
        cleanTerm.includes(data.code.toLowerCase())
      ) {
        matchedPrefix = prefix;
        break;
      }
    }
  }

  if (!matchedPrefix) {
    const m = (fallbackTermination || '').match(/\+?(\d+)/);
    if (m) {
      const matchPrefix = m[1];
      for (let len = 4; len >= 1; len--) {
        if (matchPrefix.length >= len) {
          const sub = matchPrefix.substring(0, len);
          if (prefixToCountryMap[sub]) {
            matchedPrefix = sub;
            break;
          }
        }
      }
    }
  }

  // If we still don't have a matched prefix, let's assume first 3 digits as prefix or just show first 5 characters
  if (!matchedPrefix) {
    if (cleanPhone.length > 6) {
      return cleanPhone.substring(0, 6) + 'x'.repeat(cleanPhone.length - 6);
    }
    return cleanPhone;
  }

  const prefixLen = matchedPrefix.length;
  // We want to show: area code (prefix) + 3 numbers (next 3 digits), rest hidden with x's
  const visibleLen = prefixLen + 3;
  if (cleanPhone.length <= visibleLen) {
    return cleanPhone;
  }

  const visiblePart = cleanPhone.substring(0, visibleLen);
  const hiddenPart = 'x'.repeat(cleanPhone.length - visibleLen);
  return visiblePart + hiddenPart;
};

export const LiveTestSmsView: React.FC = () => {
  // Live controls
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedPanel, setSelectedPanel] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [alwaysRevealOtps, setAlwaysRevealOtps] = useState(true);

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('iprn_api_key') || '');
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => localStorage.getItem('iprn_api_key') || '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [liveLogs, setLiveLogs] = useState<SmsLog[]>(() => {
    try {
      const saved = localStorage.getItem('real_sms_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((log: any) => log && typeof log === 'object');
        }
      }
      return [];
    } catch {
      return [];
    }
  });
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic real-time counters
  const [totalMessagesStat, setTotalMessagesStat] = useState<number>(() => {
    try {
      const val = localStorage.getItem('total_messages_stat');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [rangesStat, setRangesStat] = useState<number>(() => {
    try {
      const val = localStorage.getItem('ranges_stat');
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  });

  const prevFirstIdRef = useRef<string>('');

  // Fetch active server API key on mount
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await fetch('/api/get-api-key');
        if (res.ok) {
          const data = await res.json();
          if (data.apiKey) {
            setApiKey(data.apiKey);
            setApiKeyInput(data.apiKey);
            localStorage.setItem('iprn_api_key', data.apiKey);
          }
        }
      } catch (e) {}
    };
    fetchKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setKeySaveMessage({ text: 'Please enter or paste a valid API key.', type: 'error' });
      return;
    }
    setIsSavingKey(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() })
      });
      if (res.ok) {
        setApiKey(apiKeyInput.trim());
        localStorage.setItem('iprn_api_key', apiKeyInput.trim());
        setKeySaveMessage({ text: 'API Key saved! Live real-time SMS stream connected.', type: 'success' });
        fetchLatestData();
      } else {
        const errData = await res.json();
        setKeySaveMessage({ text: errData.message || 'Failed to update API key.', type: 'error' });
      }
    } catch (e) {
      setKeySaveMessage({ text: 'Network error while updating API key.', type: 'error' });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKeyInput(text.trim());
      }
    } catch (e) {}
  };

  // Audio tone generator for incoming SMS ping (Crisp standard "Tung" notification sound)
  const playSmsSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // High quality 2-step bright "Tung" notification chime
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.07); // E6
      gain2.gain.setValueAtTime(0.001, now + 0.07);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.38);
    } catch {
      // Audio fallback
    }
  };

  // Listen for real-time update events dispatched globally
  useEffect(() => {
    const handleSmsUpdated = () => {
      try {
        const saved = localStorage.getItem('real_sms_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const freshLogs: SmsLog[] = parsed.map((l: any) => ({
              ...l,
              cost: l.cost || '0.0100 USD'
            }));
            const newestId = freshLogs[0]?.id || freshLogs[0]?.timestamp || '';
            if (prevFirstIdRef.current && newestId !== prevFirstIdRef.current) {
              playSmsSound();
            }
            prevFirstIdRef.current = newestId;
            setLiveLogs(freshLogs);
          }
        }

        const savedMessages = localStorage.getItem('total_messages_stat');
        if (savedMessages) {
          setTotalMessagesStat(parseInt(savedMessages, 10));
        }
        const savedRanges = localStorage.getItem('ranges_stat');
        if (savedRanges) {
          setRangesStat(parseInt(savedRanges, 10));
        }
      } catch (err) {
        console.warn('Error syncing live test SMS logs from custom event:', err);
      }
    };

    window.addEventListener('real_sms_updated', handleSmsUpdated);
    window.addEventListener('real_sms_updated_event', handleSmsUpdated);
    return () => {
      window.removeEventListener('real_sms_updated', handleSmsUpdated);
      window.removeEventListener('real_sms_updated_event', handleSmsUpdated);
    };
  }, [soundEnabled]);

  // Sync logs and metrics via direct fetch
  const fetchLatestData = async () => {
    if (!isLiveActive) return;
    try {
      // 1. Fetch dashboard metrics for live counters
      const metricsRes = await fetch('/api/dashboard-metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        if (data?.metrics?.messages !== undefined) {
          setTotalMessagesStat(data.metrics.messages);
          localStorage.setItem('total_messages_stat', data.metrics.messages.toString());
        }
        if (data?.metrics?.totalRanges !== undefined) {
          setRangesStat(data.metrics.totalRanges);
          localStorage.setItem('ranges_stat', data.metrics.totalRanges.toString());
        }
      }

      // 2. Fetch active live SMS logs
      const smsRes = await fetch('/api/active-sms');
      if (smsRes.ok) {
        const smsData = await smsRes.json();
        if (smsData.logs && Array.isArray(smsData.logs)) {
          const freshLogs: SmsLog[] = smsData.logs.map((l: any) => ({
            ...l,
            cost: l.cost || '0.0100 USD'
          }));

          const newestId = freshLogs[0]?.id || freshLogs[0]?.timestamp || '';
          if (prevFirstIdRef.current && newestId !== prevFirstIdRef.current) {
            playSmsSound();
          }
          prevFirstIdRef.current = newestId;

          setLiveLogs(freshLogs);
          localStorage.setItem('real_sms_logs', JSON.stringify(freshLogs));
          setIsConnected(true);
          if (smsData.last_updated) {
            setLastSyncTime(new Date(smsData.last_updated).toLocaleTimeString('en-US', { hour12: false }));
          }
        }
      }
    } catch (e) {
      console.warn('Live test SMS sync notice:', e);
    }
  };

  // Real-Time EventSource (SSE) listener for instant sub-second push
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream-updates');
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onerror = () => setIsConnected(false);
      eventSource.onmessage = (event) => {
        if (!isLiveActive) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            if (payload.metrics?.messages !== undefined) {
              setTotalMessagesStat(payload.metrics.messages);
            }
            if (payload.metrics?.totalRanges !== undefined) {
              setRangesStat(payload.metrics.totalRanges);
            }
            if (payload.active_sms_logs && Array.isArray(payload.active_sms_logs)) {
              const freshLogs: SmsLog[] = payload.active_sms_logs.map((l: any) => ({
                ...l,
                cost: l.cost || '0.0100 USD'
              }));
              const newestId = freshLogs[0]?.id || freshLogs[0]?.timestamp || '';
              if (prevFirstIdRef.current && newestId !== prevFirstIdRef.current) {
                playSmsSound();
              }
              prevFirstIdRef.current = newestId;
              setLiveLogs(freshLogs);
              localStorage.setItem('real_sms_logs', JSON.stringify(freshLogs));
              if (payload.last_updated) {
                setLastSyncTime(new Date(payload.last_updated).toLocaleTimeString('en-US', { hour12: false }));
              }
            }
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };
    } catch (err) {
      console.warn('SSE fallback:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isLiveActive]);

  // Polling fallback every 2.5 seconds to guarantee active feed
  useEffect(() => {
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 2500);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Mask OTP codes in text body as seen in official panel (XXXXXX)
  const maskSmsOtp = (text: string): string => {
    if (!text) return '';
    let masked = text.replace(/\b\d{6}\b/g, 'XXXXXX');
    masked = masked.replace(/\b\d{4,5}\b/g, 'XXXX');
    masked = masked.replace(/(\d{2})\s*minutes/i, 'XX minutes');
    return masked;
  };

  const handleClear = () => {
    setLiveLogs([]);
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const headers = 'Timestamp,Number,Route/Termination,SenderID,Cost,Status,Message\n';
    const rows = filteredLogs.map(m => 
      `"${m.timestamp}","${m.number}","${m.termination}","${m.sid}","${m.cost || '0.0100 USD'}","${m.status}","${(m.text || '').replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `live_sms_stream_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (log: SmsLog, logKey: string) => {
    const cleanNum = log.number ? log.number.replace(/^\+/, '') : '';
    const maskedText = renderMaskedMessageBody(log.text);
    const content = `${cleanNum} | ${log.termination} | ${log.sid}: ${maskedText}`;
    navigator.clipboard.writeText(content);
    setCopiedId(logKey);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Dynamic available countries from live logs
  const availableCountries = useMemo(() => {
    const list = new Set<string>(['Algeria', 'Azerbaijan', 'Belarus', 'Benin', 'Bolivia', 'Cambodia', 'Ecuador', 'United Kingdom']);
    liveLogs.forEach(l => {
      const countryInfo = getCountryInfoByPhone(l.number || '', l.termination || '');
      if (countryInfo && countryInfo.name) {
        list.add(countryInfo.name);
      }
    });
    return Array.from(list).sort();
  }, [liveLogs]);

  // Determine if logged in user is Admin
  const isAdmin = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const user = (localStorage.getItem('codeflow_user') || '').toLowerCase().trim();
    const role = (localStorage.getItem('codeflow_user_role') || '').toLowerCase().trim();
    return (
      user === 'xzrmunna7788@gmail.com' ||
      user === 'xzrmunna7788' ||
      user === 'xzrmunna974@gmail.com' ||
      user.includes('admin') ||
      role === 'admin' ||
      role === 'master_admin'
    );
  }, []);

  // Universal Country Flag Renderer with high-definition CDN images for 100% consistent flags
  const renderFlag = (termination: string, phoneNumber?: string) => {
    const countryInfo = getCountryInfoByPhone(phoneNumber || '', termination);
    const code = (countryInfo.code || 'GL').toUpperCase();

    if (code === 'GL' || !code) {
      return (
        <div className="w-9 h-6 rounded-xs bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700 shrink-0 select-none">
          🌐
        </div>
      );
    }

    return (
      <div className="w-9 h-6 rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 relative flex items-center justify-center select-none">
        <img
          src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
          alt={countryInfo.name}
          className="w-full h-full object-cover rounded-xs"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <span className="absolute text-xs leading-none pointer-events-none -z-10">{countryInfo.emoji || '🌐'}</span>
      </div>
    );
  };

  const [revealedOtpIds, setRevealedOtpIds] = useState<Set<string>>(new Set());

  const toggleRevealOtp = (id: string) => {
    setRevealedOtpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper to format brand names beautifully
  const formatBrandName = (sid?: string) => {
    if (!sid) return 'AUTHMSG';
    const s = sid.toLowerCase().trim();
    if (s === 'whatsapp') return 'WhatsApp';
    if (s === 'telegram') return 'Telegram';
    if (s === 'google') return 'Google';
    if (s === 'gmail') return 'Gmail';
    if (s === 'snapchat') return 'Snapchat';
    if (s === 'synapse') return 'Synapse';
    if (s === 'tiktok') return 'TikTok';
    if (s === 'facebook') return 'Facebook';
    if (s === 'meta') return 'Meta';
    if (s === 'apple') return 'Apple';
    if (s === 'icloud') return 'iCloud';
    if (s === 'amazon') return 'Amazon';
    if (s === 'microsoft') return 'Microsoft';
    if (s === 'binance') return 'Binance';
    if (s === 'netflix') return 'Netflix';
    if (s === 'uber') return 'Uber';
    if (s === 'imo') return 'IMO';
    if (s === 'instagram') return 'Instagram';
    if (s === 'twitter') return 'Twitter';
    if (s === 'viber') return 'Viber';
    if (s === 'badoo') return 'Badoo';
    if (s === 'dhl') return 'DHL';
    if (s === 'santander') return 'Santander';
    if (s === 'notice') return 'Notice';
    
    // Capitalize first letter of each word
    return sid
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Render Social Media & Service Brand Logo
  const renderBrandLogo = (sid?: string) => {
    const s = (sid || '').toLowerCase().trim();
    
    // WhatsApp
    if (s.includes('whatsapp')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-2.007-.478-1.579-.656-2.592-2.277-2.671-2.383-.077-.105-.638-.85-.638-1.623 0-.773.405-1.154.55-1.311.144-.158.313-.198.418-.198.105 0 .21.002.302.007.097.005.228-.037.357.272.132.318.451 1.101.492 1.183.041.082.069.178.014.288-.054.109-.082.178-.163.273-.082.095-.173.212-.247.285-.082.082-.167.172-.072.336.095.163.424.7.91 1.134.625.558 1.152.731 1.315.813.164.082.26-.072.356-.183.109-.126.465-.542.588-.727.123-.186.246-.155.41-.095.164.06.942.444 1.106.526.164.082.273.123.313.192.041.069.041.402-.103.807z" />
          </svg>
        </div>
      );
    }
    // Telegram
    if (s.includes('telegram')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
          </svg>
        </div>
      );
    }
    // Google
    if (s.includes('google') || s.includes('gmail')) {
      return (
        <div className="w-5 h-5 rounded-full bg-white border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3 h-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
        </div>
      );
    }
    // Snapchat / Synapse
    if (s.includes('snap') || s.includes('synapse')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#FFFC00] text-black flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3.5 h-3.5 fill-black" viewBox="0 0 24 24">
            <path d="M12.035 2.75c-3.125 0-5.188 2.222-5.188 4.78 0 .843.23 1.638.632 2.302-.56.55-1.45.962-2.385.962-.32 0-.61-.067-.886-.184-.188.384.116.892.518 1.1.81.42 1.652.75 2.535.882.1.472-.086.972-.41 1.288-.632.616-1.433.918-2.226.918h-.335c-.2 0-.36.16-.36.36 0 .2.16.36.36.36h.335c1.12 0 2.11-.476 2.73-1.28.692.42 1.488.648 2.348.648s1.656-.228 2.348-.648c.62.804 1.61 1.28 2.73 1.28h.335c.2 0 .36-.16.36-.36 0-.2-.16-.36-.36-.36h-.335c-.793 0-1.594-.302-2.226-.918-.324-.316-.51-.816-.41-1.288.883-.132 1.725-.462 2.535-.882.402-.208.706-.716.518-1.1-.276.117-.566.184-.886.184-.935 0-1.825-.412-2.385-.962.402-.664.632-1.459.632-2.302 0-2.558-2.063-4.78-5.188-4.78z" />
          </svg>
        </div>
      );
    }
    // TikTok
    if (s.includes('tiktok')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path fill="#25F4EE" d="M16.6 5.82a4.34 4.34 0 0 1-3.26-3.26v-.56h-2.5v12.2a2.38 2.38 0 1 1-2.38-2.38c.28 0 .55.05.8.14V9.38a4.88 4.88 0 0 0-.8-.07 4.88 4.88 0 1 0 4.88 4.88V7.5a6.8 6.8 0 0 0 3.76 1.13V6.13a4.34 4.34 0 0 1-.5-.31z" />
            <path fill="#FE2C55" d="M15.8 5.1a4.34 4.34 0 0 1-3.26-3.26v-.56h-1.2v.56a4.34 4.34 0 0 0 3.26 3.26h1.2z" />
            <path fill="#FFFFFF" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.05.85.14V8.4a6.84 6.84 0 0 0-.85-.05A6.33 6.33 0 0 0 3 14.68 6.34 6.34 0 0 0 9.33 21a6.33 6.33 0 0 0 6.33-6.33V8.11a8.16 8.16 0 0 0 4.69 1.48V6.14a4.83 4.83 0 0 1-.76-.45z" />
          </svg>
        </div>
      );
    }
    // Facebook / Meta
    if (s.includes('facebook') || s.includes('meta')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      );
    }
    // Apple
    if (s.includes('apple') || s.includes('icloud')) {
      return (
        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.36-.58.68-1.09 1.76-.95 2.8 1.01.08 2.06-.56 2.68-1.31" />
          </svg>
        </div>
      );
    }
    // Amazon
    if (s.includes('amazon')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#131921] text-[#FF9900] flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M13.94 11.08c-1.28.12-2.45.38-3.51.78-.96.36-1.68.88-2.16 1.56-.48.68-.72 1.47-.72 2.37 0 .96.32 1.73.96 2.31.64.58 1.48.87 2.52.87 1.04 0 1.97-.28 2.79-.84.82-.56 1.39-1.3 1.71-2.22V17h2.22v-6.93h-2.18v1.01zm-1.37 5.76c-.46.46-1.02.69-1.68.69-.58 0-1.04-.16-1.38-.48-.34-.32-.51-.76-.51-1.32 0-.68.23-1.23.69-1.65.46-.42 1.13-.72 2.01-.9 1.02-.21 2.02-.34 3.01-.39v.75c0 1.28-.38 2.38-1.14 3.3zm7.01 4.79C17.38 22.83 14.28 23.5 11 23.5c-4.22 0-8.08-1.28-11-3.5 2.31 1.28 5.6 2 9 2 3.19 0 6.27-.63 8.58-1.87z" />
          </svg>
        </div>
      );
    }
    // Microsoft
    if (s.includes('microsoft')) {
      return (
        <div className="w-5 h-5 rounded-xs bg-white border border-slate-200 p-0.5 flex flex-wrap gap-0.5 items-center justify-center shrink-0 shadow-2xs">
          <div className="w-1.5 h-1.5 bg-[#F25022]" />
          <div className="w-1.5 h-1.5 bg-[#7FBA00]" />
          <div className="w-1.5 h-1.5 bg-[#00A4EF]" />
          <div className="w-1.5 h-1.5 bg-[#FFB900]" />
        </div>
      );
    }
    // Binance
    if (s.includes('binance')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#F3BA2F] text-slate-950 flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.2 3.2-3.2 3.2-3.2-3.2L12 2zm-6.8 6.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm13.6 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zM12 11.6l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm0 8.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z" />
          </svg>
        </div>
      );
    }
    // Netflix
    if (s.includes('netflix')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-[#E50914] flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M9 2v20l3-5V2H9zm6 0l-3 5v15l3-5V2z" />
          </svg>
        </div>
      );
    }
    // Uber
    if (s.includes('uber')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-2-8h4v4h-4z" />
          </svg>
        </div>
      );
    }
    // IMO
    if (s.includes('imo')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#0088FF] text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <span className="font-black text-[9px] tracking-tighter">imo</span>
        </div>
      );
    }
    // Instagram
    if (s.includes('instagram')) {
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </div>
      );
    }
    // Twitter / X
    if (s.includes('twitter') || s.includes('x.com')) {
      return (
        <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 shadow-2xs p-0.5">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    }
    // Viber
    if (s.includes('viber')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#7360F2] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M21 11.5c0-4.69-3.81-8.5-8.5-8.5S4 6.81 4 11.5c0 2.16.81 4.14 2.14 5.65L5 20l3.07-1.12c1.4.78 3.01 1.22 4.73 1.22 4.69 0 8.5-3.81 8.5-8.5z" />
          </svg>
        </div>
      );
    }
    // Badoo
    if (s.includes('badoo')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#7c26f8] text-white flex items-center justify-center shrink-0 shadow-2xs">
          <span className="text-[10px] leading-none">🧡</span>
        </div>
      );
    }
    // DHL
    if (s.includes('dhl')) {
      return (
        <div className="w-5 h-5 rounded-xs bg-[#FFCC00] text-[#D40000] flex items-center justify-center shrink-0 shadow-2xs font-black text-[9px] tracking-tighter">
          DHL
        </div>
      );
    }
    // Santander
    if (s.includes('santander')) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#EC0000] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-[10px]">
          S
        </div>
      );
    }
    // Notice
    if (s.includes('notice')) {
      return (
        <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-3 h-3 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    // Default fallback initial badge
    const initial = (sid || 'A').charAt(0).toUpperCase();
    return (
      <div className="w-5 h-5 rounded-md bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/60 dark:text-lime-400 font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
        {initial}
      </div>
    );
  };

  // Helper to mask OTP code in message body text (matches Switchfy / KSI IPRN live test design)
  const renderMaskedMessageBody = (text: string, _isRevealed?: boolean) => {
    if (!text) return '';
    // Unconditionally mask standalone 4 to 8 digit numbers or G-XXXXXX formats with exactly 'XXXX'
    return text
      .replace(/\b[0-9]{4,8}\b/g, 'XXXX')
      .replace(/\b[0-9]{3,4}[-\s][0-9]{3,4}\b/g, 'XXXX')
      .replace(/G-[0-9]{4,8}/gi, 'G-XXXX');
  };
  // Deduplicate incoming logs so the same OTP on the same number never displays repeatedly
  const uniqueLiveLogs = useMemo(() => {
    const seenMap = new Map<string, SmsLog>();
    for (const log of liveLogs) {
      const normPhone = String(log.number || '').replace(/[^\d]/g, '');
      const normOtp = String(log.otp || '').trim();
      const normText = String(log.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const dedupeKey = `${normPhone}_${normOtp || normText}`;

      if (!seenMap.has(dedupeKey)) {
        seenMap.set(dedupeKey, log);
      } else {
        const existing = seenMap.get(dedupeKey)!;
        if (new Date(log.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          seenMap.set(dedupeKey, log);
        }
      }
    }
    return Array.from(seenMap.values());
  }, [liveLogs]);

  const filteredLogs = useMemo(() => {
    return uniqueLiveLogs.filter(log => {
      const countryInfo = getCountryInfoByPhone(log.number || '', log.termination || '');
      const termMatch = 
        !searchTerm ||
        (log.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.number || '').includes(searchTerm) ||
        (log.termination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        countryInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.sid || '').toLowerCase().includes(searchTerm.toLowerCase());

      const countryMatch = selectedCountry === 'All' || 
        countryInfo.name.toLowerCase() === selectedCountry.toLowerCase();

      const panelMatch = selectedPanel === 'All' ||
        (selectedPanel === 'Fox SMS' && log.id?.startsWith('MSG-FOX-')) ||
        (selectedPanel === 'Blue SMS' && log.id?.startsWith('MSG-BLUE-')) ||
        (selectedPanel === 'S1T SMS' && log.id?.startsWith('MSG-S1T-'));

      return termMatch && countryMatch && panelMatch;
    });
  }, [liveLogs, searchTerm, selectedCountry, selectedPanel]);

  const totalPages = Math.ceil(filteredLogs.length / perPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredLogs.slice(start, start + perPage);
  }, [filteredLogs, currentPage, perPage]);

  // Format relative time (10m, 2s, 1m)
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffSec = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
      if (diffSec < 60) return `${diffSec}s`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr}h`;
    } catch {
      return '1m';
    }
  };

  // Format exact time (HH:mm:ss)
  const formatExactTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '03:29:14';
    }
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumbs matching original panel */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer">Dashboard</span>
        <span>&gt;</span>
        <span className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer">Test System</span>
        <span>&gt;</span>
        <span className="text-slate-900 dark:text-white font-bold">Live Test SMS</span>
      </div>

      {/* Top Metric Cards matching the screenshot */}
      <div className="space-y-4">
        {/* TOTAL MESSAGES Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#84cc16]" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block uppercase">
                TOTAL MESSAGES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {totalMessagesStat.toLocaleString('en-US')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                Live Stream
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/40 dark:text-lime-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* RANGES Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#84cc16]" />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider block uppercase">
                RANGES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {rangesStat.toLocaleString('en-US')}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                Receiving traffic
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#ecfccb] text-[#65a30d] dark:bg-lime-950/40 dark:text-lime-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Message Stream Card matching the screenshot */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        {/* Stream Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Message stream
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute/Unmute */}
            <button
              type="button"
              onClick={() => {
                const nextSound = !soundEnabled;
                setSoundEnabled(nextSound);
                if (nextSound) {
                  playSmsSound();
                }
              }}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
              title={soundEnabled ? 'Mute sound (Currently ON)' : 'Enable sound (Currently OFF)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Connected Pill */}
            <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: LIVE, Clear, Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* LIVE button with teal/emerald background */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isLiveActive 
                ? 'bg-[#0f766e] text-white shadow-xs' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'animate-pulse' : ''}`} />
            <span>LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search messages, phone numbers, countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition"
          />
        </div>

        {/* Filter selectors grid */}
        <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
          {/* Country filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="All">All Countries</option>
              {availableCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Panel Source filter - Admin only */}
          {isAdmin && (
            <div>
              <select
                value={selectedPanel}
                onChange={(e) => setSelectedPanel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="All">All Panels</option>
                <option value="Fox SMS">Fox SMS</option>
                <option value="Blue SMS">Blue SMS</option>
                <option value="S1T SMS">S1T SMS</option>
              </select>
            </div>
          )}
        </div>

        {/* Pagination & Count Row */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Per page</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>All (1000+)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded text-xs disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2 py-1 border border-slate-200 dark:border-slate-800 rounded text-xs disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Message Cards List with subtle hairline dividers and no outer card borders */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              Waiting for live incoming messages...
            </div>
          ) : (
            paginatedLogs.map((log, idx) => {
              const logKey = log.id || `${log.number}-${idx}`;
              const cleanNumber = log.number ? log.number.replace(/^\+/, '') : '';
              const maskedNumber = maskPhoneWithAreaCodeAndThreeDigits(log.number || '', log.termination || '');
              const rawOtp = log.otp || (log.text && (log.text.match(/\b\d{4,8}\b/) || [''])[0]) || '';
              const isRevealed = revealedOtpIds.has(logKey);
              const countryInfo = getCountryInfoByPhone(log.number || '', log.termination || '');
              
              // Clean range/carrier name so country name is not repeated twice
              let rangeDisplay = '';
              if (log.termination) {
                rangeDisplay = log.termination.replace(new RegExp('^' + countryInfo.name + '\\s*', 'i'), '').trim();
              }

              const isFirstMessage = idx === 0 && currentPage === 1;

              return (
                <div 
                  key={logKey}
                  className={`p-4 transition space-y-3 relative ${
                    isFirstMessage 
                      ? 'bg-[#f4fce3] dark:bg-[#1c3308]/70 border-l-4 border-l-[#84cc16] shadow-2xs' 
                      : 'bg-white hover:bg-slate-50/60 dark:bg-slate-900 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Country Flag */}
                    <div className="pt-0.5">
                      {renderFlag(log.termination, log.number)}
                    </div>

                    {/* Message Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Line 1: Route Name + Carrier Name (Clean Plain Text) + Relative Time */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {log.termination || countryInfo.name}
                          </h4>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                          {formatTimeAgo(log.timestamp)}
                        </span>
                      </div>

                      {/* Line 2: Phone Number + Exact Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {maskedNumber}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                          {formatExactTime(log.timestamp)}
                        </span>
                      </div>

                      {/* Line 3: Social Media / App Brand Logo + Sender badge */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-2">
                          {renderBrandLogo(log.sid)}
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {formatBrandName(log.sid)}
                          </span>
                        </div>
                        {isAdmin && log.id?.startsWith('MSG-FOX-') && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 uppercase tracking-wider select-none shrink-0 scale-95 border border-amber-500/10">
                            Fox SMS
                          </span>
                        )}
                        {isAdmin && log.id?.startsWith('MSG-BLUE-') && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 uppercase tracking-wider select-none shrink-0 scale-95 border border-sky-500/10">
                            Blue SMS
                          </span>
                        )}
                        {isAdmin && log.id?.startsWith('MSG-S1T-') && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 uppercase tracking-wider select-none shrink-0 scale-95 border border-emerald-500/10">
                            S1T SMS
                          </span>
                        )}
                      </div>

                      {/* Line 4: Message Body with masked OTP text (matching Switchfy / KSI panel) */}
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pt-1 select-text break-words break-all">
                        {renderMaskedMessageBody(log.text, isRevealed)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
