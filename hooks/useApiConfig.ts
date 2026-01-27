import { useEffect, useState } from 'react';
import { getApiBaseUrl, getTenantFromHost, isAdminDomain, isTenantDomain } from '@/utils/getApiBaseUrl';

/**
 * Hook to get API configuration based on current domain
 * Lightweight version without context overhead
 */
export function useApiConfig() {
  const [config, setConfig] = useState({
    baseUrl: '',
    tenant: null as string | null,
    isAdmin: false,
    isTenant: false,
  });

  useEffect(() => {
    setConfig({
      baseUrl: getApiBaseUrl(),
      tenant: getTenantFromHost(),
      isAdmin: isAdminDomain(),
      isTenant: isTenantDomain(),
    });
  }, []);

  return config;
}

/**
 * Hook to get current tenant information
 */
export function useTenant() {
  const [tenant, setTenant] = useState<string | null>(null);

  useEffect(() => {
    setTenant(getTenantFromHost());
  }, []);

  return tenant;
}

/**
 * Hook to check if current domain is admin
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isAdminDomain());
  }, []);

  return isAdmin;
}
