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
                const hostname = window.location.hostname;
                let subdomain = "demo"; // Default fallback

                // Extract subdomain logic
                if (!hostname.includes("localhost") && !hostname.includes("127.0.0.1")) {
                    const parts = hostname.split(".");
                    // If we have sub.domain.com (3 parts), taking parts[0] is 'sub'
                    // If we have domain.com (2 parts), taking parts[0] is 'domain' which might be wrong if we expect subdomain only.
                    // Assuming the app is always served on a subdomain for tenants like *.restx.food
                    if (parts.length >= 3) {
                        subdomain = parts[0];
                    }
                }

                const data = await tenantService.getTenantConfig(subdomain);
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
