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
  messages: 0,
  delivered: 0,
  failed: 0,
  todayCount: 0,
  deliveryRate: 0,
  todayDate: '9/8/2026',
};

export const sample30DaysData: MetricData = {
  messages: 0,
  delivered: 0,
  failed: 0,
  todayCount: 0,
  deliveryRate: 0,
  todayDate: '9/8/2026',
};

export const sample90DaysData: MetricData = {
  messages: 0,
  delivered: 0,
  failed: 0,
  todayCount: 0,
  deliveryRate: 0,
  todayDate: '9/8/2026',
};

export const sampleChart7Days: DailyChartPoint[] = [
  { date: 'Sep 2', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 3', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 4', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 5', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 6', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 7', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 8', total: 0, delivered: 0, failed: 0 },
];

export const sampleChart30Days: DailyChartPoint[] = [
  { date: 'Aug 10', total: 0, delivered: 0, failed: 0 },
  { date: 'Aug 15', total: 0, delivered: 0, failed: 0 },
  { date: 'Aug 20', total: 0, delivered: 0, failed: 0 },
  { date: 'Aug 25', total: 0, delivered: 0, failed: 0 },
  { date: 'Aug 30', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 4', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 8', total: 0, delivered: 0, failed: 0 },
];

export const sampleChart90Days: DailyChartPoint[] = [
  { date: 'Jun 15', total: 0, delivered: 0, failed: 0 },
  { date: 'Jun 30', total: 0, delivered: 0, failed: 0 },
  { date: 'Jul 15', total: 0, delivered: 0, failed: 0 },
  { date: 'Jul 30', total: 0, delivered: 0, failed: 0 },
  { date: 'Aug 15', total: 0, delivered: 0, failed: 0 },
  { date: 'Aug 30', total: 0, delivered: 0, failed: 0 },
  { date: 'Sep 8', total: 0, delivered: 0, failed: 0 },
];

export const initialNotifications: NotificationItem[] = [];

export const initialMessageLogs: MessageLog[] = [];
