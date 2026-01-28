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

                // 3. Check for Development domains (Skip tenant fetch for all localhost variants)
                // This includes plain localhost and subdomains like demo.localhost
                // In development, we don't need to verify tenant existence
                const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;
                const isLocalhost = hostWithoutPort === "localhost" ||
                    hostWithoutPort === "127.0.0.1" ||
                    hostWithoutPort.endsWith(".localhost");

                if (isLocalhost) {
                    console.log('[TenantContext] Localhost detected, skipping tenant fetch');
                    setLoading(false);
                    return;
                }

                // 4. Extract domain for tenant lookup
                // Ex: demo.restx.food -> demo
                // Ex: demo.localhost:3000 -> demo
                let domain = hostWithoutPort;

                // For *.restx.food, extract the subdomain (prefix)
                if (domain.endsWith(".restx.food")) {
                    domain = domain.replace(".restx.food", "");
                }
                // For *.localhost, extract the subdomain (prefix)
                else if (domain.endsWith(".localhost")) {
                    domain = domain.replace(".localhost", "");
                }

                console.log('[TenantContext] Fetching tenant config for domain:', domain);

                // 4. Call admin API to get tenant config
                const data = await tenantService.getTenantConfig(domain);
                console.log('[TenantContext] Tenant config response:', data);

                // 5. Handle Tenant Not Found (204 or null)
                if (!data) {
                    console.warn('[TenantContext] Tenant not found for domain:', domain);
                    // Redirect to landing page if tenant not found
                    // Skip redirect for localhost
                    if (
                        !host.includes("localhost") &&
                        !host.includes("127.0.0.1")
                    ) {
                        window.location.href = "https://restx.food";
                    }
                    setLoading(false);
                    return;
                }

                // 6. Override axios base URL if hostname is provided in tenant config
                if (data.hostname) {
                    const protocol = window.location.protocol;
                    const apiUrl = `${protocol}//${data.hostname}/api`;
                    console.log('[TenantContext] Setting axios base URL to:', apiUrl);

                    const { setAxiosBaseUrl } = await import('@/lib/services/axiosInstance');
                    setAxiosBaseUrl(apiUrl);
                }

                setTenant(data);
                console.log('[TenantContext] Tenant loaded successfully:', data.name);
            } catch (err) {
                console.error("[TenantContext] Failed to load tenant config", err);
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
