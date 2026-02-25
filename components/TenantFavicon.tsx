"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import { useEffect } from "react";

/**
 * Dynamically injects tenant favicon into <head>.
 * Falls back to /favicon.ico if no tenant favicon is configured.
 */
export default function TenantFavicon() {
    const { tenant } = useTenant();

    useEffect(() => {
        const faviconUrl = tenant?.faviconUrl?.trim();

        // Remove all existing favicon links to reset
        const existingLinks = document.querySelectorAll<HTMLLinkElement>(
            'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
        );
        existingLinks.forEach((link) => link.remove());

        // Create new favicon link
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/x-icon";
        link.href = faviconUrl || "/favicon.ico";
        document.head.appendChild(link);
    }, [tenant?.faviconUrl]);

    return null;
}
