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
  ResponsiveContainer,
} from 'recharts';
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
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="ts-chart-tooltip-row" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ts-chart-card">
      <h4 className="ts-chart-title">{t('strategyReport.chart.ordersTitle')}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="completedOrders" fill="var(--primary)" name={t('strategyReport.chart.completedOrders')} radius={[6, 6, 0, 0]} barSize={16} />
          <Bar dataKey="cancelledOrders" fill="#ef4444" name={t('strategyReport.chart.cancelledOrders')} radius={[6, 6, 0, 0]} barSize={16} />
          <Bar dataKey="totalOrders" fill="color-mix(in srgb, var(--text-muted), transparent 50%)" name={t('strategyReport.chart.totalOrders')} radius={[6, 6, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: 'var(--primary)' }} />{t('strategyReport.chart.completedOrders')}</span>
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: '#ef4444' }} />{t('strategyReport.chart.cancelledOrders')}</span>
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: '#94a3b8' }} />{t('strategyReport.chart.totalOrders')}</span>
      </div>
    </div>
  );
};
