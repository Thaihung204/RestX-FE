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

                // 1. Check for Landing or Admin domains (Skip API call)
                if (
                    host === "restx.food" ||
                    host === "www.restx.food" ||
                    host === "admin.restx.food" ||
                    host.startsWith("admin.")
                ) {
                    setLoading(false);
                    return;
                }

                // 2. Extract Subdomain
                // Ex: demo.restx.food -> demo
                let subdomain = host;
                if (host.includes(".restx.food")) {
                    subdomain = host.split(".")[0];
                } else if (host.includes("localhost") || host.includes("127.0.0.1")) {
                    subdomain = host.split(".")[0];
                }

                // Remove port if present
                if (subdomain.includes(":")) {
                    subdomain = subdomain.split(":")[0];
                }

                const data = await tenantService.getTenantConfig(subdomain);

                // 3. Handle Tenant Not Found (204)
                if (!data) {
                    // Redirect to landing page if tenant not found
                    if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
                        window.location.href = "https://restx.food";
                    }
                    setLoading(false);
                    return;
                }
                if (data.hostname) {

                    const protocol = window.location.protocol;
                    const apiUrl = `${protocol}//${data.hostname}/api`;

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
