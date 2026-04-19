"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

type MenuManagementTab = "dishes" | "combos";

interface MenuManagementTabsProps {
  activeTab: MenuManagementTab;
}

export default function MenuManagementTabs({
  activeTab,
}: MenuManagementTabsProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("dashboard.menu.tabs.navigation", {
        defaultValue: "Menu management navigation",
      })}
      className="flex h-12 items-center rounded-xl p-1.5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}>
      <Link
        href="/admin/menu"
        aria-current={activeTab === "dishes" ? "page" : undefined}
        className="inline-flex h-9 min-w-[130px] items-center justify-center rounded-lg px-5 text-base font-semibold transition-all"
        style={
          activeTab === "dishes"
            ? {
                background: "var(--card)",
                color: "var(--primary)",
                border: "1px solid var(--border)",
              }
            : {
                color: "var(--text-muted)",
              }
        }>
        {t("dashboard.menu.tabs.dishes", {
          defaultValue: "Dishes",
        })}
      </Link>

      <Link
        href="/admin/menu/combo"
        aria-current={activeTab === "combos" ? "page" : undefined}
        className="inline-flex h-9 min-w-[130px] items-center justify-center rounded-lg px-5 text-base font-semibold transition-all"
        style={
          activeTab === "combos"
            ? {
                background: "var(--card)",
                color: "var(--primary)",
                border: "1px solid var(--border)",
              }
            : {
                color: "var(--text-muted)",
              }
        }>
        {t("dashboard.menu.tabs.combos", {
          defaultValue: "Combos",
        })}
      </Link>
    </nav>
  );
}
