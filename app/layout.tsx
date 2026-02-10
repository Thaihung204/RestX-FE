import I18nProvider from "@/components/I18nProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { CartProvider } from "@/lib/contexts/CartContext";
import { TenantProvider } from "@/lib/contexts/TenantContext";
import { ToastProvider } from "@/lib/contexts/ToastContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AutoDarkThemeProvider from "./theme/AutoDarkThemeProvider";

const inter = Inter({ subsets: ["latin"] });

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const STORAGE_KEY = 'restx-theme-mode';
                const stored = localStorage.getItem(STORAGE_KEY);
                let mode = stored === 'dark' || stored === 'light' ? stored : 
                  (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                
                const lightTheme = {
                  'bg-base': '#F7F8FA',
                  'surface': '#FFFFFF',
                  'card': '#FFFFFF',
                  'text': '#111111',
                  'text-muted': '#4F4F4F',
                  'border': '#E5E7EB',
                };
                
                const darkTheme = {
                  'bg-base': '#0E121A',
                  'surface': '#141927',
                  'card': '#141927',
                  'text': '#ECECEC',
                  'text-muted': '#C5C5C5',
                  'border': '#1F2433',
                };
                
                const themeObj = mode === 'dark' ? darkTheme : lightTheme;
                const root = document.documentElement;
                root.setAttribute('data-theme', mode);
                Object.entries(themeObj).forEach(([key, val]) => {
                  root.style.setProperty('--' + key, val);
                });
                if (mode === 'dark') {
                  root.classList.add('dark');
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
          /* Custom Ant Design overrides */
          .ant-rate-star-full .ant-rate-star-second {
            color: #FF380B !important;
          }
          .ant-card:hover {
            border-color: #FF380B !important;
            box-shadow: 0 8px 32px rgba(255, 56, 11, 0.12) !important;
          }
          .ant-menu-horizontal > .ant-menu-item:hover::after,
          .ant-menu-horizontal > .ant-menu-item-selected::after {
            border-bottom-color: #FF380B !important;
          }
        `}</style>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {/* I18n Provider Wrapper */}
        <I18nProvider>
          <TenantProvider>
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <AutoDarkThemeProvider>{children}</AutoDarkThemeProvider>
                </ToastProvider>
              </CartProvider>
            </AuthProvider>
          </TenantProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
