'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { PeriodType } from '@/app/lib/types/snapshot.types';
import { formatDate, formatMonthLabel } from '@/app/lib/utils/snapshot-formatters';

interface ReservationsChartProps {
  data: BreakdownEntry[];
  periodType?: PeriodType;
}

export const ReservationsChart: React.FC<ReservationsChartProps> = ({ data, periodType = 'monthly' }) => {
  const { t } = useTranslation();
  const rollingAverageLabel = t('strategyReport.chart.rollingAverage3Days');

  const dateFormatter = periodType === 'yearly' ? formatMonthLabel : formatDate;

  const chartData = data.map((entry, index) => {
    const start = Math.max(0, index - 2);
    const window = data.slice(start, index + 1);
    const movingAverage =
      window.length > 0
        ? Number((window.reduce((sum, item) => sum + item.newReservations, 0) / window.length).toFixed(1))
        : 0;

    return {
      date: dateFormatter(entry.date),
      newReservations: entry.newReservations,
      movingAverage,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: '#8b5cf6' }}>
            {t('strategyReport.chart.reservations')}: {payload[0].payload.newReservations}
          </p>
          <p className="ts-chart-tooltip-row" style={{ color: '#f97316' }}>
            {rollingAverageLabel}: {payload[0].payload.movingAverage}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ts-chart-card">
      <h4 className="ts-chart-title">{t('strategyReport.chart.reservationsTitle')}</h4>
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
          <Bar
            dataKey="newReservations"
            fill="#8b5cf6"
            radius={[6, 6, 0, 0]}
            barSize={16}
            name={t('strategyReport.chart.reservations')}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#f97316"
            strokeWidth={2.2}
            dot={{ fill: '#f97316', r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4.5, stroke: '#f97316', strokeWidth: 2, fill: 'var(--card)' }}
            name={rollingAverageLabel}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item">
          <span className="ts-chart-legend-dot" style={{ background: '#8b5cf6' }} />
          {t('strategyReport.chart.reservations')}
        </span>
        <span className="ts-chart-legend-item">
          <span className="ts-chart-legend-dot" style={{ background: '#f97316' }} />
          {rollingAverageLabel}
        </span>
      </div>
    </div>
  );
};
