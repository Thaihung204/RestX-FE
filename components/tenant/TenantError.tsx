"use client";

import React from "react";

interface TenantErrorProps {
    error: string;
    hostname?: string;
}

/**
 * TenantError Component
 * 
 * Displayed when tenant cannot be loaded - either not found or API error.
 * This component does NOT redirect to landing - it stays on the tenant domain.
 * 
 * This follows SaaS multi-tenant best practices (like Vercel, Shopify):
 * - Tenant subdomains are isolated
 * - Errors are shown on the subdomain, not redirected away
 */
export function TenantError({ error, hostname }: TenantErrorProps) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                color: "#fff",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                padding: "20px",
            }}
        >
            <div
                style={{
                    textAlign: "center",
                    maxWidth: "500px",
                }}
            >
                {/* Error Icon */}
                <div
                    style={{
                        width: "80px",
                        height: "80px",
                        margin: "0 auto 24px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "2px solid rgba(239, 68, 68, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                {/* Title */}
                <h1
                    style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        marginBottom: "12px",
                        background: "linear-gradient(135deg, #fff 0%, #a0a0a0 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Restaurant Not Available
                </h1>

                {/* Error Message */}
                <p
                    style={{
                        fontSize: "16px",
                        color: "rgba(255, 255, 255, 0.7)",
                        marginBottom: "8px",
                        lineHeight: 1.6,
                    }}
                >
                    {error === "Tenant not found"
                        ? "The restaurant you're looking for doesn't exist or has been removed."
                        : error}
                </p>

                {/* Hostname Display */}
                {hostname && (
                    <p
                        style={{
                            fontSize: "14px",
                            color: "rgba(255, 255, 255, 0.4)",
                            fontFamily: "monospace",
                            marginBottom: "32px",
                        }}
                    >
                        {hostname}
                    </p>
                )}

                {/* Actions */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: "12px 24px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#fff",
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                        }}
                    >
                        Try Again
                    </button>

                    <a
                        href="https://restx.food"
                        style={{
                            padding: "12px 24px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1a1a2e",
                            background: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            textDecoration: "none",
                            transition: "all 0.2s",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = "#e0e0e0";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = "#fff";
                        }}
                    >
                        Visit RestX Home
                    </a>
                </div>
            </div>

            {/* Footer */}
            <p
                style={{
                    position: "absolute",
                    bottom: "24px",
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.3)",
                }}
            >
                Powered by RestX
            </p>
        </div>
    );
}

/**
 * TenantLoading Component
 * 
 * Displayed while tenant config is being fetched.
 */
export function TenantLoading() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
                color: "#fff",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            {/* Spinner */}
            <div
                style={{
                    width: "48px",
                    height: "48px",
                    border: "3px solid rgba(255, 255, 255, 0.1)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginBottom: "24px",
                }}
            />

            <p
                style={{
                    fontSize: "16px",
                    color: "rgba(255, 255, 255, 0.7)",
                }}
            >
                Loading restaurant...
            </p>

            {/* CSS Animation */}
            <style jsx>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
