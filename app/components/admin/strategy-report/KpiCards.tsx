'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatVND,
  formatCompletionRate,
  getCancellationSeverity,
} from '@/app/lib/utils/snapshot-formatters';

interface KpiCardsProps {
  totalRevenue: number;
  completedOrders: number;
  totalOrders: number;
  cancelledOrders: number;
  newCustomers: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalRevenue,
  completedOrders,
  totalOrders,
  cancelledOrders,
  newCustomers,
}) => {
  const { t } = useTranslation();

  const completionRate = formatCompletionRate(completedOrders, totalOrders);
  const cancellationRate =
    totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : '0';
  const cancellationSeverity = getCancellationSeverity(cancelledOrders, totalOrders);

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Revenue Card */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-600 mb-2">
          {t('strategyReport.kpi.totalRevenue')}
        </div>
        <div className="text-2xl font-bold text-[var(--primary)]">{formatVND(totalRevenue)}</div>
        <div className="text-xs text-gray-500 mt-2">
          {t('strategyReport.kpi.revenueSubtext')}
        </div>
      </div>

      {/* Completion Rate Card */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-600 mb-2">
          {t('strategyReport.kpi.completionRate')}
        </div>
        <div className="text-2xl font-bold text-[var(--primary)]">{completionRate}</div>
        <div className="text-xs text-gray-500 mt-2">
          {t('strategyReport.kpi.completionSubtext')}
        </div>
      </div>

      {/* Cancellation Rate Card */}
      <div
        className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${getSeverityColors(cancellationSeverity)}`}
      >
        <div className="text-sm font-medium mb-2">
          {t('strategyReport.kpi.cancellationRate')}
        </div>
        <div className="text-2xl font-bold">{cancellationRate}%</div>
        <div className="text-xs mt-2">
          {cancellationSeverity === 'danger' && t('strategyReport.kpi.cancellationDanger')}
          {cancellationSeverity === 'warning' && t('strategyReport.kpi.cancellationWarning')}
          {cancellationSeverity === 'normal' && t('strategyReport.kpi.cancellationNormal')}
        </div>
      </div>

      {/* New Customers Card */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-600 mb-2">
          {t('strategyReport.kpi.newCustomers')}
        </div>
        <div className="text-2xl font-bold text-[var(--primary)]">{newCustomers}</div>
        <div className="text-xs text-gray-500 mt-2">
          {t('strategyReport.kpi.newCustomersSubtext')}
        </div>
      </div>
    </div>
  );
};
