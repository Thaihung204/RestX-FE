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

  return (
    <div className="ts-kpi-grid">
      {/* Revenue Card */}
      <div className="ts-kpi-card">
        <div className="ts-kpi-card-accent" style={{ background: 'var(--primary)' }} />
        <p className="ts-kpi-label">{t('strategyReport.kpi.totalRevenue')}</p>
        <p className="ts-kpi-value ts-kpi-value-primary">{formatVND(totalRevenue)}</p>
        <p className="ts-kpi-sub">{t('strategyReport.kpi.revenueSubtext')}</p>
      </div>

      {/* Completion Rate Card */}
      <div className="ts-kpi-card">
        <div className="ts-kpi-card-accent" style={{ background: '#22c55e' }} />
        <p className="ts-kpi-label">{t('strategyReport.kpi.completionRate')}</p>
        <p className="ts-kpi-value ts-kpi-value-primary">{completionRate}</p>
        <p className="ts-kpi-sub">{t('strategyReport.kpi.completionSubtext')}</p>
      </div>

      {/* Cancellation Rate Card */}
      <div className={`ts-kpi-card ts-kpi-card-severity-${cancellationSeverity}`}>
        <div
          className="ts-kpi-card-accent"
          style={{
            background:
              cancellationSeverity === 'danger'
                ? '#ef4444'
                : cancellationSeverity === 'warning'
                  ? '#f59e0b'
                  : '#3b82f6',
          }}
        />
        <p className="ts-kpi-label">{t('strategyReport.kpi.cancellationRate')}</p>
        <p className="ts-kpi-value">{cancellationRate}%</p>
        <p className="ts-kpi-sub">
          {cancellationSeverity === 'danger' && t('strategyReport.kpi.cancellationDanger')}
          {cancellationSeverity === 'warning' && t('strategyReport.kpi.cancellationWarning')}
          {cancellationSeverity === 'normal' && t('strategyReport.kpi.cancellationNormal')}
        </p>
      </div>

      {/* New Customers Card */}
      <div className="ts-kpi-card">
        <div className="ts-kpi-card-accent" style={{ background: '#8b5cf6' }} />
        <p className="ts-kpi-label">{t('strategyReport.kpi.newCustomers')}</p>
        <p className="ts-kpi-value ts-kpi-value-primary">{newCustomers}</p>
        <p className="ts-kpi-sub">{t('strategyReport.kpi.newCustomersSubtext')}</p>
      </div>
    </div>
  );
};
