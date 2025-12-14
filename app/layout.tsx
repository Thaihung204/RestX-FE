import { AuthProvider } from "@/lib/contexts/AuthContext";
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
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AutoDarkThemeProvider>{children}</AutoDarkThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
