'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { formatDate } from '@/app/lib/utils/snapshot-formatters';

interface OrdersChartProps {
  data: BreakdownEntry[];
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = data.map((entry) => ({
    date: formatDate(entry.date),
    totalOrders: entry.totalOrders,
    completedOrders: entry.completedOrders,
    cancelledOrders: entry.cancelledOrders,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm text-gray-700">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {t('strategyReport.chart.ordersTitle')}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="totalOrders"
            fill="#94a3b8"
            name={t('strategyReport.chart.totalOrders')}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="completedOrders"
            fill="var(--primary)"
            name={t('strategyReport.chart.completedOrders')}
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="cancelledOrders"
            fill="#ef4444"
            name={t('strategyReport.chart.cancelledOrders')}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
