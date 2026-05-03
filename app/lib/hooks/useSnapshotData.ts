'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AllTenantsSnapshot,
  TenantDetailSnapshot,
  SnapshotState,
  PeriodType,
  CustomDateRange,
} from '@/app/lib/types/snapshot.types';
  import axiosInstance from '@/lib/services/axiosInstance';

export const useSnapshotData = () => {
  const { t } = useTranslation();

  const [state, setState] = useState<SnapshotState>({
    periodType: 'monthly',
    customRange: null,
    selectedTenantId: null,
    allTenantsData: null,
    tenantDetailData: null,
    loading: false,
    error: null,
  });

  /**
   * Fetch all tenants summary data
   */
  const fetchAllTenants = useCallback(
    async (periodType: PeriodType, customRange?: CustomDateRange) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        let url = `/snapshots?periodType=${periodType}`;

        if (periodType === 'custom' && customRange) {
          url += `&startDate=${customRange.start}&endDate=${customRange.end}`;
        }

        const response = await axiosInstance.get<AllTenantsSnapshot>(url);

        setState((prev) => ({
          ...prev,
          allTenantsData: response.data,
          periodType,
          customRange: periodType === 'custom' ? customRange ?? null : null,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.errors.load_failed');
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    },
    [t]
  );

  /**
   * Fetch detail snapshot for a specific tenant
   */
  const fetchTenantDetail = useCallback(
    async (tenantId: string, periodType: PeriodType, customRange?: CustomDateRange) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        let url = `/snapshots?periodType=${periodType}&tenantId=${tenantId}`;

        if (periodType === 'custom' && customRange) {
          url += `&startDate=${customRange.start}&endDate=${customRange.end}`;
        }

        const response = await axiosInstance.get<TenantDetailSnapshot>(url);

        setState((prev) => ({
          ...prev,
          tenantDetailData: response.data,
          selectedTenantId: tenantId,
          loading: false,
        }));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('common.errors.load_failed');
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      }
    },
    [t]
  );

  /**
   * Reset to all-tenants view
   */
  const resetToAllTenants = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTenantId: null,
      tenantDetailData: null,
    }));
  }, []);

  /**
   * Change period and refetch data
   */
  const changePeriod = useCallback(
    async (newPeriodType: PeriodType, customRange?: CustomDateRange) => {
      setState((prev) => ({
        ...prev,
        periodType: newPeriodType,
        customRange: newPeriodType === 'custom' ? customRange ?? null : null,
      }));

      // If viewing a tenant detail, refetch with new period
      if (state.selectedTenantId) {
        await fetchTenantDetail(state.selectedTenantId, newPeriodType, customRange);
      } else {
        // Otherwise refetch all tenants
        await fetchAllTenants(newPeriodType, customRange);
      }
    },
    [state.selectedTenantId, fetchTenantDetail, fetchAllTenants]
  );

  return {
    state,
    fetchAllTenants,
    fetchTenantDetail,
    resetToAllTenants,
    changePeriod,
  };
};
