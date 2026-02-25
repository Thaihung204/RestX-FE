"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import { useEffect, useRef } from "react";

/**
 * Dynamically injects tenant favicon into <head>.
 * Uses a ref to track the element we created so React's DOM tree stays consistent.
 * Falls back to /favicon.ico if no tenant favicon is configured.
 */
export default function TenantFavicon() {
    const { tenant } = useTenant();
    const linkRef = useRef<HTMLLinkElement | null>(null);

    useEffect(() => {
        const faviconUrl = tenant?.faviconUrl?.trim() || "/favicon.ico";

        // If we already created a link, just update its href
        if (linkRef.current) {
            linkRef.current.href = faviconUrl;
            return;
        }

        // First mount: create the link element
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/x-icon";
        link.href = faviconUrl;
        link.id = "tenant-favicon";
        document.head.appendChild(link);
        linkRef.current = link;

        // Cleanup on unmount — only remove what WE created
        return () => {
            if (linkRef.current && linkRef.current.parentNode) {
                linkRef.current.parentNode.removeChild(linkRef.current);
                linkRef.current = null;
            }
        };
    }, [tenant?.faviconUrl]);

    return null;
}
