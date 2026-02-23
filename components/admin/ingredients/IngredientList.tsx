"use client";

import ingredientService, { IngredientItem } from "@/lib/services/ingredientService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function getStatus(item: IngredientItem): "active" | "inactive" {
  return item.isActive ? "active" : "inactive";
}

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  active:   { background: "rgba(34,197,94,0.12)",  color: "#16a34a", border: "1px solid rgba(34,197,94,0.3)"  },
  inactive: { background: "rgba(239,68,68,0.12)",  color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)"  },
};

export default function IngredientList() {
  const { t } = useTranslation("common");
  const router = useRouter();

  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  useEffect(() => { fetchIngredients(); }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ingredientService.getAll();
      setIngredients(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          t("dashboard.ingredients.list.load_error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const types = Array.from(new Set(ingredients.map((i) => i.type).filter(Boolean))) as string[];

  const filtered = ingredients.filter((i) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      (i.supplierName ?? "").toLowerCase().includes(q);
    const matchType   = filterType   === "all" || i.type === filterType;
    const matchActive = filterActive === "all" ||
      (filterActive === "active"   && i.isActive) ||
      (filterActive === "inactive" && !i.isActive);
    return matchSearch && matchType && matchActive;
  });

  const TABS = [
    { id: "all",      label: t("dashboard.ingredients.tab_all") },
    { id: "active",   label: t("dashboard.ingredients.tab_active") },
    { id: "inactive", label: t("dashboard.ingredients.tab_inactive") },
  ];

  const activeTabStyle: React.CSSProperties  = { background: "#FF380B", color: "white" };
  const normalTabStyle: React.CSSProperties  = { background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#FF380B" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <p className="text-sm mb-3" style={{ color: "#dc2626" }}>{error}</p>
        <button onClick={fetchIngredients} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#FF380B" }}>
          {t("dashboard.ingredients.retry", "Thử lại")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      <div className="rounded-xl p-4 sm:p-5" style={{ background: "var(--bg-surface)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t("dashboard.ingredients.list.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border outline-none transition-all text-sm"
              style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>

          {types.length > 0 && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
            >
              <option value="all">
                {t("dashboard.ingredients.list.filter_all_types")}
              </option>
              {types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterActive(tab.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={filterActive === tab.id ? activeTabStyle : normalTabStyle}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("dashboard.ingredients.list.results_count", { count: filtered.length })}
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)" }}>
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", minWidth: 160 }}>
                  {t("dashboard.ingredients.list.col_name")}
                </th>
                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text)", width: 90 }}>
                  {t("dashboard.ingredients.list.col_code")}
                </th>
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", width: 70 }}>
                  {t("dashboard.ingredients.list.col_unit")}
                </th>
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap hidden xl:table-cell" style={{ color: "var(--text)", width: 120 }}>
                  {t("dashboard.ingredients.list.col_min_max")}
                </th>
                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", minWidth: 120 }}>
                  {t("dashboard.ingredients.list.col_supplier")}
                </th>
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text)", width: 90 }}>
                  {t("dashboard.ingredients.list.col_type")}
                </th>
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", width: 110 }}>
                  {t("dashboard.ingredients.list.col_status")}
                </th>
                <th className="text-center px-3 py-3 font-semibold" style={{ color: "var(--text)", width: 60 }}>
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getStatus(item);
                return (
                  <tr
                    key={item.id}
                    onClick={() => router.push(`/admin/ingredients/${item.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold truncate max-w-[180px]" style={{ color: "var(--text)" }}>{item.name}</p>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                      >
                        {item.code}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center" style={{ color: "var(--text)" }}>
                      {item.unit}
                    </td>

                    <td className="px-3 py-3 text-center text-xs hidden xl:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {item.minStockLevel} / {item.maxStockLevel}
                    </td>

                    <td className="px-3 py-3">
                      <p className="truncate max-w-[150px] text-sm" style={{ color: "var(--text)" }}>
                        {item.supplierName || (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </p>
                    </td>

                    <td className="px-3 py-3 text-center hidden lg:table-cell">
                      {item.type ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        >
                          {item.type}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={STATUS_BADGE[status]}
                      >
                        {item.isActive
                          ? t("dashboard.ingredients.list.badge_active")
                          : t("dashboard.ingredients.list.badge_inactive")}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/ingredients/${item.id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                        style={{ background: "rgba(255,56,11,0.1)", color: "#FF380B" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,56,11,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,56,11,0.1)")}
                        title={t("dashboard.ingredients.list.edit_tooltip")}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
          {filtered.map((item) => {
            const status = getStatus(item);
            return (
              <div
                key={item.id}
                onClick={() => router.push(`/admin/ingredients/${item.id}`)}
                className="p-4 cursor-pointer transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold truncate" style={{ color: "var(--text)" }}>{item.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{item.code}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0" style={STATUS_BADGE[status]}>
                    {item.isActive
                      ? t("dashboard.ingredients.list.badge_active")
                      : t("dashboard.ingredients.list.badge_inactive_short")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.ingredients.list.mobile_unit")}
                    </span>
                    <span style={{ color: "var(--text)" }}>{item.unit}</span>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.ingredients.list.mobile_min_max")}
                    </span>
                    <span style={{ color: "var(--text)" }}>{item.minStockLevel}/{item.maxStockLevel}</span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.ingredients.list.mobile_supplier")}
                    </span>
                    <span style={{ color: "var(--text)" }}>{item.supplierName || "—"}</span>
                  </div>
                  {item.type && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.list.mobile_type")}
                      </span>
                      <span style={{ color: "var(--text)" }}>{item.type}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-14">
            <p style={{ color: "var(--text-secondary)" }}>
              {t("dashboard.ingredients.list.empty")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
