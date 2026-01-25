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
                const param = window.location.host;

                // Prevent infinite loop: If we are already on the main landing page, stop checking.
                if (param === "restx.food" || param === "www.restx.food") {
                    setLoading(false);
                    return;
                }

                const data = await tenantService.getTenantConfig(param);

                // Switch main Axios instance to point to this Tenant's specific API
                if (data.hostname) {

                    const protocol = window.location.protocol;
                    // Remove trailing slash if any and append /api
                    // Using setAxiosBaseUrl ensuring all next requests go to correct Tenant Server
                    const apiUrl = `${protocol}//${data.hostname}/api`;

                    // Dynamic import to avoid circular dependencies if any, or just direct call
                    const { setAxiosBaseUrl } = await import('@/lib/services/axiosInstance');
                    setAxiosBaseUrl(apiUrl);
                }

                setTenant(data);
            } catch (err) {
                console.error("Failed to load tenant config", err);
                setError("Tenant not found");

                // Do not redirect if running on localhost to avoid disrupting development
                const host = window.location.host;
                if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
                    window.location.href = "https://restx.food";
                }
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
