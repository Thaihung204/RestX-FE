'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { PeriodType } from '@/app/lib/types/snapshot.types';
import { formatDate, formatMonthLabel } from '@/app/lib/utils/snapshot-formatters';

interface OrdersChartProps {
  data: BreakdownEntry[];
  periodType?: PeriodType;
}

export const OrdersChart: React.FC<OrdersChartProps> = ({ data, periodType = 'monthly' }) => {
  const { t } = useTranslation();

  const dateFormatter = periodType === 'yearly' ? formatMonthLabel : formatDate;

  const chartData = data.map((entry) => ({
    date: dateFormatter(entry.date),
    totalOrders: entry.totalOrders,
    completedOrders: entry.completedOrders,
    cancelledOrders: entry.cancelledOrders,
    completionRate: entry.totalOrders > 0 ? Number(((entry.completedOrders / entry.totalOrders) * 100).toFixed(1)) : 0,
  }));

  const averageOrders =
    chartData.length > 0
      ? Number((chartData.reduce((sum, item) => sum + item.totalOrders, 0) / chartData.length).toFixed(1))
      : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: '#3B82F6' }}>
            {t('strategyReport.chart.totalOrders')}: {payload[0].payload.totalOrders}
          </p>
          <p className="ts-chart-tooltip-row" style={{ color: '#22c55e' }}>
            {t('strategyReport.chart.completedOrders')}: {payload[0].payload.completedOrders}
          </p>
          <p className="ts-chart-tooltip-row" style={{ color: '#ef4444' }}>
            {t('strategyReport.chart.cancelledOrders')}: {payload[0].payload.cancelledOrders}
          </p>
          <p className="ts-chart-tooltip-row" style={{ color: 'var(--text)' }}>
            {t('strategyReport.table.completionRate')}: {payload[0].payload.completionRate}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ts-chart-card">
      <h4 className="ts-chart-title">{t('strategyReport.chart.ordersTitle')}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <YAxis
            width={42}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            stroke="var(--border)"
            allowDecimals={false}
            domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.25))]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={averageOrders}
            stroke="color-mix(in srgb, var(--text), transparent 65%)"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Bar dataKey="totalOrders" fill="#3B82F6" name={t('strategyReport.chart.totalOrders')} radius={[6, 6, 0, 0]} barSize={16} />
          <Line
            type="monotone"
            dataKey="completedOrders"
            stroke="#22c55e"
            strokeWidth={2.2}
            dot={{ r: 2.5, fill: '#22c55e' }}
            activeDot={{ r: 4.5, stroke: '#22c55e', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.completedOrders')}
          />
          <Line
            type="monotone"
            dataKey="cancelledOrders"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 2.5, fill: '#ef4444' }}
            activeDot={{ r: 4.5, stroke: '#ef4444', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.cancelledOrders')}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: '#3B82F6' }} />{t('strategyReport.chart.totalOrders')}</span>
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: '#22c55e' }} />{t('strategyReport.chart.completedOrders')}</span>
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: '#ef4444' }} />{t('strategyReport.chart.cancelledOrders')}</span>
      </div>
    </div>
  );
};
