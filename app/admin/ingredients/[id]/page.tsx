"use client";

import ingredientService, { IngredientItem } from "@/lib/services/ingredientService";
import supplierService, { SupplierItem } from "@/lib/services/supplierService";
import { App } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const UNITS = ["kg", "g", "lít", "ml", "pack", "bottle", "hộp", "túi", "cái", "portion", "serving"];

const fieldStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderColor: "var(--border)",
  color: "var(--text)",
};

const disabledFieldStyle: React.CSSProperties = {
  background: "var(--bg-base)",
  borderColor: "var(--border)",
  color: "var(--text-muted)",
  cursor: "not-allowed",
  opacity: 0.6,
};

export default function IngredientFormPage() {
  const { t } = useTranslation("common");
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [form, setForm] = useState<Omit<IngredientItem, "id" | "supplierName">>({
    name: "",
    code: "",
    unit: "kg",
    minStockLevel: 0,
    maxStockLevel: 0,
    supplierId: null,
    type: "",
    isActive: true,
  });

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasNoSuppliers = !loadingSuppliers && suppliers.length === 0;
  const cannotSave = isNew && hasNoSuppliers;

  useEffect(() => {
    fetchSuppliers();
    if (!isNew) fetchIngredient();
  }, [id, isNew]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await supplierService.getAll();
      setSuppliers(data.filter((s) => s.isActive));
    } catch {
      message.warning(t("dashboard.ingredients.fetch_suppliers_failed", { defaultValue: "Không tải được danh sách nhà cung cấp" }));
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchIngredient = async () => {
    try {
      setLoadingData(true);
      const data = await ingredientService.getById(id);
      setForm({
        name:          data.name          ?? "",
        code:          data.code          ?? "",
        unit:          data.unit          ?? "kg",
        minStockLevel: data.minStockLevel ?? 0,
        maxStockLevel: data.maxStockLevel ?? 0,
        supplierId:    data.supplierId    ?? null,
        type:          data.type          ?? "",
        isActive:      data.isActive      ?? true,
      });
    } catch {
      message.error(t("dashboard.ingredients.fetch_ingredient_failed", { defaultValue: "Không tải được thông tin nguyên liệu" }));
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value === "" && (name === "supplierId" || name === "type")
          ? null
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())        { message.error(t("dashboard.ingredients.name_required", { defaultValue: "Tên không được để trống" })); return; }
    if (!form.code.trim())        { message.error(t("dashboard.ingredients.code_required", { defaultValue: "Mã nguyên liệu không được để trống" })); return; }
    if (form.code.length > 20)    { message.error(t("dashboard.ingredients.code_max_length", { defaultValue: "Mã tối đa 20 ký tự" })); return; }
    if (form.unit.length > 20)    { message.error(t("dashboard.ingredients.unit_max_length", { defaultValue: "Đơn vị tối đa 20 ký tự" })); return; }
    if (isNew && !form.supplierId){ message.error(t("dashboard.ingredients.supplier_required", { defaultValue: "Vui lòng chọn nhà cung cấp" })); return; }

    try {
      setLoading(true);
      if (isNew) {
        await ingredientService.create(form);
        message.success(t("dashboard.ingredients.create_success", { defaultValue: "Tạo nguyên liệu thành công" }));
      } else {
        await ingredientService.update(id, { ...form, id });
        message.success(t("dashboard.ingredients.update_success", { defaultValue: "Cập nhật nguyên liệu thành công" }));
      }
      router.push("/admin/ingredients");
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || t("dashboard.ingredients.save_failed", { defaultValue: "Lưu thất bại, thử lại sau" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await ingredientService.delete(id);
      message.success(t("dashboard.ingredients.delete_success", { defaultValue: "Đã xoá nguyên liệu" }));
      router.push("/admin/ingredients");
    } catch (err: any) {
      message.error(err?.response?.data?.message || t("dashboard.ingredients.delete_failed", { defaultValue: "Xoá thất bại" }));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "#FF380B" }} />
        <span className="ml-4 text-lg font-medium" style={{ color: "var(--text-muted)" }}>{t("dashboard.ingredients.loading", { defaultValue: "Đang tải thông tin nguyên liệu..." })}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--bg-base)" }}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 mb-3 text-sm opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("dashboard.ingredients.back_to_list", "Quay lại danh sách")}
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
              {isNew ? t("dashboard.ingredients.add_title", "Thêm nguyên liệu") : t("dashboard.ingredients.edit_title", "Chỉnh sửa nguyên liệu")}
            </h2>
          </div>

          {/* ── No-supplier warning (add mode only) ── */}
          {isNew && hasNoSuppliers && (
            <div
              className="mb-6 rounded-xl p-4 flex items-start gap-3"
              style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.4)" }}
            >
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "#ca8a04" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#ca8a04" }}>
                  {t("dashboard.ingredients.no_suppliers", "Chưa có nhà cung cấp nào")}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#ca8a04", opacity: 0.85 }}>
                  Không thể thêm nguyên liệu. Vui lòng{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/admin/manage?tab=suppliers")}
                    className="underline font-medium hover:opacity-80"
                  >
                    {t("dashboard.ingredients.create_supplier", "tạo nhà cung cấp")}
                  </button>{" "}
                  trước.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Responsive: stack on mobile/small desktop, 2-col on lg */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              {/* ── LEFT: Form fields ── */}
              <div className="lg:col-span-8 space-y-5">

                {/* Basic Info */}
                <section
                  className="rounded-xl p-5 sm:p-6"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "#FF380B" }} />
                    Thông tin cơ bản
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name — full width */}
                    <div className="sm:col-span-2">
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.name", "Tên nguyên liệu")} <span style={{ color: "#FF380B" }}>*</span>
                      </label>
                      <input
                        type="text" name="name" value={form.name} onChange={handleChange} required
                        disabled={cannotSave}
                        placeholder="VD: Cá hồi tươi"
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>

                    {/* Code */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.code", "Mã")} <span style={{ color: "#FF380B" }}>*</span>{" "}
                        <span className="text-xs opacity-50">{t("dashboard.ingredients.code_max_length", "(max 20 ký tự)")}</span>
                      </label>
                      <input
                        type="text" name="code" value={form.code} onChange={handleChange}
                        required maxLength={20}
                        disabled={cannotSave}
                        placeholder="VD: CA_HOI"
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20 font-mono"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.unit", "Đơn vị")} <span style={{ color: "#FF380B" }}>*</span>
                      </label>
                      <select
                        name="unit" value={form.unit} onChange={handleChange}
                        disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      >
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    {/* Supplier — REQUIRED */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.supplier", "Nhà cung cấp")} <span style={{ color: "#FF380B" }}>*</span>
                      </label>
                      {loadingSuppliers ? (
                        <div
                          className="w-full px-3 py-2.5 rounded-lg border text-sm"
                          style={disabledFieldStyle}
                        >
                          {t("dashboard.ingredients.loading_suppliers", "Đang tải…")}
                        </div>
                      ) : hasNoSuppliers ? (
                        <div
                          className="w-full px-3 py-2.5 rounded-lg border text-sm flex items-center gap-2"
                          style={disabledFieldStyle}
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          {t("dashboard.ingredients.no_suppliers", "Không có nhà cung cấp nào")}
                        </div>
                      ) : (
                        <select
                          name="supplierId"
                          value={form.supplierId ?? ""}
                          onChange={handleChange}
                          required={isNew}
                          className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                          style={fieldStyle}
                        >
                          <option value="" disabled>{t("dashboard.ingredients.select_supplier", "— Chọn nhà cung cấp —")}</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Loại / Danh mục
                        <span className="ml-1 text-xs opacity-50">(tuỳ chọn)</span>
                      </label>
                      <input
                        type="text" name="type"
                        value={form.type ?? ""}
                        onChange={handleChange}
                        maxLength={50}
                        disabled={cannotSave}
                        placeholder="VD: Seafood, Grains…"
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>
                  </div>
                </section>

                {/* Stock Levels */}
                <section
                  className="rounded-xl p-5 sm:p-6"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "#FF380B" }} />
                    Mức tồn kho
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Mức tối thiểu (Min)
                      </label>
                      <input
                        type="number" name="minStockLevel"
                        min={0} step="0.001"
                        value={form.minStockLevel}
                        onChange={handleChange}
                        disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Mức tối đa (Max)
                      </label>
                      <input
                        type="number" name="maxStockLevel"
                        min={0} step="0.001"
                        value={form.maxStockLevel}
                        onChange={handleChange}
                        disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Đơn vị tính theo <strong>{form.unit || "—"}</strong>.
                    Tồn kho thực tế quản lý qua module <strong>Inventory Stock</strong>.
                  </p>
                </section>
              </div>

              {/* ── RIGHT: Sidebar ── */}
              <div className="lg:col-span-4 space-y-5">

                {/* Action buttons */}
                <section
                  className="rounded-xl p-5 sm:p-6"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "#FF380B" }} />
                    Thao tác
                  </h3>

                  <div className="space-y-3">
                    {/* Save */}
                    <button
                      type="submit"
                      disabled={loading || cannotSave}
                      title={cannotSave ? "Cần có ít nhất một nhà cung cấp trước khi thêm nguyên liệu" : undefined}
                      className="w-full py-2.5 rounded-lg font-bold text-white transition-all
                        hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ background: loading || cannotSave ? "#aaa" : "#FF380B" }}
                      onMouseEnter={(e) => { if (!loading && !cannotSave) e.currentTarget.style.background = "#CC2D08"; }}
                      onMouseLeave={(e) => { if (!loading && !cannotSave) e.currentTarget.style.background = "#FF380B"; }}
                    >
                      {loading
                        ? "Đang lưu…"
                        : isNew ? "Tạo nguyên liệu" : "Cập nhật"}
                    </button>

                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full py-2.5 rounded-lg font-medium transition-all"
                      style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      Huỷ
                    </button>

                    {/* Delete */}
                    {!isNew && !showDeleteConfirm && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2.5 rounded-lg font-medium transition-all"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                      >
                        Xoá nguyên liệu
                      </button>
                    )}
                  </div>

                  {/* Delete confirm */}
                  {!isNew && showDeleteConfirm && (
                    <div
                      className="mt-4 p-3 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
                    >
                      <p className="text-sm font-medium mb-3" style={{ color: "#dc2626" }}>
                        Xoá &quot;{form.name}&quot;? Không thể hoàn tác.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button" onClick={handleDelete} disabled={loading}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                          style={{ background: "#dc2626" }}
                        >
                          Xoá
                        </button>
                        <button
                          type="button" onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-lg text-sm font-medium"
                          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Status toggle */}
                <section
                  className="rounded-xl p-5 sm:p-6"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "#FF380B" }} />
                    Trạng thái
                  </h3>

                  <div
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--surface)" }}
                  >
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                        {form.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {form.isActive ? "Nguyên liệu đang hoạt động" : "Nguyên liệu bị vô hiệu hoá"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input
                        type="checkbox" name="isActive"
                        checked={form.isActive} onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 rounded-full peer
                          peer-checked:after:translate-x-full peer-checked:after:border-white
                          after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                          after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{ background: form.isActive ? "#FF380B" : "#4b5563" }}
                      />
                    </label>
                  </div>
                </section>

                {/* System info (edit only) */}
                {!isNew && (
                  <section
                    className="rounded-xl p-4"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      Thông tin hệ thống
                    </p>
                    <p className="text-xs break-all" style={{ color: "var(--text-muted)" }}>ID: {id}</p>
                  </section>
                )}
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
