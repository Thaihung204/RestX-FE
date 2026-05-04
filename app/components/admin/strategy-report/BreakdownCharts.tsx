 'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { PeriodType } from '@/app/lib/types/snapshot.types';
import { groupBreakdownByMonth } from '@/app/lib/utils/snapshot-formatters';
import { RevenueChart } from './charts/RevenueChart';
import { OrdersChart } from './charts/OrdersChart';
import { CustomersChart } from './charts/CustomersChart';
import { ReservationsChart } from './charts/ReservationsChart';

interface BreakdownChartsProps {
  breakdown: BreakdownEntry[];
  periodType?: PeriodType;
  isFallback?: boolean;
}

export const BreakdownCharts: React.FC<BreakdownChartsProps> = ({ breakdown, periodType = 'monthly', isFallback = false }) => {
  const { t } = useTranslation();

  // Group daily data by month for yearly views
  const processedData = useMemo(() => {
    if (!breakdown || breakdown.length === 0) {
      return [];
    }

    if (periodType === 'yearly' && breakdown.length > 0) {
      // Check if data is daily (has many entries) - if so, group by month
      if (breakdown.length > 12) {
        return groupBreakdownByMonth(breakdown);
      }
    }
    return breakdown;
  }, [breakdown, periodType]);

  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={processedData} periodType={periodType} />
        <OrdersChart data={processedData} periodType={periodType} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomersChart data={processedData} periodType={periodType} />
        <ReservationsChart data={processedData} periodType={periodType} />
      </div>
      {isFallback && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {t ? t('strategyReport.fallbackNotice', 'Dữ liệu được nội suy vì backend chưa cung cấp dữ liệu chi tiết.') : 'Dữ liệu được nội suy vì backend chưa cung cấp dữ liệu chi tiết.'}
        </div>
      )}
    </div>
  );
};
