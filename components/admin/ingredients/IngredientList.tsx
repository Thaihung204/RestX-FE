"use client";

import ingredientService, { IngredientItem } from "@/lib/services/ingredientService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

// ── Status ────────────────────────────────────────────────────────────────────

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
      setError(err?.response?.data?.message || "Không tải được danh sách nguyên liệu");
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
    { id: "all",      label: "Tất cả" },
    { id: "active",   label: "Đang dùng" },
    { id: "inactive", label: "Ngừng dùng" },
  ];

  const activeTabStyle: React.CSSProperties  = { background: "#FF380B", color: "white" };
  const normalTabStyle: React.CSSProperties  = { background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#FF380B" }} />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <p className="text-sm mb-3" style={{ color: "#dc2626" }}>{error}</p>
        <button onClick={fetchIngredients} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#FF380B" }}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Filters ── */}
      <div className="rounded-xl p-4 sm:p-5" style={{ background: "var(--bg-surface)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm tên, mã hoặc nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border outline-none transition-all text-sm"
              style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
            />
          </div>

          {/* Type filter */}
          {types.length > 0 && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: "var(--bg-base)", color: "var(--text)", borderColor: "var(--border)" }}
            >
              <option value="all">Tất cả loại</option>
              {types.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          )}
        </div>

        {/* Status tabs + count */}
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
            {filtered.length} kết quả
          </span>
        </div>
      </div>

      {/* ── Table (desktop md+) ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)" }}>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)" }}>
                {/* Tên – always visible */}
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", minWidth: 160 }}>
                  Tên nguyên liệu
                </th>
                {/* Mã – hidden on md, show lg+ */}
                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text)", width: 90 }}>
                  Mã
                </th>
                {/* Đơn vị */}
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", width: 70 }}>
                  Đơn vị
                </th>
                {/* Min/Max – hidden on md, show xl+ */}
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap hidden xl:table-cell" style={{ color: "var(--text)", width: 120 }}>
                  Min / Max
                </th>
                {/* Nhà CC */}
                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", minWidth: 120 }}>
                  Nhà cung cấp
                </th>
                {/* Loại – hidden on md, show lg+ */}
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--text)", width: 90 }}>
                  Loại
                </th>
                {/* Trạng thái */}
                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--text)", width: 110 }}>
                  Trạng thái
                </th>
                {/* Actions */}
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
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-semibold truncate max-w-[180px]" style={{ color: "var(--text)" }}>{item.name}</p>
                    </td>

                    {/* Code */}
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ background: "var(--bg-base)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                      >
                        {item.code}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-3 text-center" style={{ color: "var(--text)" }}>
                      {item.unit}
                    </td>

                    {/* Min/Max */}
                    <td className="px-3 py-3 text-center text-xs hidden xl:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {item.minStockLevel} / {item.maxStockLevel}
                    </td>

                    {/* Supplier */}
                    <td className="px-3 py-3">
                      <p className="truncate max-w-[150px] text-sm" style={{ color: "var(--text)" }}>
                        {item.supplierName || <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </p>
                    </td>

                    {/* Type */}
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

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={STATUS_BADGE[status]}
                      >
                        {item.isActive ? "Đang dùng" : "Ngừng dùng"}
                      </span>
                    </td>

                    {/* Action btn */}
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/admin/ingredients/${item.id}`)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all"
                        style={{ background: "rgba(255,56,11,0.1)", color: "#FF380B" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,56,11,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,56,11,0.1)")}
                        title="Chỉnh sửa"
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

        {/* ── Mobile cards (< md) ── */}
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
                    {item.isActive ? "Đang dùng" : "Ngừng"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Đơn vị: </span>
                    <span style={{ color: "var(--text)" }}>{item.unit}</span>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Min/Max: </span>
                    <span style={{ color: "var(--text)" }}>{item.minStockLevel}/{item.maxStockLevel}</span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Nhà CC: </span>
                    <span style={{ color: "var(--text)" }}>{item.supplierName || "—"}</span>
                  </div>
                  {item.type && (
                    <div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Loại: </span>
                      <span style={{ color: "var(--text)" }}>{item.type}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="text-center py-14">
            <p style={{ color: "var(--text-secondary)" }}>Không tìm thấy nguyên liệu nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
