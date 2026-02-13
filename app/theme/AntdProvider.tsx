"use client";

import { App as AntdApp, ConfigProvider, theme } from "antd";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { darkTheme, lightTheme, ThemeMode } from "./themeConfig";

const { darkAlgorithm, defaultAlgorithm } = theme;
const STORAGE_KEY = "restx-theme-mode";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>("light");

  // read initial
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null)
        : null;
    if (stored === "dark" || stored === "light") {
      setMode(stored);
    }
  }, []);

  // apply CSS variables and persist
  useEffect(() => {
    const theme = mode === "dark" ? darkTheme : lightTheme;
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    const vars = theme.customColors;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () =>
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  const setTheme = (m: ThemeMode) => setMode(m);

  // Ant Design theme configuration
  const antdTheme = useMemo(() => {
    const themeTokens = mode === "dark" ? darkTheme.tokens : lightTheme.tokens;
    return {
      algorithm: mode === "dark" ? darkAlgorithm : defaultAlgorithm,
      token: {
        ...themeTokens.token,
        // Override with CSS variables for dynamic tenant branding
        colorPrimary: "var(--primary)",
        colorLink: "var(--primary)",
        colorLinkHover: "var(--primary-hover)",
        borderRadius: 12,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      components: {
        ...themeTokens.components,
        // Additional global component overrides
        Button: {
          ...themeTokens.components?.Button,
          borderRadius: 8,
          controlHeight: 44,
          fontWeight: 600,
        },
        Input: {
          colorBgContainer: "var(--surface)",
          colorBorder: "var(--border)",
          activeBorderColor: "var(--primary)",
          hoverBorderColor: "var(--primary)",
        },
        Select: {
          colorBgContainer: "var(--surface)",
          colorBorder: "var(--border)",
          selectorBg: "var(--surface)",
          optionSelectedBg: "var(--primary-soft)",
          colorTextPlaceholder: "var(--text-muted)",
        },
        Modal: {
          contentBg: "var(--card)",
          headerBg: "var(--card)",
          titleColor: "var(--text)",
        },
        Card: {
          colorBgContainer: "var(--card)",
          colorBorderSecondary: "var(--border)",
        },
        Layout: {
          colorBgBody: "var(--bg-base)",
          colorBgHeader: "var(--card)",
        },
        Message: {
          contentBg: "#FFFFFF",
          contentPadding: "12px 16px",
          colorText: "#000000",
          colorSuccess: "#52c41a",
          colorError: "#ff4d4f",
          colorWarning: "#faad14",
          colorInfo: "#1890ff",
        },
        Notification: {
          colorBgElevated: "#FFFFFF",
          colorText: "#000000",
          colorTextHeading: "#000000",
          colorSuccess: "#52c41a",
          colorError: "#ff4d4f",
          colorWarning: "#faad14",
          colorInfo: "#1890ff",
        },
      },
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
      <ConfigProvider theme={antdTheme}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
      <style jsx global>{`
        /* Body & Layout Base */
        body {
          background: var(--bg-base);
          color: var(--text);
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }
        .ant-layout,
        .ant-layout-content {
          background: var(--bg-base);
        }

        /* Override hardcoded colors with CSS variables */
        .ant-btn-primary {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
        }
        .ant-btn-primary:hover {
          background: var(--primary-hover) !important;
          border-color: var(--primary-hover) !important;
        }
        .ant-typography strong,
        .ant-typography-danger {
          color: var(--primary);
        }

        /* Links */
        a {
          color: var(--primary);
        }
        a:hover {
          color: var(--primary-hover);
        }

        /* Toast/Message - Always white background, black text */
        .ant-message-notice-content {
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow:
            0 6px 16px 0 rgba(0, 0, 0, 0.08),
            0 3px 6px -4px rgba(0, 0, 0, 0.12),
            0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
        }

        .ant-message .anticon {
          color: inherit !important;
        }

        .ant-message-success .anticon {
          color: #52c41a !important;
        }

        .ant-message-error .anticon {
          color: #ff4d4f !important;
        }

        .ant-message-warning .anticon {
          color: #faad14 !important;
        }

        .ant-message-info .anticon {
          color: #1890ff !important;
        }

        /* Notification - Always white background, black text */
        .ant-notification-notice {
          background: #ffffff !important;
          color: #000000 !important;
          box-shadow:
            0 6px 16px 0 rgba(0, 0, 0, 0.08),
            0 3px 6px -4px rgba(0, 0, 0, 0.12),
            0 9px 28px 8px rgba(0, 0, 0, 0.05) !important;
        }

        .ant-notification-notice-message {
          color: #000000 !important;
        }

        .ant-notification-notice-description {
          color: #000000 !important;
        }

        .ant-notification-notice-icon-success {
          color: #52c41a !important;
        }

        .ant-notification-notice-icon-error {
          color: #ff4d4f !important;
        }

        .ant-notification-notice-icon-warning {
          color: #faad14 !important;
        }

        .ant-notification-notice-icon-info {
          color: #1890ff !important;
        }
      `}</style>
    </ThemeContext.Provider>
  );
}
