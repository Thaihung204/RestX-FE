'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface TenantConfig {
  key: string;
  name: string;
  phone: string;
  address: string;
  color: string;
  logo: string;
  image: string;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const TenantProvider = ({
  children,
  tenant,
}: {
  children: ReactNode;
  tenant: TenantConfig | null;
}) => {
  return (
    <TenantContext.Provider value={{ tenant, loading: false }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

