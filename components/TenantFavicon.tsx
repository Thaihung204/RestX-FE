"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Dynamically injects tenant favicon into <head>.
 * Monitors and prevents external favicon changes.
 */
export default function TenantFavicon() {
    const { tenant } = useTenant();
    const pathname = usePathname();
    const linkRef = useRef<HTMLLinkElement | null>(null);
    const urlRef = useRef<string>("");
    const observerRef = useRef<MutationObserver | null>(null);

    const resolveType = (url: string) => {
        const cleanUrl = url.split("?")[0].toLowerCase();
        if (cleanUrl.endsWith(".png")) return "image/png";
        if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
        if (cleanUrl.endsWith(".webp")) return "image/webp";
        if (cleanUrl.endsWith(".ico")) return "image/x-icon";
        return undefined;
    };

    const applyFavicon = (faviconUrl: string) => {
        let link = document.getElementById("tenant-favicon") as HTMLLinkElement | null;
        
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            link.id = "tenant-favicon";
            document.head.appendChild(link);
        }

        const type = resolveType(faviconUrl);
        link.href = faviconUrl;
        if (type) {
            link.type = type;
        } else {
            link.removeAttribute("type");
        }
        
        // Prevent this element from being removed or modified
        link.setAttribute("data-tenant-favicon", "true");
        linkRef.current = link;
    };

    useEffect(() => {
        const faviconUrl = tenant?.faviconUrl?.trim() || "/favicon.ico";
        urlRef.current = faviconUrl;
        applyFavicon(faviconUrl);

        // Monitor head changes and prevent external favicon resets
        if (!observerRef.current) {
            observerRef.current = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === "childList") {
                        // Check if our favicon was removed
                        const ourFavicon = document.getElementById("tenant-favicon");
                        if (!ourFavicon && linkRef.current) {
                            // Re-add it if it was removed
                            document.head.appendChild(linkRef.current);
                        }
                        
                        // Remove any other favicon links that aren't ours
                        const allIcons = Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"));
                        allIcons.forEach((icon) => {
                            if (icon.id !== "tenant-favicon" && !icon.hasAttribute("data-tenant-favicon")) {
                                icon.remove();
                            }
                        });
                    }
                }
            });

            observerRef.current.observe(document.head, {
                childList: true,
                subtree: false,
            });
        }

        return () => {
            // Don't disconnect observer on unmount - keep watching
        };
    }, [tenant?.faviconUrl]);

    // Re-apply on route changes to prevent Next head resets
    useEffect(() => {
        if (!urlRef.current) return;
        applyFavicon(urlRef.current);
    }, [pathname]);

    return null;
}
