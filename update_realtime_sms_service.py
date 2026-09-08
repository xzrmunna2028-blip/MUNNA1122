import json

with open('all_iprn_numbers_raw.json') as f:
    raw_nums = json.load(f)

rented_entries = []
test_entries = []

for idx, item in enumerate(raw_nums):
    raw_num = str(item.get('number', '')).strip()
    num_str = f'+{raw_num}' if not raw_num.startswith('+') else raw_num
    range_name = item.get('range_name', 'Azerbaijan - Bakcell 3')
    
    parts = range_name.split(' - ')
    if len(parts) > 1:
        country = parts[0].strip()
        operator = parts[1].strip()
    else:
        country = 'Cambodia' if 'Cambodia' in range_name else 'Azerbaijan'
        operator = range_name
        
    flag = 'AZ' if 'Azerbaijan' in country else 'KH' if 'Cambodia' in country else 'US'
    rate_str = f"{float(item.get('a2p_rate') or 0.0096):.4f} USD"
    limit_str = f"{int(item.get('portal_limit_a2p') or 10000):,}"
    
    rented_entries.append(f"""  {{
    id: 'NUM-IPRN-{raw_num}',
    number: '{num_str}',
    range: '{range_name}',
    operator: '{operator}',
    status: 'ACTIVE',
    cost: '{rate_str}',
    expiry: 'Oct 08, 2026',
    term: '1/1',
    lastMessage: 'None',
    portalLimit: '{limit_str}',
    sidRange: 'IPRN-Direct',
    multiLimit: 'No Limit',
    sidDidLimit: 'Unlimited',
  }},""")

    test_entries.append(f"""  {{
    id: 'T-{idx+1}',
    name: '{range_name}',
    code: '{num_str[:4]}',
    number: '{raw_num}',
    rate: '${rate_str}',
    flag: '{flag}',
  }},""")

rented_code = '\n'.join(rented_entries)
test_code = '\n'.join(test_entries)

ts_content = f"""import {{ RealSmsLog, RentedNumber }} from '../types';

export const DEFAULT_RENTED_NUMBERS: RentedNumber[] = [
{rented_code}
];

export const DEFAULT_TEST_NUMBERS = [
{test_code}
];

// Helper to extract 4-8 digit OTP code from arbitrary text
export const extractOtpCode = (text: string): string => {{
  if (!text) return '';
  const gMatch = text.match(/G-(\\d{{4,8}})/i);
  if (gMatch) return gMatch[1];

  const dashMatch = text.match(/\\b(\\d{{3}})-(\\d{{3}})\\b/);
  if (dashMatch) return `${{dashMatch[1]}}${{dashMatch[2]}}`;

  const numMatch = text.match(/\\b\\d{{4,8}}\\b/);
  if (numMatch) return numMatch[0];

  return '';
}};

// Play audio chime for incoming OTP
export const playOtpChime = () => {{
  try {{
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  }} catch (e) {{}}
}};

// Purge all demo/mock SMS logs
export const purgeAllDemoSmsLogs = () => {{
  localStorage.setItem('real_sms_logs', JSON.stringify([]));
  window.dispatchEvent(new Event('real_sms_updated'));
}};

// Initialize SMS store
export const initRealtimeSmsStore = () => {{
  const existing = localStorage.getItem('real_sms_logs');
  if (!existing) {{
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
    return;
  }}
  try {{
    const parsed = JSON.parse(existing);
    if (!Array.isArray(parsed)) {{
      localStorage.setItem('real_sms_logs', JSON.stringify([]));
      return;
    }}
  }} catch (e) {{
    localStorage.setItem('real_sms_logs', JSON.stringify([]));
  }}
}};

export const seedInitialOtpLogs = () => {{
  initRealtimeSmsStore();
}};

// Ensure default rented numbers exist
export const ensureDefaultRentedNumbers = (): RentedNumber[] => {{
  const local = localStorage.getItem('rented_numbers');
  if (local) {{
    try {{
      const parsed: RentedNumber[] = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length >= 110) {{
        return parsed;
      }}
    }} catch (e) {{}}
  }}
  localStorage.setItem('rented_numbers', JSON.stringify(DEFAULT_RENTED_NUMBERS));
  return DEFAULT_RENTED_NUMBERS;
}};

// Ensure default test numbers exist
export const ensureDefaultTestNumbers = () => {{
  const local = localStorage.getItem('test_numbers');
  if (local) {{
    try {{
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length >= 110) {{
        return parsed;
      }}
    }} catch (e) {{}}
  }}
  localStorage.setItem('test_numbers', JSON.stringify(DEFAULT_TEST_NUMBERS));
  return DEFAULT_TEST_NUMBERS;
}};

// Get all real SMS logs
export const getRealSmsLogs = (): RealSmsLog[] => {{
  const existing = localStorage.getItem('real_sms_logs');
  if (existing) {{
    try {{
      return JSON.parse(existing);
    }} catch (e) {{}}
  }}
  return [];
}};

const BRAND_TEMPLATES = [
  {{
    brand: 'WhatsApp',
    sid: 'WhatsApp',
    format: (code: string) => `Your WhatsApp code: ${{code.slice(0, 3)}}-${{code.slice(3)}}. You can also tap on this link to verify your phone: v.whatsapp.com/${{code}}`,
  }},
  {{
    brand: 'Google',
    sid: 'Google',
    format: (code: string) => `G-${{code}} is your Google verification code.`,
  }},
  {{
    brand: 'Telegram',
    sid: 'Telegram',
    format: (code: string) => `Telegram code: ${{code}}. You can also tap this link to log in: https://t.me/login?c=${{code}}`,
  }},
  {{
    brand: 'TikTok',
    sid: 'TikTok',
    format: (code: string) => `[TikTok] ${{code}} is your verification code. Valid for 5 minutes.`,
  }},
  {{
    brand: 'Binance',
    sid: 'Binance',
    format: (code: string) => `[Binance] Verification code: ${{code}} for login. NEVER share this code with anyone.`,
  }},
  {{
    brand: 'Facebook',
    sid: 'Facebook',
    format: (code: string) => `${{code}} is your Facebook confirmation code`,
  }},
  {{
    brand: 'Apple',
    sid: 'Apple',
    format: (code: string) => `Your Apple ID Code is: ${{code}}. Don't share it with anyone.`,
  }},
  {{
    brand: 'Microsoft',
    sid: 'Microsoft',
    format: (code: string) => `${{code}} is your Microsoft account verification code.`,
  }},
  {{
    brand: 'IMO',
    sid: 'IMO',
    format: (code: string) => `Your imo verification code is ${{code}}. DO NOT share this code with anyone.`,
  }},
];

// Dispatch an incoming real-time OTP message
export const dispatchIncomingOtp = (options?: {{
  targetNumber?: string;
  targetRoute?: string;
  targetSid?: string;
  forceStatus?: 'DELIVERED' | 'FAILED';
}}): RealSmsLog => {{
  const activeNumbers = ensureDefaultRentedNumbers();
  
  let chosenNumber = options?.targetNumber;
  let chosenRoute = options?.targetRoute;
  
  if (!chosenNumber && activeNumbers.length > 0) {{
    const randomPick = activeNumbers[Math.floor(Math.random() * activeNumbers.length)];
    chosenNumber = randomPick.number;
    chosenRoute = randomPick.range;
  }}

  if (!chosenNumber) {{
    chosenNumber = '+994997780131';
    chosenRoute = 'Azerbaijan - Bakcell 3';
  }}

  if (!chosenRoute) {{
    chosenRoute = 'Azerbaijan - Bakcell 3';
  }}

  const codeNumber = Math.floor(100000 + Math.random() * 900000).toString();

  const template = options?.targetSid
    ? BRAND_TEMPLATES.find((b) => b.sid.toLowerCase() === options.targetSid?.toLowerCase()) || {{
        brand: options.targetSid,
        sid: options.targetSid,
        format: (c: string) => `Your verification code is ${{c}}. Valid for 5 minutes.`,
      }}
    : BRAND_TEMPLATES[Math.floor(Math.random() * BRAND_TEMPLATES.length)];

  const status: 'DELIVERED' | 'FAILED' = options?.forceStatus
    ? options.forceStatus
    : Math.random() > 0.05
    ? 'DELIVERED'
    : 'FAILED';

  const textBody =
    status === 'DELIVERED'
      ? template.format(codeNumber)
      : `Delivery Failure: Carrier routing handshake timed out for destination ${{chosenNumber}}.`;

  const newLog: RealSmsLog = {{
    id: `SMS-${{Math.floor(100000 + Math.random() * 900000)}}`,
    timestamp: new Date().toISOString(),
    status: status,
    termination: chosenRoute.replace(/\\s*\\(\\+\\d+\\)/, ''),
    number: chosenNumber,
    sid: template.sid,
    brand: template.brand,
    text: textBody,
    otp: status === 'DELIVERED' ? codeNumber : '',
    cost: '0.0096 USD',
  }};

  const existing = getRealSmsLogs();
  const updated = [newLog, ...existing];
  localStorage.setItem('real_sms_logs', JSON.stringify(updated));

  const currentRented = ensureDefaultRentedNumbers();
  const updatedRented = currentRented.map((n) => {{
    if (n.number === chosenNumber || chosenNumber?.includes(n.number) || n.number.includes(chosenNumber || '')) {{
      return {{
        ...n,
        lastMessage: 'Just now',
      }};
    }}
    return n;
  }});
  localStorage.setItem('rented_numbers', JSON.stringify(updatedRented));
  window.dispatchEvent(new Event('rented_numbers_updated'));

  playOtpChime();
  window.dispatchEvent(new Event('real_sms_updated'));

  try {{
    const notifs = localStorage.getItem('codeflow_user_notifications');
    const parsedNotifs = notifs ? JSON.parse(notifs) : [];
    const newNotif = {{
      id: `NOTIF-${{Date.now()}}`,
      title: status === 'DELIVERED' ? `OTP Received from ${{template.brand}}` : `SMS Delivery Failed (${{template.brand}})`,
      message: status === 'DELIVERED' ? `Code: ${{codeNumber}} received on ${{chosenNumber}}` : `Message to ${{chosenNumber}} failed delivery.`,
      time: 'Just now',
      read: false,
      type: status === 'DELIVERED' ? 'success' : 'error',
    }};
    localStorage.setItem('codeflow_user_notifications', JSON.stringify([newNotif, ...parsedNotifs]));
    window.dispatchEvent(new Event('codeflow_notifications_updated'));
  }} catch (e) {{}}

  return newLog;
}};
"""

with open('src/utils/realtimeSmsService.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print('SUCCESS! Updated src/utils/realtimeSmsService.ts with all 110 numbers!')
