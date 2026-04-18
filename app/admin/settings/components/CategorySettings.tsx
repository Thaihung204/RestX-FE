"use client";

import { Category, categoryService } from "@/lib/services/categoryService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, message, Popconfirm, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

type ImagePosition = { x: number; y: number };

function DraggableImagePreview({
  src,
  position,
  onPositionChange,
  alt,
  onError,
  hintText,
}: {
  src: string;
  position: ImagePosition;
  onPositionChange: (next: ImagePosition) => void;
  alt: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  hintText: string;
}) {
  const dragRef = useRef({ dragging: false, x: 0, y: 0 });
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  return (
    <div
      className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        dragRef.current.dragging = true;
        dragRef.current.x = e.clientX;
        dragRef.current.y = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.dragging) return;
        const dx = e.clientX - dragRef.current.x;
        const dy = e.clientY - dragRef.current.y;
        dragRef.current.x = e.clientX;
        dragRef.current.y = e.clientY;
        onPositionChange({
          x: clamp(position.x + dx * 0.2),
          y: clamp(position.y + dy * 0.2),
        });
      }}
      onPointerUp={() => { dragRef.current.dragging = false; }}
      onPointerCancel={() => { dragRef.current.dragging = false; }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full pointer-events-none"
        style={{ objectFit: "cover", objectPosition: `${position.x}% ${position.y}%` }}
        onError={onError}
      />
      <div
        className="absolute bottom-2 right-2 rounded-md px-2 py-1 text-[10px] font-medium pointer-events-none"
        style={{ color: "#fff", background: "rgba(0,0,0,0.55)" }}>
        {hintText}
      </div>
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      message.error(
        extractApiErrorMessage(
          error,
          t("dashboard.settings.notifications.error_fetch", {
            defaultValue: "Failed to load categories",
          }),
        ),
      );
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
    setSelectedImageFile(null);
    setRemoveImage(false);
    setImagePosition({ x: 50, y: 50 });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setSelectedImageFile(null);
    setRemoveImage(false);
    setImagePosition({ x: 50, y: 50 });
  };

  const handleSave = async () => {
    if (!formData.name) {
      message.warning(t("dashboard.settings.categories.name_required", { defaultValue: "Category name is required" }));
      return;
    }
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          ...editingCategory,
          name: formData.name,
          description: formData.description || "",
          imageUrl: removeImage ? "" : (formData.imageUrl || ""),
        }, selectedImageFile);
        message.success(t("dashboard.settings.notifications.success_update", { defaultValue: "Category updated successfully" }));
      } else {
        await categoryService.createCategory({
          name: formData.name,
          description: formData.description || "",
          imageUrl: removeImage ? "" : (formData.imageUrl || ""),
        }, selectedImageFile);
        message.success(t("dashboard.settings.notifications.success_create", { defaultValue: "Category created successfully" }));
      }
      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      message.error(
        extractApiErrorMessage(
          error,
          t("dashboard.settings.notifications.error_save", {
            defaultValue: "Failed to save category",
          }),
        ),
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      message.success(t("dashboard.settings.notifications.success_delete", { defaultValue: "Category deleted successfully" }));
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      message.error(
        extractApiErrorMessage(
          error,
          t("dashboard.settings.notifications.error_delete", {
            defaultValue: "Failed to delete category",
          }),
        ),
      );
    }
  };

  const columns: ColumnsType<Category> = [
    {
      title: t("dashboard.settings.categories.image"),
      key: "image",
      width: 80,
      render: (_, cat) => (
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 relative shadow-sm border border-gray-200 dark:border-gray-700">
          <img
            src={cat.imageUrl || "/images/placeholder.jpg"}
            alt={cat.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100?text=No+Image"; }}
          />
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
    {
      title: t("dashboard.settings.categories.actions"),
      key: "actions",
      align: "right",
      width: 100,
      render: (_, cat) => (
        <div className="flex justify-end gap-2">
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleOpenModal(cat)} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" />
          <Popconfirm
            title={t("dashboard.settings.categories.confirm_delete")}
            onConfirm={() => handleDelete(cat.id)}
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
          <h3 className="text-lg font-bold text-[var(--text)]">{t("dashboard.settings.categories.title")}</h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t("dashboard.settings.categories.subtitle")}</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          style={{ background: "linear-gradient(to right, var(--primary), var(--primary-hover))", border: "none" }}>
          {t("dashboard.settings.categories.add_category")}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="admin-loyalty-table"
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.description")}</label>
                <textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none"
                  rows={3} style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.image")}</label>
                <div className="space-y-3">
                  <input type="file" id="category-image-upload" className="hidden" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { message.error(t("dashboard.settings.categories.file_size_error", { defaultValue: "File size be less than 5MB" })); return; }
                      setSelectedImageFile(file);
                      setRemoveImage(false);
                      setImagePosition({ x: 50, y: 50 });
                      e.target.value = "";
                    }} />
                  <div className="relative group">
                    <label htmlFor="category-image-upload"
                      className={`relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${((!removeImage && formData.imageUrl) || localPreviewUrl) ? "border-transparent" : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"}`}
                      style={{ background: ((!removeImage && formData.imageUrl) || localPreviewUrl) ? "black" : "var(--bg-base)" }}>
                      {((!removeImage && formData.imageUrl) || localPreviewUrl) ? (
                        <>
                          <DraggableImagePreview
                            src={localPreviewUrl || (formData.imageUrl as string)}
                            alt="Preview" position={imagePosition} onPositionChange={setImagePosition}
                            hintText={t("dashboard.settings.appearance.drag_to_adjust", { defaultValue: "Drag to adjust" })}
                            onError={(e) => { e.currentTarget.style.display = "none"; message.error(t("dashboard.settings.categories.invalid_image_url", { defaultValue: "Invalid image URL" })); }} />
                          <div className="z-10 bg-black/50 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {t("dashboard.settings.categories.change_image", { defaultValue: "Change Image" })}
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{t("dashboard.settings.categories.upload_image", { defaultValue: "" })}</p>
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
              <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.settings.buttons.cancel")}
              </button>
              <button onClick={handleSave} disabled={!formData.name?.trim()}
                className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)" }}>
                {t("dashboard.settings.buttons.save_changes")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
