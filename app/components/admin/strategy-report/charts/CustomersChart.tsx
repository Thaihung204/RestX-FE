'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { formatDate } from '@/app/lib/utils/snapshot-formatters';

interface CustomersChartProps {
  data: BreakdownEntry[];
}

export const CustomersChart: React.FC<CustomersChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const chartData = data.map((entry) => ({
    date: formatDate(entry.date),
    newCustomers: entry.newCustomers,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: 'var(--primary)' }}>
            {t('strategyReport.chart.newCustomers')}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ts-chart-card">
      <h4 className="ts-chart-title">{t('strategyReport.chart.customersTitle')}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} stroke="var(--border)" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="newCustomers"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCust)"
            name={t('strategyReport.chart.newCustomers')}
            dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: 'var(--primary)', strokeWidth: 2, fill: 'var(--card)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: 'var(--primary)' }} />{t('strategyReport.chart.newCustomers')}</span>
      </div>
    </div>
  );
};
