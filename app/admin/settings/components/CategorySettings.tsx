"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";
import aiService from "@/lib/services/aiService";
import categoryService, { Category } from "@/lib/services/categoryService";
import type { AIContentVariant } from "@/lib/types/ai";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, MenuOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Modal, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

type ImagePosition = { x: number; y: number };

function DraggableImagePreview({
  src, position, onPositionChange, alt, onError, hintText,
}: {
  src: string; position: ImagePosition; onPositionChange: (next: ImagePosition) => void;
  alt: string; onError?: React.ReactEventHandler<HTMLImageElement>; hintText: string;
}) {
  const dragRef = useRef({ dragging: false, x: 0, y: 0 });
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return (
    <div
      className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => { dragRef.current = { dragging: true, x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => {
        if (!dragRef.current.dragging) return;
        const dx = e.clientX - dragRef.current.x; const dy = e.clientY - dragRef.current.y;
        dragRef.current.x = e.clientX; dragRef.current.y = e.clientY;
        onPositionChange({ x: clamp(position.x + dx * 0.2), y: clamp(position.y + dy * 0.2) });
      }}
      onPointerUp={() => { dragRef.current.dragging = false; }}
      onPointerCancel={() => { dragRef.current.dragging = false; }}>
      <img src={src} alt={alt} className="w-full h-full pointer-events-none"
        style={{ objectFit: "cover", objectPosition: `${position.x}% ${position.y}%` }} onError={onError} />
      <div className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-[10px] font-medium pointer-events-none"
        style={{ color: "#fff", background: "rgba(0,0,0,0.55)" }}>{hintText}</div>
    </div>
  );
}

export default function CategorySettings() {
  const { t } = useTranslation("common");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 50, y: 50 });
  const [formData, setFormData] = useState<Partial<Category>>({ name: "", imageUrl: "", description: "" });
  const { message } = App.useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  // AI Generator specific state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptModalOpen, setAiPromptModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIContentVariant[]>([]);

  const handleGenerateDescription = async () => {
    const normalizedName = formData.name?.trim() || "";
    const normalizedPrompt = aiPrompt.trim();

    try {
      setAiGenerating(true);
      setAiSuggestions([]);

      const payload: {
        dishName: string;
        customContext?: string;
      } = {
        dishName: normalizedName, // Fake it for backend compatibility
      };

      if (normalizedPrompt) {
        payload.customContext = normalizedPrompt;
      }

      const response = await aiService.generateContent(payload);

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

  // Inline sort mode
  const [sortMode, setSortMode] = useState(false);
  const [sortedCategories, setSortedCategories] = useState<Category[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      message.error(extractApiErrorMessage(error, t("dashboard.settings.notifications.error_fetch")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [t]);

  useEffect(() => {
    if (!selectedImageFile) {
      if (localPreviewUrl) { URL.revokeObjectURL(localPreviewUrl); setLocalPreviewUrl(null); }
      return;
    }
    const url = URL.createObjectURL(selectedImageFile);
    setLocalPreviewUrl(url);
    return () => { URL.revokeObjectURL(url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageFile]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, imageUrl: category.imageUrl || "", description: category.description || "" });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", imageUrl: "", description: "" });
    }
    setSelectedImageFile(null); setRemoveImage(false); setImagePosition({ x: 50, y: 50 }); setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); setEditingCategory(null); setSelectedImageFile(null);
    setRemoveImage(false); setImagePosition({ x: 50, y: 50 });
  };

  const handleSave = async () => {
    if (!formData.name) { message.warning(t("dashboard.settings.categories.name_required")); return; }
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          ...editingCategory, name: formData.name,
          description: formData.description || "",
          imageUrl: removeImage ? "" : (formData.imageUrl || ""),
        }, selectedImageFile);
        message.success(t("dashboard.settings.notifications.success_update"));
      } else {
        await categoryService.createCategory({
          name: formData.name, description: formData.description || "",
          imageUrl: removeImage ? "" : (formData.imageUrl || ""),
        }, selectedImageFile);
        message.success(t("dashboard.settings.notifications.success_create"));
      }
      await fetchCategories(); handleCloseModal();
    } catch (error) {
      message.error(extractApiErrorMessage(error, t("dashboard.settings.notifications.error_save")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      await categoryService.deleteCategory(id);
      message.success(t("dashboard.settings.notifications.success_delete"));
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      const apiMsg = extractApiErrorMessage(error, "");
      const errorMsg = /cannot delete category because it is being used by one or more dishes/i.test(apiMsg)
        ? t("dashboard.settings.notifications.error_delete_category_in_use")
        : apiMsg || t("dashboard.settings.notifications.error_delete");
      message.error(errorMsg);
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const enterSortMode = () => {
    const sorted = [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    setSortedCategories(sorted);
    setSortMode(true);
  };

  const cancelSortMode = () => { setSortMode(false); setDragOverIndex(null); };
  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null; dragOverItem.current = null; setDragOverIndex(null); return;
    }
    const updated = [...sortedCategories];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null; dragOverItem.current = null; setDragOverIndex(null);
    setSortedCategories(updated);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      const payload = sortedCategories.map((cat, index) => ({ ...cat, displayOrder: index + 1 }));
      await categoryService.updateDisplayOrder(payload);
      message.success(t("dashboard.settings.categories.order_saved"));
      await fetchCategories();
      setSortMode(false);
    } catch (error) {
      message.error(extractApiErrorMessage(error, t("dashboard.settings.categories.order_error")));
    } finally {
      setSavingOrder(false);
    }
  };

  const tableData = sortMode
    ? sortedCategories
    : [...categories].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const columns: ColumnsType<Category> = [
    {
      title: t("dashboard.settings.categories.display_order"),
      key: "displayOrder",
      width: 110,
      render: (_, cat, index) => sortMode ? (
        <div className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
          <MenuOutlined className="text-base opacity-50" />
          <span className="text-sm font-semibold">{index + 1}</span>
        </div>
      ) : (
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{cat.displayOrder ?? index + 1}</span>
      ),
    },
    {
      title: t("dashboard.settings.categories.image"),
      key: "image",
      width: 80,
      render: (_, cat) => (
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 relative shadow-sm border border-gray-200 dark:border-gray-700">
          <img src={cat.imageUrl || "/images/placeholder.jpg"} alt={cat.name} className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100?text=No+Image"; }} />
        </div>
      ),
    },
    {
      title: t("dashboard.settings.categories.name"),
      dataIndex: "name",
      key: "name",
      render: (text) => <span className="font-semibold text-base" style={{ color: "var(--text)" }}>{text}</span>,
    },
    {
      title: t("dashboard.settings.categories.description"),
      dataIndex: "description",
      key: "description",
      render: (text) => <span className="text-sm line-clamp-2" style={{ color: "var(--text-muted)" }}>{text}</span>,
    },
    ...(!sortMode ? [{
      title: t("dashboard.settings.categories.actions"),
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_: any, cat: Category) => (
        <div className="flex justify-end gap-2">
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleOpenModal(cat)} disabled={!!deletingId || isSaving} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" />
          <Button type="text" icon={<DeleteOutlined className="text-red-500" />} loading={deletingId === cat.id} disabled={!!deletingId || isSaving} onClick={() => setPendingDelete(cat)} className="hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" />
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">{t("dashboard.settings.categories.title")}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("dashboard.settings.categories.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {sortMode ? (
            <>
              <Button icon={<CloseOutlined />} onClick={cancelSortMode} disabled={savingOrder}>
                {t("dashboard.settings.buttons.cancel")}
              </Button>
              <Button type="primary" icon={<CheckOutlined />} loading={savingOrder} onClick={handleSaveOrder}
                style={{ background: "var(--primary)", border: "none" }}>
                {t("dashboard.settings.buttons.save_changes")}
              </Button>
            </>
          ) : (
            <>
              <Button icon={<MenuOutlined />} onClick={enterSortMode} disabled={loading}
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                {t("dashboard.settings.categories.display_order")}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} disabled={loading}
                style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
                {t("dashboard.settings.categories.add_category")}
              </Button>
            </>
          )}
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={loading}
        pagination={false}
        className="admin-loyalty-table"
        onRow={sortMode ? (_, index) => ({
          draggable: true,
          style: {
            cursor: "grab",
            background: dragOverIndex === index ? "rgba(var(--primary-rgb,99,102,241),0.06)" : undefined,
            outline: dragOverIndex === index ? "2px solid var(--primary)" : undefined,
            transition: "background 0.15s, outline 0.15s",
          },
          onDragStart: () => handleDragStart(index!),
          onDragEnter: () => handleDragEnter(index!),
          onDragEnd: handleDragEnd,
          onDragOver: (e: React.DragEvent) => e.preventDefault(),
        }) : undefined}
      />

      <ConfirmModal
        open={!!pendingDelete}
        title={t("dashboard.settings.categories.confirm_delete")}
        description={t("dashboard.settings.categories.confirm_delete_desc", { name: pendingDelete?.name })}
        confirmText={t("common.actions.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        loading={!!deletingId}
        onConfirm={() => pendingDelete && handleDelete(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />

      {isModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={handleCloseModal}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                {editingCategory ? t("dashboard.settings.categories.edit_category") : t("dashboard.settings.categories.add_category")}
              </h3>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: "var(--text-muted)" }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.name")}</label>
                <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                  style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.description")}</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!aiPrompt) {
                        setAiPrompt(`Hãy tạo mô tả tối đa 50 từ cho thể loại món ăn ${formData.name || ""}`.trim());
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
                <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.image")}</label>
                <div className="space-y-3">
                  <input type="file" id="category-image-upload" className="hidden" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { message.error(t("dashboard.settings.categories.file_size_error")); return; }
                      setSelectedImageFile(file); setRemoveImage(false); setImagePosition({ x: 50, y: 50 }); e.target.value = "";
                    }} />
                  <div className="relative group">
                    <label htmlFor="category-image-upload"
                      className={`relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${((!removeImage && formData.imageUrl) || localPreviewUrl) ? "border-transparent" : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"}`}
                      style={{ background: ((!removeImage && formData.imageUrl) || localPreviewUrl) ? "black" : "var(--bg-base)" }}>
                      {((!removeImage && formData.imageUrl) || localPreviewUrl) ? (
                        <>
                          <DraggableImagePreview
                            src={localPreviewUrl || (formData.imageUrl as string)} alt="Preview"
                            position={imagePosition} onPositionChange={setImagePosition}
                            hintText={t("dashboard.settings.appearance.drag_to_adjust")}
                            onError={(e) => { e.currentTarget.style.display = "none"; message.error(t("dashboard.settings.categories.invalid_image_url")); }} />
                          <div className="z-10 bg-black/50 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {t("dashboard.settings.categories.change_image")}
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.upload_image")}</p>
                        </div>
                      )}
                    </label>
                    {((!removeImage && formData.imageUrl) || localPreviewUrl) && (
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedImageFile(null); setRemoveImage(true); }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-20" title="Remove Image">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button onClick={handleCloseModal} disabled={isSaving} className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.buttons.cancel")}
              </button>
              <button onClick={handleSave} disabled={!formData.name?.trim() || isSaving}
                className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)" }}>
                {t("dashboard.settings.buttons.save_changes")}
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
