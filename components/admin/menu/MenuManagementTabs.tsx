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
      className="flex items-center rounded-lg p-1"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}>
      <Link
        href="/admin/menu"
        aria-current={activeTab === "dishes" ? "page" : undefined}
        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
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
        className="px-4 py-2 rounded-md text-sm font-medium transition-all"
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
