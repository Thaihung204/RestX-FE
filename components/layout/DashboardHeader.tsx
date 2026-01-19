"use client";

import { useState } from "react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { useLanguage } from "@/components/I18nProvider";
import { useTranslation } from "react-i18next";

export default function DashboardHeader() {
  const { t } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const { language, changeLanguage } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--card)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        color: "var(--text)",
      }}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Page Title & Breadcrumb */}
          <div>
            <div className="flex items-center gap-2 text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              <span>{t("dashboard.header.pages")}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span>{t("dashboard.header.dashboard")}</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {t("dashboard.header.main_dashboard")}
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("dashboard.header.search_placeholder")}
                className="w-64 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  '--tw-ring-color': '#FF380B',
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                } as React.CSSProperties}
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg transition-colors group"
              style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
              <svg
                className="w-6 h-6 group-hover:text-orange-500"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#FF380B' }}></span>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="p-2 rounded-lg transition-colors group flex items-center gap-2"
                style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                <svg
                  className="w-6 h-6 group-hover:text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium uppercase group-hover:text-orange-500">
                  {language}
                </span>
              </button>

              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div
                    className="absolute top-full right-0 mt-2 w-32 rounded-xl shadow-lg border p-1 z-40 transition-all"
                    style={{
                      background: "var(--card)",
                      borderColor: "var(--border)",
                    }}>
                    <button
                      onClick={() => {
                        changeLanguage("en");
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${language === "en" ? "bg-orange-500/10 text-orange-500" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      style={{ color: language === "en" ? undefined : "var(--text)" }}>
                      <span>🇬🇧</span> English
                    </button>
                    <button
                      onClick={() => {
                        changeLanguage("vi");
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${language === "vi" ? "bg-orange-500/10 text-orange-500" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      style={{ color: language === "vi" ? undefined : "var(--text)" }}>
                      <span>🇻🇳</span> Tiếng Việt
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings */}
            <button
              className="p-2 rounded-lg transition-colors group"
              style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
              <svg
                className="w-6 h-6 group-hover:text-orange-500"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* User Profile */}
            <button
              className="flex items-center gap-3 p-2 rounded-lg transition-colors"
              style={{ background: "var(--surface)", color: "var(--text)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#FF380B' }}>
                A
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                  Admin User
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.header.user_role")}
                </p>
              </div>
              <svg
                className="w-4 h-4 hidden lg:block"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
