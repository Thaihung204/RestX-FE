'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  ReferenceDot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { PeriodType } from '@/app/lib/types/snapshot.types';
import { formatDate, formatMonthLabel } from '@/app/lib/utils/snapshot-formatters';

interface CustomersChartProps {
  data: BreakdownEntry[];
  periodType?: PeriodType;
}

export const CustomersChart: React.FC<CustomersChartProps> = ({ data, periodType = 'monthly' }) => {
  const { t } = useTranslation();
  const cumulativeLabel = t('strategyReport.chart.cumulativeCustomers');

  const dateFormatter = periodType === 'yearly' ? formatMonthLabel : formatDate;

  let runningTotal = 0;
  const chartData = data.map((entry) => {
    runningTotal += entry.newCustomers;
    return {
      date: dateFormatter(entry.date),
      newCustomers: entry.newCustomers,
      cumulativeCustomers: runningTotal,
    };
  });

  const peakPoint = chartData.reduce(
    (max, item) => (item.cumulativeCustomers > max.cumulativeCustomers ? item : max),
    chartData[0]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: 'var(--primary)' }}>
            {t('strategyReport.chart.newCustomers')}: {payload[0].payload.newCustomers}
          </p>
          <p className="ts-chart-tooltip-row" style={{ color: 'var(--text)' }}>
            {cumulativeLabel}: {payload[0].payload.cumulativeCustomers}
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
          <YAxis
            width={42}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            stroke="var(--border)"
            allowDecimals={false}
            domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.15))]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulativeCustomers"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorCust)"
            name={cumulativeLabel}
            dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: 'var(--primary)', strokeWidth: 2, fill: 'var(--card)' }}
          />
          {peakPoint && (
            <ReferenceDot
              x={peakPoint.date}
              y={peakPoint.cumulativeCustomers}
              r={5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={1.5}
              ifOverflow="visible"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item">
          <span className="ts-chart-legend-dot" style={{ background: 'var(--primary)' }} />
          {cumulativeLabel}
        </span>
      </div>
    </div>
  );
};
