import I18nProvider from "@/components/I18nProvider";
import TenantFavicon from "@/components/TenantFavicon";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { TenantProvider } from "@/lib/contexts/TenantContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AntdProvider from "./theme/AntdProvider";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "RestX - All-in-one Restaurant Operations Platform",
  description:
    "Tối ưu vận hành nhà hàng với RestX. Quản lý đặt bàn, order, bếp, kho và báo cáo trên một nền tảng duy nhất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var STORAGE_KEY = 'restx-theme-mode';
                var TENANT_COLORS_KEY = 'restx-tenant-colors';
                try {
                  // 1. Apply theme mode (dark/light) immediately
                  var stored = localStorage.getItem(STORAGE_KEY);
                  var mode = (stored === 'dark' || stored === 'light')
                    ? stored
                    : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  var root = document.documentElement;
                  root.setAttribute('data-theme', mode);
                  if (mode === 'dark') {
                    root.classList.add('dark');
                  } else {
                    root.classList.remove('dark');
                  }
                  
                  // 2. Preload tenant colors from localStorage (prevents FOUC)
                  var tenantColors = localStorage.getItem(TENANT_COLORS_KEY);
                  if (tenantColors) {
                    try {
                      var colors = JSON.parse(tenantColors);
                      // Only inject primary color, other colors use defaults from globals.css
                      if (colors.primary) {
                        root.style.setProperty('--primary', colors.primary);
                      }
                      if (colors.onPrimary) {
                        root.style.setProperty('--on-primary', colors.onPrimary);
                        root.style.setProperty('--text-inverse', colors.onPrimary);
                      }
                    } catch (e) {
                      // Invalid JSON, ignore
                    }
                  }
                } catch (e) {
                  // silent fallback; globals.css will provide default light theme
                }
              })();
            `,
          }}
        />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Custom Ant Design overrides using theme tokens */
          .ant-rate-star-full .ant-rate-star-second {
            color: var(--primary) !important;
          }
          .ant-card:hover {
            border-color: var(--primary) !important;
            box-shadow: 0 8px 32px var(--primary-glow) !important;
          }
          .ant-menu-horizontal > .ant-menu-item:hover::after,
          .ant-menu-horizontal > .ant-menu-item-selected::after {
            border-bottom-color: var(--primary) !important;
          }
        `}</style>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* I18n Provider Wrapper */}
        <I18nProvider>
          <TenantProvider>
            <TenantFavicon />
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <AntdProvider>{children}</AntdProvider>
                </ToastProvider>
              </CartProvider>
            </AuthProvider>
          </TenantProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
