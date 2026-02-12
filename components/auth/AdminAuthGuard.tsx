"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

/**
 * AdminAuthGuard - Protects admin routes by requiring authentication.
 * Redirects unauthenticated users to /login-email.
 * Also checks that the user has Admin or System Admin role.
 */
export default function AdminAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Determine if user has admin access
    const userRoles = user?.roles || [];
    const isAdmin = userRoles.some(r => r === 'Admin' || r === 'System Admin');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in → redirect to login-email
                router.replace("/login-email");
            } else if (!isAdmin) {
                // Logged in but not admin
                if (userRoles.some(r => r === 'Waiter' || r === 'Kitchen Staff')) {
                    router.replace("/staff");
                } else {
                    router.replace("/customer");
                }
            }
        }
    }, [user, loading, isAdmin, router]);

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
                        style={{ borderColor: "#FF380B" }}
                    />
                    <p style={{ color: "var(--text-muted, #888)" }}>
                        Checking authentication...
                    </p>
                </div>
            </div>
        );
    }

    // Not authenticated or not admin → don't render content (redirecting)
    if (!user || !isAdmin) {
        return null;
    }

    // Authenticated Admin → render children
    return <>{children}</>;
}
