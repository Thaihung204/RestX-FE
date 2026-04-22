"use client";

import ThemeToggle from "@/app/components/ThemeToggle";
import { useLanguage } from "@/components/I18nProvider";
import adminAuthService from "@/lib/services/adminAuthService";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

const TENANTS_BRAND_LOGO = "https://res.cloudinary.com/dzz8yqhcr/image/upload/v1773461233/DemoRestaurant/LogoUrl/logo.png";

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

    if (typeof document !== "undefined") {
      const setOrCreateLink = (rel: string) => {
        let link = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement("link");
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = TENANTS_BRAND_LOGO;
      };
      setOrCreateLink("icon");
      setOrCreateLink("shortcut icon");
      setOrCreateLink("apple-touch-icon");
    }
  }, []);

  return (
    <header className="tenant-header">
      <div className="tenant-header-inner">
        {/* Left: Brand + Nav */}
        <div className="tenant-header-left">
          <Link href="/tenants" className="tenant-header-brand">
            <img
              src={TENANTS_BRAND_LOGO}
              alt="RestX Logo"
              className="tenant-header-brand-logo"
            />
            <span>
              Rest<span className="tenant-header-brand-accent">X</span>
            </span>
          </Link>

          {/* Inline Nav Tabs */}
          <nav className="tenant-tabs" style={{ border: "none", padding: 0 }}>
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`tenant-tab ${activeTab === item.key ? "tenant-tab-active" : ""}`}>
                <span>{item.label}</span>
                {typeof item.badgeCount === "number" && (
                  <span className="tenant-tab-badge">{item.badgeCount}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="tenant-header-actions">
          {/* Language + Theme group */}
          <div className="tenant-header-actions-group">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="tenant-header-action-btn"
                style={{ width: "auto", padding: "0.25rem 0.625rem", gap: "0.375rem", display: "flex", alignItems: "center" }}>
                {language === "vi" ? (
                  <svg className="w-5 h-3.5 rounded-[2px]" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
                    <rect width="3" height="2" fill="#DA251D" />
                    <polygon points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836" fill="#FF0" />
                  </svg>
                ) : (
                  <svg className="w-5 h-3.5 rounded-[2px]" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                    <clipPath id="s"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
                    <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
                    <g clipPath="url(#s)">
                      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
                      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                    </g>
                  </svg>
                )}
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase" }}>
                  {language}
                </span>
              </button>

              {isLangMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsLangMenuOpen(false)} />
                  <div
                    className="absolute top-full right-0 mt-2 w-40 rounded-xl shadow-lg border p-1 z-40"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    {["en", "vi"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { changeLanguage(lang); setIsLangMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${language === lang ? "bg-orange-500/10 text-orange-500" : "hover:bg-[var(--bg-base)]"
                          }`}
                        style={{ color: language === lang ? undefined : "var(--text)" }}>
                        {lang === "vi" ? (
                          <svg className="w-5 h-3.5 rounded-[2px] flex-shrink-0" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
                            <rect width="3" height="2" fill="#DA251D" />
                            <polygon points="1.5,0.6 1.577,0.836 1.826,0.836 1.625,0.982 1.702,1.218 1.5,1.072 1.298,1.218 1.375,0.982 1.174,0.836 1.423,0.836" fill="#FF0" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-3.5 rounded-[2px] flex-shrink-0" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
                            <clipPath id="s2"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
                            <clipPath id="t2"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
                            <g clipPath="url(#s2)">
                              <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                              <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t2)" stroke="#C8102E" strokeWidth="4" />
                              <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                              <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                            </g>
                          </svg>
                        )}
                        <span className="font-medium">{lang === "vi" ? "Ti\u1EBFng Vi\u1EC7t" : "English"}</span>
                        {language === lang && (
                          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <ThemeToggle />
          </div>

          {/* Jobs Button */}
          <Link href="https://admin.restx.food/hangfire" target="_blank" rel="noreferrer">
            <span className="tenant-header-jobs-btn">Hangfire Jobs</span>
          </Link>

          {/* User dropdown */}
          <div className="tenant-header-user">
            <div className="tenant-header-user-info">
              <p className="tenant-header-user-name">{adminName}</p>
              <span className="tenant-header-user-role">{adminRole}</span>
            </div>
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
                    router.replace("/login-admin");
                  }
                },
              }}
              placement="bottomRight"
              trigger={["click"]}>
              <button className="tenant-header-action-btn" style={{ borderRadius: "50%", padding: 0, width: "2.5rem", height: "2.5rem" }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ background: "var(--primary)", color: "white" }} />
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TenantDashboardHeader;