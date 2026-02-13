"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { tenantService, TenantConfig } from "@/lib/services/tenantService";

interface TenantContextType {
    tenant: TenantConfig | null;
    loading: boolean;
    error: string | null;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [tenant, setTenant] = useState<TenantConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTenant = async () => {
        const host = window.location.host; // e.g., demo.restx.food:3000
        console.log('[TenantContext] Current host:', host);

        // 1. Check for Landing domains (Skip API call)
        if (
            host === "restx.food" ||
            host === "www.restx.food"
        ) {
            console.log('[TenantContext] Landing domain detected, skipping tenant fetch');
            setLoading(false);
            return;
        }

        // 2. Check for Admin domain (Skip tenant fetch, admin has its own context)
        if (host === "admin.restx.food" || host.startsWith("admin.")) {
            console.log('[TenantContext] Admin domain detected, skipping tenant fetch');
            setLoading(false);
            return;
        }

        // 3. Get hostname for tenant lookup
        const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;
        let hostname = hostWithoutPort;

        // For *.localhost in development, convert to equivalent production hostname
        // e.g., demo.localhost -> demo.restx.food
        if (hostname.endsWith(".localhost")) {
            const subdomain = hostname.replace(".localhost", "");
            hostname = `${subdomain}.restx.food`;
        } else if (hostname === "localhost" || hostname === "127.0.0.1") {
            // Plain localhost without subdomain - default to demo.restx.food
            hostname = "demo.restx.food";
        }

        console.log('[TenantContext] Fetching tenant config for hostname:', hostname);

        try {
            // 5. Call API to get tenant config
            const data = await tenantService.getTenantConfig(hostname);
            console.log('[TenantContext] Tenant config response:', data);

            if (data) {
                // Tenant found - axios already uses relative /api path
                // Reverse proxy routes requests based on Host header
                setTenant(data);
                console.log('[TenantContext] Tenant loaded successfully:', data.name);
            } else {
                // Tenant not found (204 or null response)
                // DO NOT REDIRECT - show error state instead
                console.warn('[TenantContext] Tenant not found for hostname:', hostname);
                setError("Tenant not found");
            }
        } catch (err: any) {
            // API error (401, 403, 500, network error, etc.)
            // DO NOT REDIRECT - show error state instead
            console.error("[TenantContext] Failed to load tenant config:", err);

            // Provide meaningful error messages
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError("Unable to load tenant configuration");
            } else if (err.response?.status === 404) {
                setError("Tenant not found");
            } else if (!err.response) {
                setError("Network error - please check your connection");
            } else {
                setError("Failed to load tenant");
            }
        } finally {
            setLoading(false);
        }
    };

    // Function to refresh tenant data (called after updates like branding changes)
    const refreshTenant = async () => {
        console.log('[TenantContext] Refreshing tenant data...');
        setLoading(true);
        setError(null);
        await fetchTenant();
    };

    useEffect(() => {
        fetchTenant();
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading, error, refreshTenant }}>
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
