import { useEffect, useState } from 'react';
import { getApiBaseUrl, getTenantFromDomain, isAdminDomain, isTenantDomain } from '@/lib/config/apiConfig';
import { setAxiosBaseUrl } from '@/lib/services/axiosInstance';

/**
 * Hook to get API configuration based on current domain
 * Automatically updates axios instance when domain changes
 */
export function useApiConfig() {
  const [config, setConfig] = useState({
    baseUrl: '',
    tenant: null as string | null,
    isAdmin: false,
    isTenant: false,
  });

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    const tenant = getTenantFromDomain();
    const isAdmin = isAdminDomain();
    const isTenant = isTenantDomain();

    setConfig({
      baseUrl,
      tenant,
      isAdmin,
      isTenant,
    });

    // Update axios instance base URL
    setAxiosBaseUrl(baseUrl);
  }, []);

  return config;
}

/**
 * Hook to get current tenant information
 */
export function useTenant() {
  const [tenant, setTenant] = useState<string | null>(null);

  useEffect(() => {
    setTenant(getTenantFromDomain());
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
