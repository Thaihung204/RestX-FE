"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { tenantService, TenantConfig } from "@/lib/services/tenantService";

interface TenantContextType {
    tenant: TenantConfig | null;
    loading: boolean;
    error: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [tenant, setTenant] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                // User requested full host name to handle cases with multiple subdomains or specific ports
                // e.g. "kfc.restx.food" or "localhost:3000"
                const param = window.location.host;

                const data = await tenantService.getTenantConfig(param);
                setTenant(data);
            } catch (err) {
                console.error("Failed to load tenant config", err);
                setError("Failed to load tenant configuration");
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
}
