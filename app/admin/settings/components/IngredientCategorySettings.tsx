"use client";

import { Popconfirm } from "antd";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ingredientService, { IngredientCategory } from "@/lib/services/ingredientService";
import { getTypeTranslation, upsertTypeTranslations, type SupportedLocale } from "@/lib/i18n/dynamicTypeTranslations";

const toTypeTranslationKey = (value?: string | null) => (value || "").trim().toLowerCase().replace(/\s+/g, "_");

const normalizeCode = (value?: string | null) => (value || "").trim().toLowerCase();

const generateCode = (en?: string | null, vi?: string | null, fallback?: string | null) => {
  const source = (en || vi || fallback || "").trim();
  if (!source) return "";
  return source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
};

export default function IngredientCategorySettings() {
  const { t, i18n } = useTranslation("common");
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "vi";

  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<IngredientCategory>({
    id: "",
    code: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");

  const getCategoryLabel = (category: IngredientCategory) => {
    const code = normalizeCode(category.code || category.name);
    const fallback = category.name;
    const dynamicValue = getTypeTranslation(code, locale, fallback);
    return t(`dashboard.ingredients.type_codes.${toTypeTranslationKey(code)}`, { defaultValue: dynamicValue || fallback });
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await ingredientService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load ingredient categories:", error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleOpenModal = (category?: IngredientCategory) => {
    if (category) {
      const code = normalizeCode(category.code || category.name);
      setEditingCategory(category);
      setFormData({
        id: category.id,
        code,
        name: category.name,
        description: category.description ?? "",
        isActive: category.isActive ?? true,
      });
      setNameVi(getTypeTranslation(code, "vi", category.name));
      setNameEn(getTypeTranslation(code, "en", category.name));
    } else {
      setEditingCategory(null);
      setFormData({ id: "", code: "", name: "", description: "", isActive: true });
      setNameVi("");
      setNameEn("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async () => {
    if (!nameVi.trim() && !nameEn.trim()) return;

    const code = normalizeCode(formData.code || generateCode(nameEn, nameVi, formData.name));
    if (!code) return;

    const resolvedName = locale === "en" ? (nameEn.trim() || nameVi.trim()) : (nameVi.trim() || nameEn.trim());

    try {
      setIsSaving(true);

      const payload: IngredientCategory = {
        ...formData,
        code,
        name: resolvedName,
        description: formData.description?.trim() || null,
        isActive: formData.isActive ?? true,
      };

      if (editingCategory?.id) {
        await ingredientService.updateCategory(editingCategory.id, {
          ...payload,
          id: editingCategory.id,
        });
      } else {
        await ingredientService.createCategory(payload);
      }

      upsertTypeTranslations(code, {
        vi: nameVi || resolvedName,
        en: nameEn || resolvedName,
      });

      await loadCategories();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save ingredient category:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ingredientService.deleteCategory(id);
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete ingredient category:", error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {t("dashboard.manage.ingredient_categories.title")}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.manage.ingredient_categories.subtitle")}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl"
          style={{ background: "linear-gradient(135deg, #FF380B 0%, #ff5e3a 100%)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("dashboard.manage.ingredient_categories.add")}
        </button>
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: "var(--bg-base)" }}>
              <tr>
                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.ingredient_categories.name")}
                </th>
                <th className="p-5 font-semibold text-sm tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.ingredient_categories.description")}
                </th>
                <th className="p-5 font-semibold text-sm tracking-wide uppercase text-right" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.ingredient_categories.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {!isLoading &&
                categories.map((cat) => (
                  <tr key={cat.id} className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #FF380B 0%, #ff5e3a 100%)", opacity: 0.9 }}>
                          {getCategoryLabel(cat)?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold" style={{ color: "var(--text)" }}>
                          {getCategoryLabel(cat)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {cat.description || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(cat)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500 hover:text-blue-600" title={t("dashboard.manage.ingredient_categories.tooltip_edit")}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <Popconfirm title={t("dashboard.manage.ingredient_categories.confirm_delete")} onConfirm={() => cat.id && handleDelete(cat.id)} okText={t("common.yes", { defaultValue: "Yes" })} cancelText={t("common.no", { defaultValue: "No" })} okButtonProps={{ danger: true }}>
                          <button className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 hover:text-red-600" title={t("dashboard.manage.ingredient_categories.tooltip_delete")}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </Popconfirm>
                      </div>
                    </td>
                  </tr>
                ))}

              {(isLoading || categories.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <p className="text-lg font-medium" style={{ color: "var(--text)" }}>
                        {isLoading ? t("common.loading", { defaultValue: "Loading..." }) : t("dashboard.manage.ingredient_categories.empty_title")}
                      </p>
                      {!isLoading && (
                        <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.manage.ingredient_categories.empty")}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={handleCloseModal}>
            <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: "var(--border)" }}>
                <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  {editingCategory ? t("dashboard.manage.ingredient_categories.edit", { defaultValue: "Edit Category" }) : t("dashboard.manage.ingredient_categories.add", { defaultValue: "Add Category" })}
                </h3>
                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.ingredient_categories.name")} (VI)
                  </label>
                  <input
                    type="text"
                    value={nameVi}
                    onChange={(e) => setNameVi(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }}
                    placeholder="Ví dụ: Hải sản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.ingredient_categories.name")} (EN)
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }}
                    placeholder="Example: Seafood"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                    Code
                  </label>
                  <input
                    type="text"
                    value={formData.code ?? ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none"
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }}
                    placeholder="seafood"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.ingredient_categories.description")}
                  </label>
                  <textarea
                    value={formData.description ?? ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[#FF380B]/10 focus:border-[#FF380B] transition-all outline-none resize-none"
                    rows={3}
                    style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }}
                    placeholder={t("dashboard.manage.ingredient_categories.description_placeholder")}
                  />
                </div>
              </div>

              <div className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
                <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.buttons.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={(!nameVi.trim() && !nameEn.trim()) || isSaving}
                  className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl shadow-[#FF380B]/20 hover:shadow-[#FF380B]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#FF380B" }}
                >
                  {isSaving ? t("common.saving", { defaultValue: "Saving..." }) : t("dashboard.settings.buttons.save_changes")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
