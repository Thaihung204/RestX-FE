'use client';

import React from 'react';
import { BreakdownEntry } from '@/app/lib/types/snapshot.types';
import { RevenueChart } from './charts/RevenueChart';
import { OrdersChart } from './charts/OrdersChart';
import { CustomersChart } from './charts/CustomersChart';
import { ReservationsChart } from './charts/ReservationsChart';

interface BreakdownChartsProps {
  breakdown: BreakdownEntry[];
}

export const BreakdownCharts: React.FC<BreakdownChartsProps> = ({ breakdown }) => {
  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={breakdown} />
        <OrdersChart data={breakdown} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomersChart data={breakdown} />
        <ReservationsChart data={breakdown} />
      </div>
    </div>
  );
};
