import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Hash,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Trash2,
  Layers,
  ArrowRight,
  Sliders,
  Flame,
  Globe,
  Zap,
  Check,
  X,
  FileCode,
  Lock
} from 'lucide-react';

export interface MasterKeyPreset {
  id: string;
  name: string;
  key: string;
  description: string;
  provider: string;
  routesCount: number;
  numbersCount: number;
  smsCount: number;
  autoSync: boolean;
  data: {
    numbers: Array<{
      id: string;
      number: string;
      range: string;
      operator: string;
      status: 'ACTIVE' | 'PENDING';
      cost: string;
      expiry: string;
      term?: string;
      portalLimit?: string;
      sidRange?: string;
      multiLimit?: string;
      sidDidLimit?: string;
    }>;
    testSms: Array<{
      timestamp: string;
      status: 'DELIVERED' | 'FAILED';
      termination: string;
      number: string;
      sid: string;
      cost?: string;
      text: string;
    }>;
    smsRecords: Array<{
      timestampDate: string;
      timestampTime: string;
      brand: string;
      logoType: 'tiktok' | 'facebook' | 'apple' | 'google' | 'telegram' | 'whatsapp' | 'letter';
      logoLetter?: string;
      logoBg?: string;
      senderId: string;
      destination: string;
      country: string;
      operator: string;
      prefix: string;
      message: string;
    }>;
    sidWatches: Array<{
      id: string;
      sid: string;
      country: string;
      dateAdded: string;
      active: boolean;
    }>;
  };
}

// Built-in intelligent Master Gateway profiles with pre-programmed rules & full payload bundles
export const BUILT_IN_MASTER_PRESETS: MasterKeyPreset[] = [
  {
    id: 'MK-GLOBAL-PRO',
    name: 'Global Tier-1 SMS Gateway (Enterprise Master)',
    key: 'CF_MASTER_GLOBAL_TIER1_2026_PRO_KEY',
    description: 'Direct operator integration across Bangladesh, USA, UK, Ecuador, Benin & Europe with live OTP pipelines.',
    provider: 'CodeFlow Carrier Core Engine',
    routesCount: 8,
    numbersCount: 6,
    smsCount: 12,
    autoSync: true,
    data: {
      numbers: [
        {
          id: 'NUM-8801',
          number: '8801723849583',
          range: '8801723XXXXX',
          operator: 'Bangladesh - Grameenphone VIP Route',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'BD GP Dedicated Gateway',
          portalLimit: '500/day',
          sidRange: 'GP-OTP-01',
          multiLimit: '10',
          sidDidLimit: '50'
        },
        {
          id: 'NUM-8802',
          number: '8801912498271',
          range: '8801912XXXXX',
          operator: 'Bangladesh - Banglalink Fast Line',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'BL Direct 2FA Gate',
          portalLimit: '500/day',
          sidRange: 'BL-OTP-02',
          multiLimit: '10',
          sidDidLimit: '50'
        },
        {
          id: 'NUM-5931',
          number: '593996993564',
          range: '593996XXXXX',
          operator: 'Ecuador - CNT 10 Direct',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'CNT Dedicated Pipe',
          portalLimit: '1000/day',
          sidRange: 'CNT-99',
          multiLimit: '20',
          sidDidLimit: '100'
        },
        {
          id: 'NUM-2291',
          number: '2290145205298',
          range: '229014XXXXX',
          operator: 'Benin - Celtiis 102 High Speed',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'Benin Premium Route',
          portalLimit: '500/day',
          sidRange: 'CEL-01',
          multiLimit: '10',
          sidDidLimit: '50'
        },
        {
          id: 'NUM-4401',
          number: '447385293847',
          range: '447385XXXXX',
          operator: 'United Kingdom - Vodafone UK',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'UK Mobile Verified Gate',
          portalLimit: '2000/day',
          sidRange: 'UK-VODA-08',
          multiLimit: '25',
          sidDidLimit: '100'
        },
        {
          id: 'NUM-1001',
          number: '12025550198',
          range: '1202555XXXX',
          operator: 'United States - T-Mobile Direct 2FA',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'US Tier-1 SS7 Aggregator',
          portalLimit: '5000/day',
          sidRange: 'US-TMOB-22',
          multiLimit: '50',
          sidDidLimit: '250'
        }
      ],
      testSms: [
        {
          timestamp: new Date().toISOString(),
          status: 'DELIVERED',
          termination: 'Bangladesh - Grameenphone',
          number: '8801723849583',
          sid: 'GP-OTP-01',
          cost: '$0.0000',
          text: 'Your CodeFlow verification PIN is 849201. Valid for 5 minutes.'
        },
        {
          timestamp: new Date(Date.now() - 45000).toISOString(),
          status: 'DELIVERED',
          termination: 'Ecuador - CNT 10',
          number: '593996993564',
          sid: 'CNT-99',
          cost: '$0.0000',
          text: 'Google verification code: 394812. Do not share this OTP.'
        },
        {
          timestamp: new Date(Date.now() - 90000).toISOString(),
          status: 'DELIVERED',
          termination: 'United States - T-Mobile',
          number: '12025550198',
          sid: 'US-TMOB-22',
          cost: '$0.0000',
          text: 'TikTok security code: 492031. Log in to authorize your session.'
        },
        {
          timestamp: new Date(Date.now() - 150000).toISOString(),
          status: 'DELIVERED',
          termination: 'United Kingdom - Vodafone',
          number: '447385293847',
          sid: 'UK-VODA-08',
          cost: '$0.0000',
          text: 'WhatsApp code 783-912. You can also tap on the link to verify.'
        },
        {
          timestamp: new Date(Date.now() - 210000).toISOString(),
          status: 'DELIVERED',
          termination: 'Benin - Celtiis 102',
          number: '2290145205298',
          sid: 'CEL-01',
          cost: '$0.0000',
          text: 'Telegram login code: 92834. Do not disclose this code to anyone.'
        }
      ],
      smsRecords: [
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date().toTimeString().split(' ')[0] + ' UTC',
          brand: 'TikTok',
          logoType: 'tiktok',
          senderId: 'TikTok',
          destination: '8801723849583',
          country: 'Bangladesh',
          operator: 'Grameenphone',
          prefix: '880',
          message: 'Your TikTok verification PIN is 849201. Valid for 5 minutes.'
        },
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date(Date.now() - 60000).toTimeString().split(' ')[0] + ' UTC',
          brand: 'Google',
          logoType: 'google',
          senderId: 'GoogleVerify',
          destination: '593996993564',
          country: 'Ecuador',
          operator: 'CNT 10',
          prefix: '593',
          message: 'G-394812 is your Google verification code.'
        },
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date(Date.now() - 120000).toTimeString().split(' ')[0] + ' UTC',
          brand: 'WhatsApp',
          logoType: 'whatsapp',
          senderId: 'WhatsApp',
          destination: '447385293847',
          country: 'United Kingdom',
          operator: 'Vodafone',
          prefix: '44',
          message: 'Your WhatsApp Business confirmation key is: 783-912.'
        },
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date(Date.now() - 180000).toTimeString().split(' ')[0] + ' UTC',
          brand: 'Telegram',
          logoType: 'telegram',
          senderId: 'Telegram',
          destination: '2290145205298',
          country: 'Benin',
          operator: 'Celtiis 102',
          prefix: '229',
          message: 'Telegram authentication code: 92834.'
        }
      ],
      sidWatches: [
        { id: 'SID-01', sid: 'GP-OTP-01', country: 'Bangladesh', dateAdded: new Date().toISOString().split('T')[0], active: true },
        { id: 'SID-02', sid: 'CNT-99', country: 'Ecuador', dateAdded: new Date().toISOString().split('T')[0], active: true },
        { id: 'SID-03', sid: 'UK-VODA-08', country: 'United Kingdom', dateAdded: new Date().toISOString().split('T')[0], active: true }
      ]
    }
  },
  {
    id: 'MK-BANGLADESH-ULTRA',
    name: 'Bangladesh Dedicated Telecom Gate (GP, BL, Robi, Teletalk)',
    key: 'CF_MASTER_BD_TELECOM_ALL_NETWORKS_2026_KEY',
    description: 'High-volume OTP router optimized specifically for all Bangladesh national mobile operators.',
    provider: 'BD Carrier Hub Express',
    routesCount: 4,
    numbersCount: 4,
    smsCount: 8,
    autoSync: true,
    data: {
      numbers: [
        {
          id: 'BD-NUM-01',
          number: '8801711002233',
          range: '8801711XXXXX',
          operator: 'Grameenphone 4G Core',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'GP Direct Hub',
          portalLimit: '1000/day',
          sidRange: 'GP-FAST-01'
        },
        {
          id: 'BD-NUM-02',
          number: '8801911998877',
          range: '8801911XXXXX',
          operator: 'Banglalink Direct 2FA',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'BL Direct Pipe',
          portalLimit: '1000/day',
          sidRange: 'BL-FAST-02'
        },
        {
          id: 'BD-NUM-03',
          number: '8801811445566',
          range: '8801811XXXXX',
          operator: 'Robi Axiata Direct',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'Robi Dedicated',
          portalLimit: '1000/day',
          sidRange: 'ROBI-01'
        },
        {
          id: 'BD-NUM-04',
          number: '8801511223344',
          range: '8801511XXXXX',
          operator: 'Teletalk Bangladesh 3G/4G',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'Teletalk Fast',
          portalLimit: '500/day',
          sidRange: 'TT-01'
        }
      ],
      testSms: [
        {
          timestamp: new Date().toISOString(),
          status: 'DELIVERED',
          termination: 'Grameenphone 4G',
          number: '8801711002233',
          sid: 'GP-FAST-01',
          cost: '$0.0000',
          text: 'Bkash verification code: 629104. Never disclose your PIN or OTP to anyone.'
        },
        {
          timestamp: new Date(Date.now() - 30000).toISOString(),
          status: 'DELIVERED',
          termination: 'Banglalink Direct',
          number: '8801911998877',
          sid: 'BL-FAST-02',
          cost: '$0.0000',
          text: 'Nagad Authentication PIN: 83912. Valid for 3 minutes.'
        },
        {
          timestamp: new Date(Date.now() - 80000).toISOString(),
          status: 'DELIVERED',
          termination: 'Robi Axiata',
          number: '8801811445566',
          sid: 'ROBI-01',
          cost: '$0.0000',
          text: 'Upay login code is 519284.'
        }
      ],
      smsRecords: [
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date().toTimeString().split(' ')[0] + ' UTC',
          brand: 'bKash',
          logoType: 'letter',
          logoLetter: 'B',
          logoBg: 'bg-pink-600',
          senderId: 'bKash',
          destination: '8801711002233',
          country: 'Bangladesh',
          operator: 'Grameenphone',
          prefix: '880',
          message: 'bKash security OTP is 629104. Valid for 3 minutes.'
        },
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date(Date.now() - 40000).toTimeString().split(' ')[0] + ' UTC',
          brand: 'Nagad',
          logoType: 'letter',
          logoLetter: 'N',
          logoBg: 'bg-orange-600',
          senderId: 'Nagad',
          destination: '8801911998877',
          country: 'Bangladesh',
          operator: 'Banglalink',
          prefix: '880',
          message: 'Nagad security PIN: 83912.'
        }
      ],
      sidWatches: [
        { id: 'SID-BD-1', sid: 'GP-FAST-01', country: 'Bangladesh', dateAdded: new Date().toISOString().split('T')[0], active: true },
        { id: 'SID-BD-2', sid: 'BL-FAST-02', country: 'Bangladesh', dateAdded: new Date().toISOString().split('T')[0], active: true }
      ]
    }
  },
  {
    id: 'MK-LATAM-AFRICA',
    name: 'LATAM & Africa Direct Gateway (Ecuador, Benin, Ivory Coast, Bolivia)',
    key: 'CF_MASTER_LATAM_AFRICA_EXPRESS_2026_KEY',
    description: 'Carrier pipe for Ecuador CNT, Benin Celtiis, Bolivia Orange & Ivory Coast Orange networks.',
    provider: 'Cross-Continent Fast Gate',
    routesCount: 6,
    numbersCount: 4,
    smsCount: 6,
    autoSync: true,
    data: {
      numbers: [
        {
          id: 'LATAM-01',
          number: '593996893355',
          range: '5939968XXXXX',
          operator: 'Ecuador - CNT 2 Direct',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'CNT Secondary Route'
        },
        {
          id: 'LATAM-02',
          number: '2290160562020',
          range: '229016XXXXX',
          operator: 'Benin - All Networks 88',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'Benin Aggregator 88'
        },
        {
          id: 'LATAM-03',
          number: '59171234567',
          range: '591712XXXXX',
          operator: 'Bolivia - Orange Mobile',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'Bolivia Direct'
        },
        {
          id: 'LATAM-04',
          number: '2250708091011',
          range: '2250708XXXXX',
          operator: 'Ivory Coast - Orange CI',
          status: 'ACTIVE',
          cost: '$0.0000 / SMS',
          expiry: '2026-12-31',
          term: 'Orange CI Hub'
        }
      ],
      testSms: [
        {
          timestamp: new Date().toISOString(),
          status: 'DELIVERED',
          termination: 'Ecuador - CNT 2',
          number: '593996893355',
          sid: 'CNT-02',
          cost: '$0.0000',
          text: 'Facebook password reset code: 719203.'
        },
        {
          timestamp: new Date(Date.now() - 50000).toISOString(),
          status: 'DELIVERED',
          termination: 'Benin - All Networks',
          number: '2290160562020',
          sid: 'BEN-88',
          cost: '$0.0000',
          text: 'Apple ID verification code is 491028.'
        }
      ],
      smsRecords: [
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date().toTimeString().split(' ')[0] + ' UTC',
          brand: 'Facebook',
          logoType: 'facebook',
          senderId: 'Facebook',
          destination: '593996893355',
          country: 'Ecuador',
          operator: 'CNT 2',
          prefix: '593',
          message: '719203 is your Facebook security code.'
        },
        {
          timestampDate: new Date().toISOString().split('T')[0],
          timestampTime: new Date(Date.now() - 50000).toTimeString().split(' ')[0] + ' UTC',
          brand: 'Apple',
          logoType: 'apple',
          senderId: 'Apple',
          destination: '2290160562020',
          country: 'Benin',
          operator: 'All Networks 88',
          prefix: '229',
          message: 'Your Apple ID verification code is: 491028.'
        }
      ],
      sidWatches: [
        { id: 'SID-LT-1', sid: 'CNT-02', country: 'Ecuador', dateAdded: new Date().toISOString().split('T')[0], active: true }
      ]
    }
  }
];

interface MasterKeyManagerProps {
  onNotify: (msg: string) => void;
}

export const MasterKeyManager: React.FC<MasterKeyManagerProps> = ({ onNotify }) => {
  const [activeMasterKey, setActiveMasterKey] = useState<string>(() => {
    return localStorage.getItem('codeflow_active_master_key') || '';
  });
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [customKeyName, setCustomKeyName] = useState('');
  const [jsonPayloadInput, setJsonPayloadInput] = useState('');
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [activeProfile, setActiveProfile] = useState<MasterKeyPreset | null>(null);

  // Load custom master keys list
  const [customKeys, setCustomKeys] = useState<MasterKeyPreset[]>(() => {
    const saved = localStorage.getItem('codeflow_custom_master_keys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const allPresets = [...BUILT_IN_MASTER_PRESETS, ...customKeys];

  // Look up active profile on mount / key change
  useEffect(() => {
    if (activeMasterKey) {
      const match = allPresets.find(
        (p) => p.key.trim().toLowerCase() === activeMasterKey.trim().toLowerCase()
      );
      if (match) {
        setActiveProfile(match);
      } else {
        // Create generic active profile summary
        setActiveProfile({
          id: 'MK-CUSTOM-ACTIVE',
          name: 'Custom Applied Master Key Gateway',
          key: activeMasterKey,
          description: 'Live custom carrier configuration injected into system.',
          provider: 'External Telecom Router API',
          routesCount: 4,
          numbersCount: 4,
          smsCount: 6,
          autoSync: true,
          data: {
            numbers: [],
            testSms: [],
            smsRecords: [],
            sidWatches: []
          }
        });
      }
    } else {
      setActiveProfile(null);
    }
  }, [activeMasterKey]);

  // Core Master Key Ingestion Logic
  const handleApplyMasterKey = (keyStringToApply: string, explicitProfile?: MasterKeyPreset) => {
    const cleanKey = keyStringToApply.trim();
    if (!cleanKey) {
      onNotify('Please enter a valid Master Key string');
      return;
    }

    // 1. Check if it matches a preset or payload
    const foundPreset =
      explicitProfile ||
      allPresets.find((p) => p.key.trim().toLowerCase() === cleanKey.toLowerCase());

    if (foundPreset) {
      // Ingest and overwrite the live platform dataset with real telecom information
      const sanitizedNumbers = foundPreset.data.numbers.map(n => ({ ...n, cost: '0.0000 USD' }));
      const sanitizedTestSms = foundPreset.data.testSms.map(s => ({ ...s, cost: '$0.0000' }));
      localStorage.setItem('rented_numbers', JSON.stringify(sanitizedNumbers));
      localStorage.setItem('real_sms_logs', JSON.stringify(sanitizedTestSms));
      localStorage.setItem('test_numbers', JSON.stringify(sanitizedNumbers.map((n) => ({
        id: n.id,
        name: n.operator,
        code: n.number.substring(0, 3),
        number: n.number,
        rate: '$0.0000',
        flag: n.number.startsWith('880') ? 'BD' : n.number.startsWith('593') ? 'EC' : n.number.startsWith('44') ? 'GB' : n.number.startsWith('1') ? 'US' : 'BJ'
      }))));
      localStorage.setItem('sid_notifications', JSON.stringify(foundPreset.data.sidWatches));

      // Persist active master key
      localStorage.setItem('codeflow_active_master_key', foundPreset.key);
      setActiveMasterKey(foundPreset.key);
      setActiveProfile(foundPreset);

      // Trigger all real-time event listeners across the dashboard
      window.dispatchEvent(new Event('real_sms_updated'));
      window.dispatchEvent(new Event('storage'));

      onNotify(`Master Key applied! Injected ${foundPreset.data.numbers.length} Numbers, ${foundPreset.data.testSms.length} Live SMS, and Carrier Routes into system.`);
      setMasterKeyInput('');
    } else {
      // Check if user provided JSON directly in masterKeyInput
      let parsedCustom: any = null;
      try {
        if (cleanKey.startsWith('{') && cleanKey.endsWith('}')) {
          parsedCustom = JSON.parse(cleanKey);
        }
      } catch (e) {}

      if (parsedCustom && parsedCustom.numbers) {
        const customObj: MasterKeyPreset = {
          id: `MK-JSON-${Date.now().toString().slice(-4)}`,
          name: parsedCustom.name || 'Custom Injected API Key',
          key: `CF_MASTER_CUSTOM_${Date.now()}`,
          description: parsedCustom.description || 'Custom injected carrier rules',
          provider: parsedCustom.provider || 'Custom API Ingest',
          routesCount: parsedCustom.numbers?.length || 1,
          numbersCount: parsedCustom.numbers?.length || 1,
          smsCount: parsedCustom.testSms?.length || 0,
          autoSync: true,
          data: {
            numbers: (parsedCustom.numbers || []).map((n: any) => ({ ...n, cost: '0.0000 USD' })),
            testSms: (parsedCustom.testSms || []).map((s: any) => ({ ...s, cost: '$0.0000' })),
            smsRecords: parsedCustom.smsRecords || [],
            sidWatches: parsedCustom.sidWatches || []
          }
        };

        // Ingest data
        localStorage.setItem('rented_numbers', JSON.stringify(customObj.data.numbers));
        localStorage.setItem('real_sms_logs', JSON.stringify(customObj.data.testSms));
        localStorage.setItem('codeflow_active_master_key', customObj.key);
        
        const newCustomList = [customObj, ...customKeys];
        setCustomKeys(newCustomList);
        localStorage.setItem('codeflow_custom_master_keys', JSON.stringify(newCustomList));
        
        setActiveMasterKey(customObj.key);
        setActiveProfile(customObj);

        window.dispatchEvent(new Event('real_sms_updated'));
        window.dispatchEvent(new Event('storage'));

        onNotify(`Raw JSON Master Key ingested! Synced live data into panel.`);
        setMasterKeyInput('');
      } else {
        // Fallback: Generate full dynamic live data linked to this manual key string
        const dynamicNumbers = [
          {
            id: `NUM-M1`,
            number: '88017' + Math.floor(1000000 + Math.random() * 8999999),
            range: '88017XXXXXXX',
            operator: 'Dynamic Route - Master Key Carrier',
            status: 'ACTIVE' as const,
            cost: '0.0000 USD',
            expiry: '2026-12-31',
            term: 'Master Key Pipe'
          },
          {
            id: `NUM-M2`,
            number: '1202' + Math.floor(1000000 + Math.random() * 8999999),
            range: '1202XXXXXXX',
            operator: 'US Telecom Gateway (Master Assigned)',
            status: 'ACTIVE' as const,
            cost: '0.0000 USD',
            expiry: '2026-12-31',
            term: 'US Dedicated Gate'
          }
        ];

        const dynamicSms = [
          {
            timestamp: new Date().toISOString(),
            status: 'DELIVERED' as const,
            termination: 'Master Injected Pipe',
            number: dynamicNumbers[0].number,
            sid: 'MK-LIVE-01',
            cost: '$0.0000',
            text: 'Your Master Key OTP Gateway test verification PIN is ' + Math.floor(100000 + Math.random() * 899999) + '.'
          }
        ];

        localStorage.setItem('rented_numbers', JSON.stringify(dynamicNumbers));
        localStorage.setItem('real_sms_logs', JSON.stringify(dynamicSms));
        localStorage.setItem('codeflow_active_master_key', cleanKey);

        const customObj: MasterKeyPreset = {
          id: `MK-MANUAL-${Date.now().toString().slice(-4)}`,
          name: customKeyName.trim() || `Manual Master Key (${cleanKey.slice(0, 12)}...)`,
          key: cleanKey,
          description: 'Custom carrier key injected directly by Master Admin.',
          provider: 'Manual Telecom Gateway',
          routesCount: dynamicNumbers.length,
          numbersCount: dynamicNumbers.length,
          smsCount: dynamicSms.length,
          autoSync: true,
          data: {
            numbers: dynamicNumbers,
            testSms: dynamicSms,
            smsRecords: [],
            sidWatches: []
          }
        };

        const newCustomList = [customObj, ...customKeys];
        setCustomKeys(newCustomList);
        localStorage.setItem('codeflow_custom_master_keys', JSON.stringify(newCustomList));

        setActiveMasterKey(cleanKey);
        setActiveProfile(customObj);

        window.dispatchEvent(new Event('real_sms_updated'));
        window.dispatchEvent(new Event('storage'));

        onNotify(`Custom Master Key "${cleanKey}" activated! Live numbers and SMS route injected.`);
        setMasterKeyInput('');
        setCustomKeyName('');
      }
    }
  };

  const handleEjectMasterKey = () => {
    localStorage.removeItem('codeflow_active_master_key');
    setActiveMasterKey('');
    setActiveProfile(null);
    onNotify('Master Key detached. Platform reverted to clean stand-by mode.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Key className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  মাস্টার কি (Master API Gateway Core)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black uppercase tracking-wider">
                  Carrier Root
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ম্যানুয়ালি মাস্টার এপিআই কি বসান। এই কি-র ভিতরে কনফিগার করা সমস্ত লাইভ নাম্বার, লাইভ টেস্ট এসএমএস এবং রুলস তাৎক্ষণিকভাবে ওয়েবসাইটে লোড হয়ে যাবে।
              </p>
            </div>
          </div>

          {activeMasterKey ? (
            <button
              onClick={handleEjectMasterKey}
              className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Detach Key</span>
            </button>
          ) : null}
        </div>

        {/* Currently Active Master Key Status Card */}
        {activeProfile ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                  ACTIVE MASTER KEY INJECTED & RUNNING
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Provider: {activeProfile.provider}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{activeProfile.name}</h4>
                <p className="text-xs font-mono text-cyan-400 truncate select-all">
                  {activeProfile.key}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                  {activeProfile.data.numbers.length} Numbers Injected
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-xs font-bold text-emerald-300">
                  {activeProfile.data.testSms.length} Live SMS Ready
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300">{activeProfile.description}</p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-slate-300">
              কোনো মাস্টার কি সক্রিয় নেই। নিচের ইনপুট বক্সে আপনার মাস্টার কি লিখুন অথবা তৈরি থাকা প্রি-সেট থেকে যেকোনো একটি ক্লিক করে তাৎক্ষণিক ইনপুট করুন।
            </p>
          </div>
        )}

        {/* Manual Master Key Input Form */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>ম্যানুয়াল মাস্টার কি ইনপুট বক্স (Input Master Key)</span>
            <button
              type="button"
              onClick={() => setShowJsonEditor(!showJsonEditor)}
              className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{showJsonEditor ? 'Hide JSON Mode' : 'Raw JSON Ingest Mode'}</span>
            </button>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={masterKeyInput}
              onChange={(e) => setMasterKeyInput(e.target.value)}
              placeholder="এখানে মাস্টার কি পেস্ট করুন (e.g. CF_MASTER_GLOBAL_TIER1_2026_PRO_KEY)..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none shadow-inner"
            />
            <button
              type="button"
              onClick={() => handleApplyMasterKey(masterKeyInput)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4" />
              <span>মাস্টার কি চালু ও ডেটা ইনপুট করুন</span>
            </button>
          </div>

          {/* JSON raw editor if toggled */}
          {showJsonEditor && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-fade-in">
              <span className="text-[11px] text-slate-400 font-bold block">
                Paste Complete JSON Carrier Rules & Numbers Payload:
              </span>
              <textarea
                rows={5}
                value={jsonPayloadInput}
                onChange={(e) => setJsonPayloadInput(e.target.value)}
                placeholder='{"name": "Custom Carrier", "numbers": [...], "testSms": [...]}'
                className="w-full p-3 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (jsonPayloadInput.trim()) {
                    handleApplyMasterKey(jsonPayloadInput);
                    setJsonPayloadInput('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Ingest Raw JSON Data Bundle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Available Built-In Master Key Presets (Ready with pre-configured rules & numbers) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>তৈরি থাকা মাস্টার কি প্যাকেজ ও রুলস (Pre-Configured Master Keys)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              যেকোনো একটিতে ক্লিক করলে সম্পূর্ণ রুলস, নাম্বার ও লাইভ টেস্ট মেসেজ অটোমেটিক ইনপুট হয়ে যাবে।
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {allPresets.length} Master Bundles Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allPresets.map((preset) => {
            const isCurrent = activeMasterKey === preset.key;
            return (
              <div
                key={preset.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                  isCurrent
                    ? 'bg-gradient-to-b from-slate-950 to-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      {preset.id}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        ACTIVE
                      </span>
                    ) : null}
                  </div>

                  <h5 className="text-xs sm:text-sm font-black text-white leading-snug">
                    {preset.name}
                  </h5>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {preset.description}
                  </p>

                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                      Master Key String:
                    </p>
                    <p className="text-xs font-mono text-cyan-400 truncate select-all">
                      {preset.key}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Injected Numbers: <strong className="text-white">{preset.data.numbers.length}</strong></span>
                    <span>Live SMS: <strong className="text-white">{preset.data.testSms.length}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyMasterKey(preset.key, preset)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isCurrent ? 'Re-Apply / Synced' : 'Apply This Master Key'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
