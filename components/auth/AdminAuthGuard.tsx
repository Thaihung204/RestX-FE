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
    const { user, loading, isAuthReady } = useAuth();
    const router = useRouter();

    // Determine if user has tenant admin access only (exclude System Admin)
    const userRoles = user?.roles || [];
    const isAdmin = userRoles.some(r => r === 'Admin' || r === 'System Admin');

    useEffect(() => {
        if (isAuthReady) {
            if (!user) {
                // Not logged in → redirect to login-email
                const currentPath = typeof window !== 'undefined'
                    ? `${window.location.pathname}${window.location.search || ''}`
                    : '/admin';
                const redirect = encodeURIComponent(currentPath);
                router.replace(`/login-email?redirect=${redirect}`);
            } else if (!isAdmin) {
                // Logged in but not admin
                if (userRoles.some(r => r.toLowerCase() === 'staff')) {
                    const staffPath = typeof window !== 'undefined'
                        ? `${window.location.pathname}${window.location.search || ''}`
                        : '/staff';
                    router.replace(`/staff?redirect=${encodeURIComponent(staffPath)}`);
                } else {
                    router.replace("/");
                }
            }
        }
    }, [user, isAuthReady, isAdmin, router]);

    // Show loading spinner while checking auth
    if (!isAuthReady || loading) {
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
    if (!isAuthReady || !user || !isAdmin) {
        return null;
    }

    // Authenticated Admin → render children
    return <>{children}</>;
}
