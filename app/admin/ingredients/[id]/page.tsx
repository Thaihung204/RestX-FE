"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { DropDown } from "@/components/ui/DropDown";
import StatusToggle from "@/components/ui/StatusToggle";
import ingredientService, { IngredientCategory, IngredientItem } from "@/lib/services/ingredientService";
import supplierService, { SupplierItem } from "@/lib/services/supplierService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
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
    currentQuantity: 0,
    status: 0,
  });

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<IngredientCategory[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasNoSuppliers = !loadingSuppliers && suppliers.length === 0;
  const cannotSave = isNew && hasNoSuppliers;

  const normalizeTypeCode = (value?: string | null) => {
    if (!value) return "";
    const trimmed = value.trim();
    const found = ingredientCategories.find((c) => c.code === trimmed || c.name === trimmed);
    return found?.code || trimmed;
  };

  const toTypeTranslationKey = (value?: string | null) => {
    if (!value) return "";
    return value.trim().toLowerCase().replace(/\s+/g, "_");
  };

  const getCategoryLabel = (category: IngredientCategory) => {
    const normalizedCode = normalizeTypeCode(category.code || category.name);
    return t(`dashboard.ingredients.type_codes.${toTypeTranslationKey(normalizedCode)}`, {
      defaultValue: category.name,
    });
  };

  useEffect(() => {
    fetchSuppliers();
    fetchIngredientCategories();
    if (!isNew) fetchIngredient();
  }, [id, isNew]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await supplierService.getAll();
      setSuppliers(data.filter((s) => s.isActive));
    } catch (err: unknown) {
      message.warning(extractApiErrorMessage(err, t("dashboard.ingredients.fetch_suppliers_failed")));
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchIngredientCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await ingredientService.getAllCategories();
      setIngredientCategories(data.filter((c) => c.isActive !== false));
    } catch (err: unknown) {
      message.warning(extractApiErrorMessage(err, t("dashboard.ingredients.fetch_categories_failed")));
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchIngredient = async () => {
    try {
      setLoadingData(true);
      const data = await ingredientService.getById(id);
      setForm({
        name: data.name ?? "",
        code: data.code ?? "",
        unit: data.unit ?? "kg",
        minStockLevel: data.minStockLevel ?? 0,
        maxStockLevel: data.maxStockLevel ?? 0,
        supplierId: data.supplierId ?? null,
        type: normalizeTypeCode(data.type),
        isActive: data.isActive ?? true,
        currentQuantity: data.currentQuantity ?? 0,
        status: data.status ?? 0,
      });
    } catch (err: unknown) {
      message.error(extractApiErrorMessage(err, t("dashboard.ingredients.fetch_ingredient_failed")));
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
          : type === "number" || name === "status"
          ? Number(value)
          : value === "" && (name === "supplierId" || name === "type")
          ? null
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())        { message.error(t("dashboard.ingredients.name_required")); return; }
    if (!form.code.trim())        { message.error(t("dashboard.ingredients.code_required")); return; }
    if (form.code.length > 20)    { message.error(t("dashboard.ingredients.code_max_length")); return; }
    if (form.unit.length > 20)    { message.error(t("dashboard.ingredients.unit_max_length")); return; }
    if (isNew && !form.supplierId){ message.error(t("dashboard.ingredients.supplier_required")); return; }

    const normalizedPayload = { ...form, type: normalizeTypeCode(form.type) };

    try {
      setLoading(true);
      if (isNew) {
        await ingredientService.create(normalizedPayload);
        message.success(t("dashboard.ingredients.create_success"));
      } else {
        await ingredientService.update(id, { ...normalizedPayload, id });
        message.success(t("dashboard.ingredients.update_success"));
      }
      router.push("/admin/ingredients");
    } catch (err: unknown) {
      message.error(extractApiErrorMessage(err, t("dashboard.ingredients.save_failed")));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await ingredientService.delete(id);
      message.success(t("dashboard.ingredients.delete_success"));
      router.push("/admin/ingredients");
    } catch (err: unknown) {
      message.error(extractApiErrorMessage(err, t("dashboard.ingredients.delete_failed")));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: "var(--primary)" }} />
        <span className="ml-4 text-lg font-medium" style={{ color: "var(--text-muted)" }}>{t("dashboard.ingredients.loading")}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: "var(--bg-base)" }}>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              ← {t("admin.order_detail.actions.back")}
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--text)" }}>
              {isNew ? t("dashboard.ingredients.add_title") : t("dashboard.ingredients.edit_title")}
            </h2>
          </div>

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
                  {t("dashboard.ingredients.no_suppliers")}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "#ca8a04", opacity: 0.85 }}>
                  {t("dashboard.ingredients.no_supplier_warning")}{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/admin/manage?tab=suppliers")}
                    className="underline font-medium hover:opacity-80"
                  >
                    {t("dashboard.ingredients.create_supplier")}
                  </button>{" "}
                  {t("dashboard.ingredients.no_supplier_warning_after")}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

              <div className="lg:col-span-8 space-y-5">
                <section className="rounded-xl p-5 sm:p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                    {t("dashboard.ingredients.basic_info")}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.name")}
                      </label>
                      <input
                        type="text" name="name" value={form.name} onChange={handleChange} required
                        disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.code")}{" "}
                        <span className="text-xs opacity-50">{t("dashboard.ingredients.code_max_length")}</span>
                      </label>
                      <input
                        type="text" name="code" value={form.code} onChange={handleChange}
                        required maxLength={20}
                        disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20 font-mono"
                        style={cannotSave ? disabledFieldStyle : fieldStyle}
                      />
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.unit")}
                      </label>
                      <DropDown name="unit" value={form.unit} onChange={handleChange} disabled={cannotSave} className="px-3" style={cannotSave ? disabledFieldStyle : fieldStyle}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </DropDown>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.supplier")}
                      </label>
                      {loadingSuppliers ? (
                        <div className="w-full px-3 py-2.5 rounded-lg border text-sm" style={disabledFieldStyle}>
                          {t("dashboard.ingredients.loading_suppliers")}
                        </div>
                      ) : hasNoSuppliers ? (
                        <div className="w-full px-3 py-2.5 rounded-lg border text-sm flex items-center gap-2" style={disabledFieldStyle}>
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          {t("dashboard.ingredients.no_suppliers")}
                        </div>
                      ) : (
                        <DropDown name="supplierId" value={form.supplierId ?? ""} onChange={handleChange} required={isNew} className="px-3" style={fieldStyle}>
                          <option value="" disabled>{t("dashboard.ingredients.select_supplier")}</option>
                          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </DropDown>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.type")}
                        <span className="ml-1 text-xs opacity-50">{t("dashboard.ingredients.type_optional")}</span>
                      </label>
                      {loadingCategories ? (
                        <div className="w-full px-3 py-2.5 rounded-lg border text-sm" style={disabledFieldStyle}>
                          {t("dashboard.ingredients.loading_categories")}
                        </div>
                      ) : (
                        <DropDown name="type" value={form.type ?? ""} onChange={handleChange} disabled={cannotSave} className="px-3" style={cannotSave ? disabledFieldStyle : fieldStyle}>
                          {ingredientCategories.map((c) => (
                            <option key={c.id} value={c.code ?? c.name}>{getCategoryLabel(c)}</option>
                          ))}
                        </DropDown>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-xl p-5 sm:p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                    {t("dashboard.ingredients.stock_levels")}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.min_stock")}
                      </label>
                      <input type="number" name="minStockLevel" min={0} step="0.001" value={form.minStockLevel || ""} onChange={handleChange} disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle} />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.max_stock")}
                      </label>
                      <input type="number" name="maxStockLevel" min={0} step="0.001" value={form.maxStockLevel || ""} onChange={handleChange} disabled={cannotSave}
                        className="w-full px-3 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                        style={cannotSave ? disabledFieldStyle : fieldStyle} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.ingredients.stock_status_label")}
                      </label>
                      <DropDown name="status" value={form.status ?? 0} onChange={handleChange} disabled={cannotSave} className="px-3" style={cannotSave ? disabledFieldStyle : fieldStyle}>
                        <option value={0}>{t("dashboard.ingredients.status_values.in_stock")}</option>
                        <option value={1}>{t("dashboard.ingredients.status_values.low_stock")}</option>
                        <option value={2}>{t("dashboard.ingredients.status_values.out_of_stock")}</option>
                      </DropDown>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.stock_unit_note", { unit: form.unit || "—" })}
                  </p>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-5">
                <section className="rounded-xl p-5 sm:p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-base font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                    {t("dashboard.ingredients.actions_section")}
                  </h3>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={loading || cannotSave}
                      title={cannotSave ? t("dashboard.ingredients.need_supplier_tooltip") : undefined}
                      className="w-full py-2.5 rounded-lg font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ background: loading || cannotSave ? "#aaa" : "var(--primary)", color: "white" }}
                      onMouseEnter={(e) => { if (!loading && !cannotSave) e.currentTarget.style.background = "#CC2D08"; }}
                      onMouseLeave={(e) => { if (!loading && !cannotSave) e.currentTarget.style.background = "var(--primary)"; }}
                    >
                      {loading ? t("dashboard.ingredients.saving") : isNew ? t("dashboard.ingredients.create_btn") : t("dashboard.ingredients.update_btn")}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full py-2.5 rounded-lg font-medium transition-all"
                      style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {t("dashboard.ingredients.cancel")}
                    </button>

                    {!isNew && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-2.5 rounded-lg font-medium transition-all"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.3)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                      >
                        {t("dashboard.ingredients.delete_btn_label")}
                      </button>
                    )}
                  </div>
                </section>

                <section className="rounded-xl p-5 sm:p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-4 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                    {t("dashboard.ingredients.status_section")}
                  </h3>

                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface)" }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                        {form.isActive ? t("dashboard.ingredients.status_active") : t("dashboard.ingredients.status_inactive")}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {form.isActive ? t("dashboard.ingredients.status_desc_active") : t("dashboard.ingredients.status_desc_inactive")}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      <StatusToggle
                        checked={form.isActive}
                        onChange={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      />
                    </div>
                  </div>
                </section>
              </div>

            </div>
          </form>
        </div>
      </main>

      <ConfirmModal
        open={showDeleteConfirm}
        title={t("dashboard.ingredients.confirm_delete_title")}
        description={t("dashboard.ingredients.confirm_delete_desc", { name: form.name })}
        confirmText={t("common.actions.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
