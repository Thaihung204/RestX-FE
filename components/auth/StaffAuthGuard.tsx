"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

/**
 * StaffAuthGuard - Protects staff routes (e.g. /staff/*) by requiring authentication.
 * Redirects unauthenticated users to /login (Phone Login).
 * Only allows users with 'Waiter' or 'Kitchen Staff' roles.
 */
export default function StaffAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Determine if user has staff access
    const userRoles = user?.roles || [];
    const isStaff = userRoles.some(r => r === 'Waiter' || r === 'Kitchen Staff');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in → redirect to phone login (staff usually use phone)
                router.replace("/login");
            } else if (!isStaff) {
                // Logged in but not staff
                if (userRoles.some(r => r === 'Admin' || r === 'System Admin')) {
                    router.replace("/admin");
                } else {
                    router.replace("/customer");
                }
            }
        }
    }, [user, loading, isStaff, router]);

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
                        Checking staff authentication...
                    </p>
                </div>
            </div>
        );
    }

    // Not authenticated or not staff → don't render content (redirecting)
    if (!user || !isStaff) {
        return null;
    }

    // Authenticated Staff → render children
    return <>{children}</>;
}
