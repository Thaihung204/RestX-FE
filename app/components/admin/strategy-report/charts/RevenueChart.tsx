'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { formatVND, formatDate } from '@/app/lib/utils/snapshot-formatters';

interface RevenueChartProps {
  data: BreakdownEntry[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = data.map((entry) => ({
    date: formatDate(entry.date),
    revenue: entry.revenue,
    discountAmount: entry.discountAmount,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: 'var(--primary)' }}>
            {t('strategyReport.chart.revenue')}: {formatVND(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="ts-chart-tooltip-row" style={{ color: '#f97316' }}>
              {t('strategyReport.chart.discount')}: {formatVND(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ts-chart-card">
      <h4 className="ts-chart-title">{t('strategyReport.chart.revenueTitle')}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.8} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" tickFormatter={(v) => formatVND(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="url(#revGrad)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: 'var(--primary)', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.revenue')}
          />
          <Line
            type="monotone"
            dataKey="discountAmount"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#f97316', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.discount')}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: 'var(--primary)' }} />{t('strategyReport.chart.revenue')}</span>
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot ts-chart-legend-dot-dashed" style={{ background: '#f97316' }} />{t('strategyReport.chart.discount')}</span>
      </div>
    </div>
  );
};
