"use client";

import React from "react";
import { useTenant } from "@/lib/contexts/TenantContext";
import { TenantError, TenantLoading } from "./TenantError";

interface TenantGuardProps {
    children: React.ReactNode;
    /**
     * If true, shows loading/error states.
     * If false, renders children even when tenant is loading/error (for admin pages, etc.)
     * Default: true
     */
    strict?: boolean;
}

/**
 * TenantGuard Component
 * 
 * Wraps tenant pages and handles loading/error states.
 * 
 * Usage:
 * - Wrap your tenant-specific pages with this component
 * - It will show loading spinner while fetching tenant config
 * - It will show error page if tenant not found (NO REDIRECT)
 * 
 * Example:
 * ```tsx
 * <TenantGuard>
 *   <YourTenantPage />
 * </TenantGuard>
 * ```
 */
export function TenantGuard({ children, strict = true }: TenantGuardProps) {
    const { tenant, loading, error } = useTenant();

    // Get current hostname for error display
    const hostname = typeof window !== "undefined"
        ? window.location.host
        : undefined;

    // If not strict mode, always render children
    if (!strict) {
        return <>{children}</>;
    }

    // Show loading state
    if (loading) {
        return <TenantLoading />;
    }

    // Show error state (NO REDIRECT)
    if (error || !tenant) {
        return (
            <TenantError
                error={error || "Tenant not found"}
                hostname={hostname}
            />
        );
    }

    // Tenant loaded successfully, render children
    return <>{children}</>;
}

/**
 * Hook to check if the current page should show tenant guard
 * Returns true if we're on a tenant subdomain
 */
export function useIsTenantDomain(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    const host = window.location.host;
    const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;

    // Landing domains
    if (host === "restx.food" || host === "www.restx.food") {
        return false;
    }

    // Admin domain
    if (host === "admin.restx.food" || hostWithoutPort === "admin.localhost") {
        return false;
    }

    // Plain localhost
    if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
        return false;
    }

    // All other subdomains are tenant domains
    return true;
}
