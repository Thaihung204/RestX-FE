"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

/**
 * AdminAuthGuard - Protects admin routes by requiring authentication.
 * Redirects unauthenticated users to /login-email.
 * Also checks that the user has tenant Admin role (not System Admin).
 */
export default function AdminAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Determine if user has tenant admin access only (exclude System Admin)
    const userRoles = user?.roles || [];
    const normalizedRoles = userRoles.map((r) => r.toLowerCase());
    const normalizedPrimaryRole = String(user?.role || '').toLowerCase();
    const isSystemAdmin = normalizedRoles.includes('system admin') || normalizedPrimaryRole === 'system admin';
    const isTenantAdmin = (normalizedRoles.includes('admin') || normalizedPrimaryRole === 'admin') && !isSystemAdmin;

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in → redirect to login-email
                const currentPath = typeof window !== 'undefined'
                    ? `${window.location.pathname}${window.location.search || ''}`
                    : '/admin';
                const redirect = encodeURIComponent(currentPath);
                router.replace(`/login-email?redirect=${redirect}`);
            } else if (!isTenantAdmin) {
                // Logged in but not admin
                if (isSystemAdmin) {
                    router.replace('/tenants');
                } else if (userRoles.some(r => r.toLowerCase() === 'staff')) {
                    const staffPath = typeof window !== 'undefined'
                        ? `${window.location.pathname}${window.location.search || ''}`
                        : '/staff';
                    router.replace(`/staff?redirect=${encodeURIComponent(staffPath)}`);
                } else {
                    router.replace("/");
                }
            }
        }
    }, [user, loading, isTenantAdmin, isSystemAdmin, userRoles, router]);

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "var(--bg-base, #0a0a0a)" }}
            >
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                        style={{ borderColor: "var(--primary)" }}
                    />
                    <p style={{ color: "var(--text-muted, #888)" }}>
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    // Not authenticated or not tenant admin → don't render content (redirecting)
    if (!user || !isTenantAdmin) {
        return null;
    }

    // Authenticated Admin → render children
    return <>{children}</>;
}
