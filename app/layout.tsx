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
    <html lang="vi">
      <head>
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
            color: #FF7A00 !important;
          }
          .ant-card:hover {
            border-color: #FF7A00 !important;
            box-shadow: 0 8px 32px rgba(255, 122, 0, 0.12) !important;
          }
          .ant-menu-horizontal > .ant-menu-item:hover::after,
          .ant-menu-horizontal > .ant-menu-item-selected::after {
            border-bottom-color: #FF7A00 !important;
          }
        `}</style>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AutoDarkThemeProvider>{children}</AutoDarkThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
