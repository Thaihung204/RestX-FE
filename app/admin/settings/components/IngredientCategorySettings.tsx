"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";
import { getTypeTranslation, upsertTypeTranslations, type SupportedLocale } from "@/lib/i18n/dynamicTypeTranslations";
import ingredientService, { IngredientCategory } from "@/lib/services/ingredientService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Popconfirm, Table, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import aiService from "@/lib/services/aiService";
import type { AIContentVariant } from "@/lib/types/ai";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IngredientCategory | null>(null);
  const [formData, setFormData] = useState<IngredientCategory>({ id: "", code: "", name: "", description: "", isActive: true });

  // AI Generator specific state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptModalOpen, setAiPromptModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIContentVariant[]>([]);

  const handleGenerateDescription = async () => {
    const normalizedPrompt = aiPrompt.trim();

    if (!normalizedPrompt) {
      message.warning(
        t("dashboard.settings.ai_content.empty_result", {
          defaultValue: "Please enter a prompt before generating AI content.",
        }),
      );
      return;
    }

    try {
      setAiGenerating(true);
      setAiSuggestions([]);

      const response = await aiService.generateContent({ prompt: normalizedPrompt });

      const variants = (response?.variants || []).filter(
        (item) => typeof item?.content === "string" && item.content.trim().length > 0,
      );

      if (variants.length === 0) {
        message.warning(
          t("dashboard.settings.ai_content.empty_result", {
            defaultValue: "AI did not return any content. Please try another prompt.",
          }),
        );
        return;
      }

      setAiSuggestions(variants);
      setAiPromptModalOpen(false);
      message.success(
        t("dashboard.settings.ai_content.generate_success", {
          defaultValue: "AI content generated. Choose one variant below.",
        }),
      );
    } catch (err) {
      message.error(
        t("dashboard.settings.ai_content.generate_failed", {
          defaultValue: "Failed to generate content with AI.",
        }),
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAIVariant = (variant: AIContentVariant) => {
    setFormData((prev) => ({ ...prev, description: variant.content || "" }));
    message.success(
      t("dashboard.settings.ai_content.apply_success", {
        defaultValue: "Description updated from AI variant.",
      }),
    );
  };

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
      message.error(extractApiErrorMessage(error, t("dashboard.manage.ingredient_categories.fetch_failed")));
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
      message.error(extractApiErrorMessage(error, t("dashboard.manage.ingredient_categories.save_failed")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      await ingredientService.deleteCategory(id);
      message.success(t("dashboard.manage.ingredient_categories.deleted"));
      await loadCategories();
    } catch (error) {
      console.error("Failed to delete ingredient category", error);
      message.error(extractApiErrorMessage(error, t("dashboard.manage.ingredient_categories.delete_failed")));
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
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
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleOpenModal(cat)} disabled={!!deletingId || isSaving} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" />
          <Button type="text" icon={<DeleteOutlined className="text-red-500" />} loading={deletingId === cat.id} disabled={!!deletingId || isSaving} onClick={() => setPendingDelete(cat)} className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" />
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} disabled={isLoading}
          style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
          {t("dashboard.manage.ingredient_categories.add")}
        </Button>
      </div>

      <Table columns={columns} dataSource={categories} rowKey={(r) => r.id || r.name} loading={isLoading} pagination={false} className="admin-loyalty-table" />

      <ConfirmModal
        open={!!pendingDelete}
        title={t("dashboard.manage.ingredient_categories.confirm_delete")}
        description={t("dashboard.manage.ingredient_categories.confirm_delete_desc", { name: pendingDelete ? getCategoryLabel(pendingDelete) : "" })}
        confirmText={t("common.actions.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        loading={!!deletingId}
        onConfirm={() => pendingDelete?.id && handleDelete(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />

      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={handleCloseModal}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {editingCategory ? t("dashboard.manage.ingredient_categories.edit") : t("dashboard.manage.ingredient_categories.add")}
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
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: "var(--text)" }}>{t("dashboard.manage.ingredient_categories.description")}</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!aiPrompt) {
                        setAiPrompt(`Hãy tạo mô tả tối đa 50 từ cho phân loại nguyên liệu ${formData.name || ""}`.trim());
                      }
                      setAiPromptModalOpen(true);
                    }}
                    disabled={aiGenerating}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
                    style={{
                      background: "var(--primary)",
                      border: "1px solid var(--primary)",
                      color: "#fff",
                    }}>
                    {aiGenerating
                      ? t("dashboard.settings.ai_content.generating", {
                        defaultValue: "Generating...",
                      })
                      : t("dashboard.settings.ai_content.generate", {
                        defaultValue: "Generate AI",
                      })}
                  </button>
                </div>
                <textarea value={formData.description ?? ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none"
                  rows={3} style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
                {aiSuggestions.length > 0 && (
                  <div
                    className="rounded-xl p-3 space-y-2 mt-3"
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                    }}>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {t("dashboard.settings.ai_content.variants_title", {
                        defaultValue: "AI variants (click one to apply)",
                      })}
                    </p>

                    <div className="space-y-2">
                      {aiSuggestions.map((variant, index) => (
                        <button
                          key={`cat-ai-variant-${index}`}
                          type="button"
                          onClick={() => applyAIVariant(variant)}
                          className="w-full text-left rounded-lg px-3 py-2 transition-colors"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                          }}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                              {variant.headline ||
                                t("dashboard.settings.ai_content.variant_label", {
                                  defaultValue: "Variant {{index}}",
                                  index: index + 1,
                                })}
                            </p>

                            {typeof variant.score === "number" && (
                              <span
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  background: "rgba(0,0,0,0.08)",
                                  color: "var(--text-muted)",
                                }}>
                                {t("dashboard.settings.ai_content.score_label", {
                                  defaultValue: "Score: {{score}}",
                                  score: variant.score,
                                })}
                              </span>
                            )}
                          </div>

                          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                            {variant.content}
                          </p>

                          {variant.scoreNote && (
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                              {variant.scoreNote}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.buttons.cancel")}
              </button>
              <button onClick={handleSave} disabled={!formData.name?.trim() || isSaving}
                className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)" }}>
                {isSaving ? t("common.saving") : t("dashboard.settings.buttons.save_changes")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* AI Generate Prompt Modal */}
      <Modal
        className="ai-generate-modal"
        open={aiPromptModalOpen}
        onCancel={() => {
          if (!aiGenerating) {
            setAiPromptModalOpen(false);
          }
        }}
        footer={null}
        centered
        destroyOnHidden>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            {t("dashboard.settings.ai_content.prompt_modal_title", {
              defaultValue: "Generate description with AI",
            })}
          </h3>

          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.settings.ai_content.prompt_modal_hint", {
              defaultValue:
                "Enter optional instructions for AI.",
            })}
          </p>

          <label className="text-sm font-medium block" style={{ color: "var(--text)" }}>
            {t("dashboard.settings.ai_content.prompt_label", {
              defaultValue: "Prompt",
            })}
          </label>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value.slice(0, 500))}
            maxLength={500}
            disabled={aiGenerating}
            rows={4}
            placeholder={t("dashboard.settings.ai_content.prompt_placeholder", {
              defaultValue: "Optional prompt...",
            })}
            className="w-full px-3 py-2 rounded-lg outline-none resize-none border focus:ring-2"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAiPromptModalOpen(false)}
              disabled={aiGenerating}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </button>

            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={aiGenerating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{
                background: "var(--primary)",
                border: "1px solid var(--primary)",
                color: "#fff",
              }}>
              {aiGenerating
                ? t("dashboard.settings.ai_content.generating", {
                  defaultValue: "Generating...",
                })
                : t("dashboard.settings.ai_content.generate", {
                  defaultValue: "Generate AI",
                })}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
