'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TenantSummary } from '@/app/lib/types/snapshot.types';
import { formatVND, formatCompletionRate } from '@/app/lib/utils/snapshot-formatters';

interface TenantTableProps {
  tenants: TenantSummary[];
  selectedTenantId: string | null;
  isLoading: boolean;
  onTenantSelect: (tenantId: string) => void;
}

type SortField = keyof Pick<
  TenantSummary,
  'revenue' | 'totalOrders' | 'newCustomers' | 'newReservations'
>;

export const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  selectedTenantId,
  isLoading,
  onTenantSelect,
}) => {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedTenants = [...tenants].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300">⇅</span>;
    return <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>;
  };

  if (tenants.length === 0) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg text-center text-gray-500">
        {t('strategyReport.noTenantData')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {t('strategyReport.table.rank')}
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {t('strategyReport.table.tenantId')}
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('revenue')}
            >
              <div className="flex items-center gap-2">
                {t('strategyReport.table.revenue')}
                <SortIcon field="revenue" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('totalOrders')}
            >
              <div className="flex items-center gap-2">
                {t('strategyReport.table.orders')}
                <SortIcon field="totalOrders" />
              </div>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {t('strategyReport.table.completionRate')}
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('newCustomers')}
            >
              <div className="flex items-center gap-2">
                {t('strategyReport.table.newCustomers')}
                <SortIcon field="newCustomers" />
              </div>
            </th>
            <th
              className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('newReservations')}
            >
              <div className="flex items-center gap-2">
                {t('strategyReport.table.reservations')}
                <SortIcon field="newReservations" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTenants.map((tenant, index) => (
            <tr
              key={tenant.tenantId}
              onClick={() => onTenantSelect(tenant.tenantId)}
              className={`border-b border-gray-100 cursor-pointer transition-colors ${
                selectedTenantId === tenant.tenantId
                  ? 'bg-[var(--primary-soft)]'
                  : 'hover:bg-gray-50'
              } ${isLoading ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-3 text-sm font-semibold text-gray-700">#{index + 1}</td>
              <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                {tenant.tenantId.substring(0, 8)}...
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-[var(--primary)]">
                {formatVND(tenant.revenue)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.totalOrders}</td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {formatCompletionRate(tenant.completedOrders, tenant.totalOrders)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.newCustomers}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{tenant.newReservations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
