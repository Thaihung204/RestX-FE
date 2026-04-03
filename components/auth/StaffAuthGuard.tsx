"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

/**
 * StaffAuthGuard - Protects staff routes (e.g. /staff/*) by requiring authentication.
 * Redirects unauthenticated users to /login (Phone Login).
 * Only allows users with 'Staff' role.
 */
export default function StaffAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Determine if user has staff/admin access
    const userRoles = user?.roles || [];
    const normalizedRoles = userRoles.map((r) => r.toLowerCase());
    const normalizedPrimaryRole = String(user?.role || "").toLowerCase();
    const isStaff = normalizedRoles.includes('staff') || normalizedPrimaryRole === 'staff';
    const isAdmin =
        normalizedRoles.includes('admin') ||
        normalizedRoles.includes('system admin') ||
        normalizedPrimaryRole === 'admin' ||
        normalizedPrimaryRole === 'system admin';
    const canAccessStaff = isStaff || isAdmin;

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in → redirect to phone login (staff usually use phone)
                router.replace("/login-email");
            } else if (!canAccessStaff) {
                // Logged in but not staff/admin
                router.replace("/");
            }
        }
    }, [user, loading, canAccessStaff, router]);

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
                        Checking staff authentication...
                    </p>
                </div>
            </div>
        );
    }

    // Not authenticated or not allowed role → don't render content (redirecting)
    if (!user || !canAccessStaff) {
        return null;
    }

    // Authenticated Staff/Admin → render children
    return <>{children}</>;
}
