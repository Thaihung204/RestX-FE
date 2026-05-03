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
import { formatDate } from '@/app/lib/utils/snapshot-formatters';

interface ReservationsChartProps {
  data: BreakdownEntry[];
}

export const ReservationsChart: React.FC<ReservationsChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = data.map((entry) => ({
    date: formatDate(entry.date),
    newReservations: entry.newReservations,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: '#8b5cf6' }}>
            {t('strategyReport.chart.reservations')}: {payload[0].value}
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
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="newReservations"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.reservations')}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: '#8b5cf6' }} />{t('strategyReport.chart.reservations')}</span>
      </div>
    </div>
  );
};
