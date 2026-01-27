'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getApiBaseUrl, getTenantFromDomain, isAdminDomain, isTenantDomain } from '@/lib/config/apiConfig';
import { setAxiosBaseUrl } from '@/lib/services/axiosInstance';

interface ApiConfigContextType {
  baseUrl: string;
  tenant: string | null;
  isAdmin: boolean;
  isTenant: boolean;
  isLoading: boolean;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ApiConfigContextType>({
    baseUrl: '',
    tenant: null,
    isAdmin: false,
    isTenant: false,
    isLoading: true,
  });

  useEffect(() => {
    // Initialize API config based on domain
    const baseUrl = getApiBaseUrl();
    const tenant = getTenantFromDomain();
    const isAdmin = isAdminDomain();
    const isTenant = isTenantDomain();

    // Update axios instance
    setAxiosBaseUrl(baseUrl);

    setConfig({
      baseUrl,
      tenant,
      isAdmin,
      isTenant,
      isLoading: false,
    });

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('API Config Initialized:', {
        domain: window.location.host,
        baseUrl,
        tenant,
        isAdmin,
        isTenant,
      });
    }
  }, []);

  return (
    <ApiConfigContext.Provider value={config}>
      {children}
    </ApiConfigContext.Provider>
  );
}

/**
 * Hook to access API configuration
 * Must be used within ApiConfigProvider
 */
export function useApiConfig() {
  const context = useContext(ApiConfigContext);
  
  if (context === undefined) {
    throw new Error('useApiConfig must be used within ApiConfigProvider');
  }
  
  return context;
}
