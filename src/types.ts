export type TimePeriod = '7 days' | '30 days' | '90 days';

export interface MetricData {
  messages: number;
  delivered: number;
  failed: number;
  todayCount: number;
  deliveryRate: number;
  todayDate: string;
}

export interface RealtimeCounters {
  totalMessages: number;
  delivered: number;
  failed: number;
  charged: number;
}

export interface CurrencyRevenue {
  currency: string;
  symbol: string;
  amount: number;
  periodLabel: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  recipient?: string;
}

export interface MessageLog {
  id: string;
  recipient: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  type: 'Transactional' | 'OTP' | 'Marketing';
  timestamp: string;
  cost: string;
}

export interface DailyChartPoint {
  date: string;
  total: number;
  delivered: number;
  failed: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  details: string;
  status: 'Verified' | 'Pending Verification';
  createdAt: string;
}

export interface RealSmsLog {
  id: string;
  timestamp: string; // ISO string
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  termination: string;
  number: string;
  sid: string;
  text: string;
  otp?: string;
  cost?: string;
  brand?: string;
}

export interface RentedNumber {
  id: string;
  number: string;
  range: string;
  rangeName?: string;
  country?: string;
  operator: string;
  status: 'ACTIVE' | 'PENDING';
  cost: string;
  rate?: string;
  expiry: string;
  term?: string;
  lastMessage?: string;
  portalLimit?: string;
  sidRange?: string;
  multiLimit?: string;
  sidDidLimit?: string;
}
