"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import { useLanguage } from "@/components/I18nProvider";
import adminAuthService from "@/lib/services/adminAuthService";
import { SettingOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Dropdown } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// --- Types & Interfaces ---
export interface TenantDashboardTabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badgeCount?: number;
}

interface TenantDashboardHeaderProps {
  items: TenantDashboardTabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

// --- Sub-component: Tabs ---
const TenantDashboardHeaderTabs: React.FC<TenantDashboardHeaderProps> = ({
  items,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max">
        {items.map((item) => {
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className="relative flex items-center gap-2 px-5 py-3 border-b-2 transition-all duration-200"
              style={
                isActive
                  ? {
                      borderColor: "var(--text)",
                      color: "var(--text)",
                      fontWeight: 600,
                    }
                  : {
                      borderColor: "transparent",
                      color: "var(--text-muted)",
                    }
              }>
              {item.icon && <span className="text-sm">{item.icon}</span>}
              <span className="text-sm whitespace-nowrap">{item.label}</span>
              {typeof item.badgeCount === "number" && (
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded-md leading-none"
                  style={{
                    background: isActive ? "var(--surface)" : "var(--surface-subtle)",
                    color: isActive ? "var(--text)" : "var(--text-muted)",
                  }}>
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Component: Header ---
const TenantDashboardHeader: React.FC<TenantDashboardHeaderProps> = ({ items, activeTab, onTabChange }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("Super Admin");

  useEffect(() => {
    const admin = adminAuthService.getCurrentAdmin();
    if (admin) {
      setAdminName(admin.fullName || admin.email || "Admin");
      const roles = admin.roles || [];
      setAdminRole(roles.length ? roles.join(", ") : "Super Admin");
    }
  }, []);

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
      }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Bên trái: Tabs điều hướng */}
          <div className="min-w-0">
            <TenantDashboardHeaderTabs items={items} activeTab={activeTab} onTabChange={onTabChange} />
          </div>

          {/* Bên phải: Các nút chức năng */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 rounded-lg transition-colors group flex items-center gap-2.5 h-10"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                }}>
                {language === "vi" ? (
                  <svg
                    className="w-6 h-4 rounded-[2px] shadow-sm"
                    viewBox="0 0 3 2"
                    xmlns="http://www.w3.org/2000/svg">
                    <rect width="3" height="2" fill="#DA251D" />
                    <polygon
                      points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836"
                      fill="#FF0"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-4 rounded-[2px] shadow-sm"
                    viewBox="0 0 60 30"
                    xmlns="http://www.w3.org/2000/svg">
                    <clipPath id="s">
                      <path d="M0,0 v30 h60 v-30 z" />
                    </clipPath>
                    <clipPath id="t">
                      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                    </clipPath>
                    <g clipPath="url(#s)">
                      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                      <path
                        d="M0,0 L60,30 M60,0 L0,30"
                        stroke="#fff"
                        strokeWidth="6"
                      />
                      <path
                        d="M0,0 L60,30 M60,0 L0,30"
                        clipPath="url(#t)"
                        stroke="#C8102E"
                        strokeWidth="4"
                      />
                      <path
                        d="M30,0 v30 M0,15 h60"
                        stroke="#fff"
                        strokeWidth="10"
                      />
                      <path
                        d="M30,0 v30 M0,15 h60"
                        stroke="#C8102E"
                        strokeWidth="6"
                      />
                    </g>
                  </svg>
                )}
                <span className="text-sm font-medium uppercase group-hover:text-orange-500 leading-none pt-[1px]">
                  {language}
                </span>
                <svg
                  className="w-3 h-3 text-[var(--text-muted)] opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div
                    className="absolute top-full right-0 mt-2 w-40 rounded-xl shadow-lg border p-1 z-40 transition-all"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                    }}>
                    <button
                      onClick={() => {
                        changeLanguage("en");
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                        language === "en"
                          ? "bg-orange-500/10 text-orange-500"
                          : "hover:bg-[var(--bg-base)]"
                      }`}
                      style={{
                        color: language === "en" ? undefined : "var(--text)",
                      }}>
                      <svg
                        className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0"
                        viewBox="0 0 60 30"
                        xmlns="http://www.w3.org/2000/svg">
                        <clipPath id="s2">
                          <path d="M0,0 v30 h60 v-30 z" />
                        </clipPath>
                        <clipPath id="t2">
                          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                        </clipPath>
                        <g clipPath="url(#s2)">
                          <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                          <path
                            d="M0,0 L60,30 M60,0 L0,30"
                            stroke="#fff"
                            strokeWidth="6"
                          />
                          <path
                            d="M0,0 L60,30 M60,0 L0,30"
                            clipPath="url(#t2)"
                            stroke="#C8102E"
                            strokeWidth="4"
                          />
                          <path
                            d="M30,0 v30 M0,15 h60"
                            stroke="#fff"
                            strokeWidth="10"
                          />
                          <path
                            d="M30,0 v30 M0,15 h60"
                            stroke="#C8102E"
                            strokeWidth="6"
                          />
                        </g>
                      </svg>
                      <span className="font-medium">English</span>
                      {language === "en" && (
                        <svg
                          className="w-4 h-4 ml-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        changeLanguage("vi");
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                        language === "vi"
                          ? "bg-orange-500/10 text-orange-500"
                          : "hover:bg-[var(--bg-base)]"
                      }`}
                      style={{
                        color: language === "vi" ? undefined : "var(--text)",
                      }}>
                      <svg
                        className="w-6 h-4 rounded-[2px] shadow-sm flex-shrink-0"
                        viewBox="0 0 3 2"
                        xmlns="http://www.w3.org/2000/svg">
                        <rect width="3" height="2" fill="#DA251D" />
                        <polygon
                          points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836"
                          fill="#FF0"
                        />
                      </svg>
                      <span className="font-medium">Tiếng Việt</span>
                      {language === "vi" && (
                        <svg
                          className="w-4 h-4 ml-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            <ThemeToggle />

            <Dropdown
              menu={{
                items: [
                  {
                    key: "user-info",
                    label: (
                      <div style={{ padding: "4px 0", maxWidth: 200 }}>
                        <div style={{ fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{adminName}</div>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>{adminRole}</div>
                      </div>
                    ),
                    disabled: true,
                  },
                  { type: "divider" },
                  { key: "logout", label: t("staff.user_menu.logout"), danger: true },
                ],
                style: { background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" },
                onClick: ({ key }) => {
                  if (key === "logout") {
                    adminAuthService.logout();
                    router.replace("/login");
                  }
                },
              }}
              placement="bottomRight"
              trigger={["click"]}>
              <button className="flex items-center justify-center rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", width: 36, height: 36 }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: "var(--primary)", color: "white" }} />
              </button>
            </Dropdown>

            <Link href="https://admin.restx.food/hangfire" target="_blank" rel="noreferrer">
              <Button icon={<SettingOutlined />}>Hangfire Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TenantDashboardHeader;