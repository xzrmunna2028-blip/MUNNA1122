import { MetricData, RealtimeCounters, NotificationItem, MessageLog, DailyChartPoint } from '../types';

export const emptyMetricData: MetricData = {
  messages: 0,
  delivered: 0,
  failed: 0,
  todayCount: 0,
  deliveryRate: 0,
  todayDate: '9/7/2026',
};

export const emptyRealtimeCounters: RealtimeCounters = {
  totalMessages: 0,
  delivered: 0,
  failed: 0,
  charged: 0,
};

export const sample7DaysData: MetricData = {
  messages: 14250,
  delivered: 13910,
  failed: 340,
  todayCount: 2180,
  deliveryRate: 97.6,
  todayDate: '9/7/2026',
};

export const sample30DaysData: MetricData = {
  messages: 68400,
  delivered: 66820,
  failed: 1580,
  todayCount: 2180,
  deliveryRate: 97.7,
  todayDate: '9/7/2026',
};

export const sample90DaysData: MetricData = {
  messages: 215000,
  delivered: 209800,
  failed: 5200,
  todayCount: 2180,
  deliveryRate: 97.5,
  todayDate: '9/7/2026',
};

export const sampleChart7Days: DailyChartPoint[] = [
  { date: 'Sep 1', total: 1800, delivered: 1760, failed: 40 },
  { date: 'Sep 2', total: 2100, delivered: 2050, failed: 50 },
  { date: 'Sep 3', total: 1950, delivered: 1900, failed: 50 },
  { date: 'Sep 4', total: 2200, delivered: 2150, failed: 50 },
  { date: 'Sep 5', total: 2020, delivered: 1980, failed: 40 },
  { date: 'Sep 6', total: 2000, delivered: 1950, failed: 50 },
  { date: 'Sep 7', total: 2180, delivered: 2120, failed: 60 },
];

export const sampleChart30Days: DailyChartPoint[] = [
  { date: 'Aug 10', total: 8500, delivered: 8300, failed: 200 },
  { date: 'Aug 15', total: 9100, delivered: 8900, failed: 200 },
  { date: 'Aug 20', total: 9600, delivered: 9400, failed: 200 },
  { date: 'Aug 25', total: 10200, delivered: 9950, failed: 250 },
  { date: 'Aug 30', total: 9800, delivered: 9550, failed: 250 },
  { date: 'Sep 4', total: 10500, delivered: 10250, failed: 250 },
  { date: 'Sep 7', total: 10700, delivered: 10470, failed: 230 },
];

export const sampleChart90Days: DailyChartPoint[] = [
  { date: 'Jun 15', total: 22000, delivered: 21400, failed: 600 },
  { date: 'Jun 30', total: 24100, delivered: 23500, failed: 600 },
  { date: 'Jul 15', total: 23500, delivered: 22900, failed: 600 },
  { date: 'Jul 30', total: 25000, delivered: 24400, failed: 600 },
  { date: 'Aug 15', total: 26200, delivered: 25600, failed: 600 },
  { date: 'Aug 30', total: 24800, delivered: 24150, failed: 650 },
  { date: 'Sep 7', total: 27400, delivered: 26800, failed: 600 },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'SMS Route Connected',
    message: 'Primary SMPP gateway connection established successfully.',
    time: '5m ago',
    read: false,
    type: 'success',
  },
  {
    id: '2',
    title: 'Daily Report Ready',
    message: 'Aggregated performance report for 9/7/2026 is ready.',
    time: '1h ago',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'Low Balance Warning',
    message: 'Uninvoiced threshold approaching 80% of soft limit.',
    time: '3h ago',
    read: true,
    type: 'warning',
  },
];

export const initialMessageLogs: MessageLog[] = [
  {
    id: 'MSG-98012',
    recipient: '+1 (555) 019-2831',
    status: 'DELIVERED',
    type: 'OTP',
    timestamp: '14:28:10',
    cost: '$0.0000',
  },
  {
    id: 'MSG-98011',
    recipient: '+880 1712 345678',
    status: 'DELIVERED',
    type: 'Transactional',
    timestamp: '14:27:44',
    cost: '$0.0000',
  },
  {
    id: 'MSG-98010',
    recipient: '+44 7700 900077',
    status: 'FAILED',
    type: 'Marketing',
    timestamp: '14:25:01',
    cost: '$0.0000',
  },
  {
    id: 'MSG-98009',
    recipient: '+1 (555) 832-1190',
    status: 'DELIVERED',
    type: 'OTP',
    timestamp: '14:22:15',
    cost: '$0.0000',
  },
  {
    id: 'MSG-98008',
    recipient: '+880 1819 876543',
    status: 'DELIVERED',
    type: 'Transactional',
    timestamp: '14:20:02',
    cost: '$0.0000',
  },
];
