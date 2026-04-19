"use client";

import { getTypeTranslation, upsertTypeTranslations, type SupportedLocale } from "@/lib/i18n/dynamicTypeTranslations";
import ingredientService, { IngredientCategory } from "@/lib/services/ingredientService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const toTypeTranslationKey = (value?: string | null) => (value || "").trim().toLowerCase().replace(/\s+/g, "_");
const normalizeCode = (value?: string | null) => (value || "").trim().toLowerCase();
const generateCode = (en?: string | null, vi?: string | null, fallback?: string | null) => {
  const source = (en || vi || fallback || "").trim();
  if (!source) return "";
  return source.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
};

export default function IngredientCategorySettings() {
  const { t, i18n } = useTranslation("common");
  const { message } = App.useApp();
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "vi";

  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IngredientCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<IngredientCategory>({ id: "", code: "", name: "", description: "", isActive: true });

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
      setCategories([]);
      message.error(
        extractApiErrorMessage(
          error,
          t("dashboard.manage.ingredient_categories.fetch_failed", {
            defaultValue: "Failed to load ingredient categories",
          }),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadCategories(); }, []);

  const handleOpenModal = (category?: IngredientCategory) => {
    if (category) {
      const code = normalizeCode(category.code || category.name);
      setEditingCategory(category);
      setFormData({ id: category.id, code, name: getCategoryLabel(category), description: category.description ?? "", isActive: category.isActive ?? true });
    } else {
      setEditingCategory(null);
      setFormData({ id: "", code: "", name: "", description: "", isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingCategory(null); };

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    const code = normalizeCode(formData.code || generateCode(undefined, undefined, formData.name));
    if (!code) return;
    const resolvedName = formData.name.trim();
    try {
      setIsSaving(true);
      const payload: IngredientCategory = { ...formData, code, name: resolvedName, description: formData.description?.trim() || null, isActive: formData.isActive ?? true };
      if (editingCategory?.id) {
        await ingredientService.updateCategory(editingCategory.id, { ...payload, id: editingCategory.id });
      } else {
        await ingredientService.createCategory({ code: payload.code, name: payload.name, description: payload.description, isActive: payload.isActive });
      }
      upsertTypeTranslations(code, { vi: resolvedName, en: resolvedName });
      await loadCategories();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save ingredient category", error);
      message.error(
        extractApiErrorMessage(
          error,
          t("dashboard.manage.ingredient_categories.save_failed", {
            defaultValue: "Failed to save ingredient category",
          }),
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ingredientService.deleteCategory(id);
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete ingredient category", error);
      message.error(
        extractApiErrorMessage(
          error,
          t("dashboard.manage.ingredient_categories.delete_failed", {
            defaultValue: "Failed to delete ingredient category",
          }),
        ),
      );
    }
  };

  const columns: ColumnsType<IngredientCategory> = [
    {
      title: t("dashboard.manage.ingredient_categories.name"),
      key: "name",
      render: (_, cat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #ff5e3a 100%)", opacity: 0.9 }}>
            {getCategoryLabel(cat)?.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold" style={{ color: "var(--text)" }}>{getCategoryLabel(cat)}</span>
        </div>
      ),
    },
    {
      title: t("dashboard.manage.ingredient_categories.description"),
      dataIndex: "description",
      key: "description",
      render: (text) => <span className="text-sm" style={{ color: "var(--text-muted)" }}>{text || "-"}</span>,
    },
    {
      title: t("dashboard.manage.ingredient_categories.actions"),
      key: "actions",
      align: "right",
      width: 100,
      render: (_, cat) => (
        <div className="flex justify-end gap-2">
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleOpenModal(cat)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" />
          <Popconfirm
            title={t("dashboard.manage.ingredient_categories.confirm_delete")}
            onConfirm={() => cat.id && handleDelete(cat.id)}
            okText={t("common.actions.yes", { defaultValue: "Yes" })}
            cancelText={t("common.actions.no", { defaultValue: "No" })}
            okButtonProps={{ danger: true }}>
            <Button type="text" icon={<DeleteOutlined className="text-red-500" />} className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">{t("dashboard.manage.ingredient_categories.title")}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("dashboard.manage.ingredient_categories.subtitle")}</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
          {t("dashboard.manage.ingredient_categories.add")}
        </Button>
      </div>

      <Table columns={columns} dataSource={categories} rowKey={(r) => r.id || r.name} loading={isLoading} pagination={{ pageSize: 10 }} className="admin-loyalty-table" />

      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={handleCloseModal}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {editingCategory ? t("dashboard.manage.ingredient_categories.edit", { defaultValue: "Edit Category" }) : t("dashboard.manage.ingredient_categories.add", { defaultValue: "Add Category" })}
              </h3>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.ingredient_categories.name")}</label>
                <input type="text" value={formData.name ?? ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>Code</label>
                <input type="text" value={formData.code ?? ""} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.manage.ingredient_categories.description")}</label>
                <textarea value={formData.description ?? ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none"
                  rows={3} style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
            </div>
            <div className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.buttons.cancel")}
              </button>
              <button onClick={handleSave} disabled={!formData.name?.trim() || isSaving}
                className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)" }}>
                {isSaving ? t("common.saving", { defaultValue: "Saving..." }) : t("dashboard.settings.buttons.save_changes")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
