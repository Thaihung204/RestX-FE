'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { PeriodType } from '@/app/lib/types/snapshot.types';
import { formatVND, formatDate, formatMonthLabel, formatShortNumber } from '@/app/lib/utils/snapshot-formatters';

interface RevenueChartProps {
  data: BreakdownEntry[];
  periodType?: PeriodType;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, periodType = 'monthly' }) => {
  const { t } = useTranslation();

  const dateFormatter = periodType === 'yearly' ? formatMonthLabel : formatDate;

  const chartData = data.map((entry) => ({
    date: dateFormatter(entry.date),
    isoDate: entry.date,
    revenue: entry.revenue,
    discountAmount: entry.discountAmount,
  }));

  const peakPoint = chartData.reduce(
    (max, item) => (item.revenue > max.revenue ? item : max),
    chartData[0]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const revenueValue = payload.find((row: any) => row.dataKey === 'revenue')?.value ?? 0;
      const discountValue = payload.find((row: any) => row.dataKey === 'discountAmount')?.value ?? 0;
      const discountRate = revenueValue > 0 ? ((discountValue / revenueValue) * 100).toFixed(1) : '0.0';

      return (
        <div className="ts-chart-tooltip">
          <p className="ts-chart-tooltip-date">{payload[0].payload.date}</p>
          <p className="ts-chart-tooltip-row" style={{ color: 'var(--primary)' }}>
            {t('strategyReport.chart.revenue')}: {formatVND(revenueValue)}
          </p>
          <p className="ts-chart-tooltip-row" style={{ color: '#f97316' }}>
            {t('strategyReport.chart.discount')}: {formatVND(discountValue)} ({discountRate}%)
          </p>
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
          <YAxis
            yAxisId="left"
            width={58}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            stroke="var(--border)"
            domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.2))]}
            tickFormatter={(v) => `${formatShortNumber(v)}đ`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            width={46}
            tick={{ fontSize: 11, fill: '#f97316' }}
            stroke="var(--border)"
            domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax * 1.35))]}
            tickFormatter={(v) => formatShortNumber(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="url(#revGrad)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: 'var(--primary)', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.revenue')}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="discountAmount"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#f97316', strokeWidth: 2, fill: 'var(--card)' }}
            name={t('strategyReport.chart.discount')}
          />
          {peakPoint && (
            <ReferenceDot
              yAxisId="left"
              x={peakPoint.date}
              y={peakPoint.revenue}
              r={5}
              fill="var(--primary)"
              stroke="#fff"
              strokeWidth={1.5}
              ifOverflow="visible"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="ts-chart-legend">
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot" style={{ background: 'var(--primary)' }} />{t('strategyReport.chart.revenue')}</span>
        <span className="ts-chart-legend-item"><span className="ts-chart-legend-dot ts-chart-legend-dot-dashed" style={{ background: '#f97316' }} />{t('strategyReport.chart.discount')}</span>
      </div>
    </div>
  );
};
