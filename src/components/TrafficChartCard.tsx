import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyChartPoint } from '../types';

interface TrafficChartCardProps {
  chartData: DailyChartPoint[];
  isDemoMode: boolean;
}

export const TrafficChartCard: React.FC<TrafficChartCardProps> = ({
  chartData,
  isDemoMode,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Traffic Trend & Message Volume
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily throughput comparison (Delivered vs Failed)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 dark:text-slate-300">Failed</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="deliveredGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="#14b8a6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#deliveredGrad)"
            />
            <Area
              type="monotone"
              dataKey="failed"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#failedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
