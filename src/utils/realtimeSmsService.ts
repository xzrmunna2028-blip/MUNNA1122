import { RealSmsLog, RentedNumber } from '../types';

export const DEFAULT_RENTED_NUMBERS: RentedNumber[] = [
  {
    id: 'NUM-88001',
    number: '+8801723849583',
    range: 'Bangladesh - Grameenphone (+880)',
    operator: 'Grameenphone',
    status: 'ACTIVE',
    cost: '0.0000 USD',
    expiry: 'Oct 08, 2026',
    term: '1/1',
    lastMessage: 'None',
    portalLimit: '10,000',
    sidRange: 'No Limit',
    multiLimit: 'No Limit',
    sidDidLimit: 'No Limit',
  },
  {
    id: 'NUM-10002',
    number: '+12025550194',
    range: 'United States - Twilio/Verizon (+1)',
    operator: 'Verizon A2P',
    status: 'ACTIVE',
    cost: '0.0000 USD',
    expiry: 'Oct 15, 2026',
    term: '1/1',
    lastMessage: 'None',
    portalLimit: '25,000',
    sidRange: 'No Limit',
    multiLimit: 'No Limit',
    sidDidLimit: 'No Limit',
  },
  {
    id: 'NUM-44003',
    number: '+447385293847',
    range: 'United Kingdom - Vodafone (+44)',
    operator: 'Vodafone Direct',
    status: 'ACTIVE',
    cost: '0.0000 USD',
    expiry: 'Oct 22, 2026',
    term: '1/1',
    lastMessage: 'None',
    portalLimit: '15,000',
    sidRange: 'No Limit',
    multiLimit: 'No Limit',
    sidDidLimit: 'No Limit',
  },
  {
    id: 'NUM-22904',
    number: '+2290145205298',
    range: 'Benin - Celtiis 102 (+229)',
    operator: 'Celtiis',
    status: 'ACTIVE',
    cost: '0.0000 USD',
    expiry: 'Nov 02, 2026',
    term: '1/1',
    lastMessage: 'None',
    portalLimit: '10,000',
    sidRange: 'No Limit',
    multiLimit: 'No Limit',
    sidDidLimit: 'No Limit',
  },
  {
    id: 'NUM-59105',
    number: '+59171234567',
    range: 'Bolivia - Orange (+591)',
    operator: 'Orange Bolivia',
    status: 'ACTIVE',
    cost: '0.0000 USD',
    expiry: 'Nov 10, 2026',
    term: '1/1',
    lastMessage: '25m ago',
    portalLimit: '10,000',
    sidRange: 'No Limit',
    multiLimit: 'No Limit',
    sidDidLimit: 'No Limit',
  },
  {
    id: 'NUM-59306',
    number: '+593996993564',
    range: 'Ecuador - CNT 10 (+593)',
    operator: 'CNT Telecommunications',
    status: 'ACTIVE',
    cost: '0.0000 USD',
    expiry: 'Nov 18, 2026',
    term: '1/1',
    lastMessage: '1h ago',
    portalLimit: '10,000',
    sidRange: 'No Limit',
    multiLimit: 'No Limit',
    sidDidLimit: 'No Limit',
  },
];

export const DEFAULT_TEST_NUMBERS = [
  {
    id: 'T-1',
    name: 'Ecuador - CNT 10',
    code: '+593',
    number: '593996993564',
    rate: '$0.0000',
    flag: 'EC',
  },
  {
    id: 'T-2',
    name: 'Benin - Celtiis 102',
    code: '+229',
    number: '2290145205298',
    rate: '$0.0000',
    flag: 'BJ',
  },
  {
    id: 'T-3',
    name: 'Bolivia - Orange',
    code: '+591',
    number: '59171234567',
    rate: '$0.0000',
    flag: 'BO',
  },
  {
    id: 'T-4',
    name: 'Bangladesh - Grameenphone',
    code: '+880',
    number: '8801723849583',
    rate: '$0.0000',
    flag: 'BD',
  },
  {
    id: 'T-5',
    name: 'United Kingdom - Vodafone',
    code: '+44',
    number: '447385293847',
    rate: '$0.0000',
    flag: 'GB',
  },
  {
    id: 'T-6',
    name: 'Algeria - Mobilis 101',
    code: '+213',
    number: '213673859086',
    rate: '$0.0000',
    flag: 'DZ',
  },
];

// Helper to extract 4-8 digit OTP code from arbitrary text
export const extractOtpCode = (text: string): string => {
  if (!text) return '';
  // Check common formats e.g. "G-123456", "123-456", "123456"
  const gMatch = text.match(/G-(\d{4,8})/i);
  if (gMatch) return gMatch[1];

  const dashMatch = text.match(/\b(\d{3})-(\d{3})\b/);
  if (dashMatch) return `${dashMatch[1]}${dashMatch[2]}`;

  const numMatch = text.match(/\b\d{4,8}\b/);
  if (numMatch) return numMatch[0];

  return '';
};

// Play audio chime for incoming OTP
export const playOtpChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch (e) {
    // AudioContext might be restricted until user gesture
  }
};

// Purge all demo/mock SMS logs so everything starts at 0 (Zero) as requested by user
export const purgeAllDemoSmsLogs = () => {
  localStorage.setItem('real_sms_logs', JSON.stringify([]));
  window.dispatchEvent(new Event('real_sms_updated'));
};

// Initialize SMS store with 0 messages, clearing out any previous demo data
export const initRealtimeSmsStore = () => {
  const existing = localStorage.getItem('real_sms_logs');
  if (!existing) {
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
    return;
  }
  try {
    const parsed = JSON.parse(existing);
    if (!Array.isArray(parsed)) {
      localStorage.setItem('real_sms_logs', JSON.stringify([]));
      return;
    }
    // If contains previously seeded demo IDs, clear them out completely to zero
    const hasDemo = parsed.some(
      (item: any) =>
        item.otp === '849201' ||
        item.otp === '394827' ||
        item.otp === '718302' ||
        item.otp === '502914' ||
        item.otp === '938102'
    );
    if (hasDemo) {
      localStorage.setItem('real_sms_logs', JSON.stringify([]));
    }
  } catch (e) {
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
  }
};

// Export seedInitialOtpLogs as an alias that enforces 0 demo messages
export const seedInitialOtpLogs = () => {
  initRealtimeSmsStore();
};

// Ensure default rented numbers exist
export const ensureDefaultRentedNumbers = (): RentedNumber[] => {
  const local = localStorage.getItem('rented_numbers');
  if (local) {
    try {
      const parsed: RentedNumber[] = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }
  localStorage.setItem('rented_numbers', JSON.stringify(DEFAULT_RENTED_NUMBERS));
  return DEFAULT_RENTED_NUMBERS;
};

// Ensure default test numbers exist
export const ensureDefaultTestNumbers = () => {
  const local = localStorage.getItem('test_numbers');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {}
  }
  localStorage.setItem('test_numbers', JSON.stringify(DEFAULT_TEST_NUMBERS));
  return DEFAULT_TEST_NUMBERS;
};

// Get all real SMS logs
export const getRealSmsLogs = (): RealSmsLog[] => {
  const existing = localStorage.getItem('real_sms_logs');
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {}
  }
  return [];
};

// Brand Templates for realistic OTP generation
const BRAND_TEMPLATES = [
  {
    brand: 'WhatsApp',
    sid: 'WhatsApp',
    format: (code: string) => `Your WhatsApp code: ${code.slice(0, 3)}-${code.slice(3)}. You can also tap on this link to verify your phone: v.whatsapp.com/${code}`,
  },
  {
    brand: 'Google',
    sid: 'Google',
    format: (code: string) => `G-${code} is your Google verification code.`,
  },
  {
    brand: 'Telegram',
    sid: 'Telegram',
    format: (code: string) => `Telegram code: ${code}. You can also tap this link to log in: https://t.me/login?c=${code}`,
  },
  {
    brand: 'TikTok',
    sid: 'TikTok',
    format: (code: string) => `[TikTok] ${code} is your verification code. Valid for 5 minutes.`,
  },
  {
    brand: 'Binance',
    sid: 'Binance',
    format: (code: string) => `[Binance] Verification code: ${code} for login. NEVER share this code with anyone.`,
  },
  {
    brand: 'Facebook',
    sid: 'Facebook',
    format: (code: string) => `${code} is your Facebook confirmation code`,
  },
  {
    brand: 'Apple',
    sid: 'Apple',
    format: (code: string) => `Your Apple ID Code is: ${code}. Don't share it with anyone.`,
  },
  {
    brand: 'Microsoft',
    sid: 'Microsoft',
    format: (code: string) => `${code} is your Microsoft account verification code.`,
  },
  {
    brand: 'IMO',
    sid: 'IMO',
    format: (code: string) => `Your imo verification code is ${code}. DO NOT share this code with anyone.`,
  },
];

// Dispatch an incoming real-time OTP message
export const dispatchIncomingOtp = (options?: {
  targetNumber?: string;
  targetRoute?: string;
  targetSid?: string;
  forceStatus?: 'DELIVERED' | 'FAILED';
}): RealSmsLog => {
  // Ensure numbers exist
  const activeNumbers = ensureDefaultRentedNumbers();
  
  // Pick random or specified number
  let chosenNumber = options?.targetNumber;
  let chosenRoute = options?.targetRoute;
  
  if (!chosenNumber && activeNumbers.length > 0) {
    const randomPick = activeNumbers[Math.floor(Math.random() * activeNumbers.length)];
    chosenNumber = randomPick.number;
    chosenRoute = randomPick.range;
  }

  if (!chosenNumber) {
    chosenNumber = '+8801723849583';
    chosenRoute = 'Bangladesh - Grameenphone (+880)';
  }

  if (!chosenRoute) {
    chosenRoute = 'Bangladesh - Grameenphone';
  }

  // Generate 6-digit random code
  const codeNumber = Math.floor(100000 + Math.random() * 900000).toString();

  // Pick Brand Template
  const template = options?.targetSid
    ? BRAND_TEMPLATES.find((b) => b.sid.toLowerCase() === options.targetSid?.toLowerCase()) || {
        brand: options.targetSid,
        sid: options.targetSid,
        format: (c: string) => `Your verification code is ${c}. Valid for 5 minutes.`,
      }
    : BRAND_TEMPLATES[Math.floor(Math.random() * BRAND_TEMPLATES.length)];

  // Success vs Failure (approx 93% success)
  const status: 'DELIVERED' | 'FAILED' = options?.forceStatus
    ? options.forceStatus
    : Math.random() > 0.07
    ? 'DELIVERED'
    : 'FAILED';

  const textBody =
    status === 'DELIVERED'
      ? template.format(codeNumber)
      : `Delivery Failure: Carrier routing handshake timed out for destination ${chosenNumber}.`;

  const newLog: RealSmsLog = {
    id: `SMS-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString(),
    status: status,
    termination: chosenRoute.replace(/\s*\(\+\d+\)/, ''),
    number: chosenNumber,
    sid: template.sid,
    brand: template.brand,
    text: textBody,
    otp: status === 'DELIVERED' ? codeNumber : '',
    cost: '0.0000 USD',
  };

  // Save to localStorage
  const existing = getRealSmsLogs();
  const updated = [newLog, ...existing];
  localStorage.setItem('real_sms_logs', JSON.stringify(updated));

  // Update last message in rented_numbers for this number
  const currentRented = ensureDefaultRentedNumbers();
  const updatedRented = currentRented.map((n) => {
    if (n.number === chosenNumber || chosenNumber?.includes(n.number) || n.number.includes(chosenNumber || '')) {
      return {
        ...n,
        lastMessage: 'Just now',
      };
    }
    return n;
  });
  localStorage.setItem('rented_numbers', JSON.stringify(updatedRented));
  window.dispatchEvent(new Event('rented_numbers_updated'));

  // Play audio chime
  playOtpChime();

  // Dispatch browser update event
  window.dispatchEvent(new Event('real_sms_updated'));

  // Trigger web notification if supported
  try {
    const notifs = localStorage.getItem('codeflow_user_notifications');
    const parsedNotifs = notifs ? JSON.parse(notifs) : [];
    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      title: status === 'DELIVERED' ? `OTP Received from ${template.brand}` : `SMS Delivery Failed (${template.brand})`,
      message: status === 'DELIVERED' ? `Code: ${codeNumber} received on ${chosenNumber}` : `Message to ${chosenNumber} failed delivery.`,
      time: 'Just now',
      read: false,
      type: status === 'DELIVERED' ? 'success' : 'error',
    };
    localStorage.setItem('codeflow_user_notifications', JSON.stringify([newNotif, ...parsedNotifs]));
    window.dispatchEvent(new Event('codeflow_notifications_updated'));
  } catch (e) {}

  return newLog;
};
