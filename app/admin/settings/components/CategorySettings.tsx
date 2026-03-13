"use client";

import { Category, categoryService } from "@/lib/services/categoryService";
import { message, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export default function CategorySettings() {
  const { t } = useTranslation("common");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "",
    imageUrl: "",
    description: "",
  });

  // Load categories from API on mount
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      message.error(
        t("dashboard.settings.notifications.error_fetch", {
          defaultValue: "Failed to load categories",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [t]);

  useEffect(() => {
    if (!selectedImageFile) {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
        setLocalPreviewUrl(null);
      }
      return;
    }

    const url = URL.createObjectURL(selectedImageFile);
    setLocalPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageFile]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        imageUrl: category.imageUrl || "",
        description: category.description || "",
      });
      setSelectedImageFile(null);
      setRemoveImage(false);
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        imageUrl: "",
        description: "",
      });
      setSelectedImageFile(null);
      setRemoveImage(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setSelectedImageFile(null);
    setRemoveImage(false);
  };

  const handleSave = async () => {
    if (!formData.name) {
      message.warning(
        t("dashboard.settings.categories.name_required", {
          defaultValue: "Category name is required",
        }),
      );
      return;
    }

    try {
      if (editingCategory) {
        // Edit
        await categoryService.updateCategory(editingCategory.id, {
          ...editingCategory,
          name: formData.name,
          description: formData.description || "",
          imageUrl: removeImage ? "" : (formData.imageUrl || ""),
        }, selectedImageFile);
        message.success(
          t("dashboard.settings.notifications.success_update", {
            defaultValue: "Category updated successfully",
          }),
        );
      } else {
        // Add
        await categoryService.createCategory({
          name: formData.name,
          description: formData.description || "",
          imageUrl: removeImage ? "" : (formData.imageUrl || ""),
        }, selectedImageFile);
        message.success(
          t("dashboard.settings.notifications.success_create", {
            defaultValue: "Category created successfully",
          }),
        );
      }
      await fetchCategories();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save category:", error);
      message.error(
        t("dashboard.settings.notifications.error_save", {
          defaultValue: "Failed to save category",
        }),
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      message.success(
        t("dashboard.settings.notifications.success_delete", {
          defaultValue: "Category deleted successfully",
        }),
      );
      // Optimistic update or refetch
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
      message.error(
        t("dashboard.settings.notifications.error_delete", {
          defaultValue: "Failed to delete category",
        }),
      );
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {t("dashboard.settings.categories.title")}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.settings.categories.subtitle")}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          }}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t("dashboard.settings.categories.add_category")}
        </button>
      </div>

      {/* Table Layout for Categories */}
      <div
        className="rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: "var(--bg-base)" }}>
              <tr>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.categories.image")}
                </th>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.categories.name")}
                </th>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.categories.description")}
                </th>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase text-right"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.categories.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 relative shadow-sm group-hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cat.imageUrl || "/images/placeholder.jpg"}
                        alt={cat.name}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/100x100?text=No+Image";
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <div
                      className="font-semibold text-base"
                      style={{ color: "var(--text)" }}>
                      {cat.name}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className="text-sm line-clamp-2"
                      style={{ color: "var(--text-muted)" }}>
                      {cat.description}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500 hover:text-blue-600"
                        title={t(
                          "dashboard.settings.categories.edit_category",
                        )}>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <Popconfirm
                        title={t(
                          "dashboard.settings.categories.confirm_delete",
                        )}
                        onConfirm={() => handleDelete(cat.id)}
                        okText={t("common.actions.yes", { defaultValue: "Yes" })}
                        cancelText={t("common.actions.no", { defaultValue: "No" })}
                        okButtonProps={{ danger: true }}>
                        <button
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 hover:text-red-600"
                          title={t(
                            "dashboard.settings.categories.delete_category",
                          )}>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-zinc-800">
                        <svg
                          className="w-8 h-8 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p
                        className="text-lg font-medium"
                        style={{ color: "var(--text)" }}>
                        {t("dashboard.settings.categories.no_categories")}
                      </p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-4 py-2 text-sm text-[var(--primary)] font-medium hover:bg-[var(--primary)]/10 rounded-lg transition-colors">
                        {t("dashboard.settings.categories.add_category")}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={handleCloseModal}>
            <div
              className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div
                className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10"
                style={{ borderColor: "var(--border)" }}>
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--text)" }}>
                  {editingCategory
                    ? t("dashboard.settings.categories.edit_category")
                    : t("dashboard.settings.categories.add_category")}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-muted)" }}>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.settings.categories.name")}{" "}
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                    style={{
                      background: "var(--bg-base)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder={t(
                      "dashboard.settings.categories.name_placeholder",
                    )}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.settings.categories.description")}
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none"
                    rows={3}
                    style={{
                      background: "var(--bg-base)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder={t(
                      "dashboard.settings.categories.description_placeholder",
                    )}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.settings.categories.image")}
                  </label>

                  <div className="space-y-3">
                    <input
                      type="file"
                      id="category-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 5 * 1024 * 1024) {
                          message.error(
                            t("dashboard.settings.categories.file_size_error", {
                              defaultValue: "File size be less than 5MB",
                            }),
                          );
                          return;
                        }

                        // Upload will be performed on Save via /api/categories (Cloudinary on BE).
                        setSelectedImageFile(file);
                        setRemoveImage(false);

                        // Reset file input value to allow re-selecting same file if needed
                        e.target.value = "";
                      }}
                    />

                    <div className="relative group">
                      {/* Clickable area for upload */}
                      <label
                        htmlFor="category-image-upload"
                        className={`
                                                relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                                                ${((!removeImage && formData.imageUrl) || localPreviewUrl) ? "border-transparent" : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"}
                                            `}
                        style={{
                          background: ((!removeImage && formData.imageUrl) || localPreviewUrl)
                            ? "black"
                            : "var(--bg-base)",
                        }}>
                        {((!removeImage && formData.imageUrl) || localPreviewUrl) ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={localPreviewUrl || (formData.imageUrl as string)}
                              alt="Preview"
                              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                message.error("Invalid image URL");
                              }}
                            />
                            <div className="z-10 bg-black/50 text-white px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-300">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                />
                              </svg>
                              {t("dashboard.settings.categories.change_image", {
                                defaultValue: "Change Image",
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6">
                            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <p
                              className="font-medium text-sm"
                              style={{ color: "var(--text)" }}>
                              {t("dashboard.settings.categories.upload_image", {
                                defaultValue: "Click to upload image",
                              })}
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: "var(--text-muted)" }}>
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        )}
                      </label>

                      {((!removeImage && formData.imageUrl) || localPreviewUrl) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedImageFile(null);
                            setRemoveImage(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-20"
                          title="Remove Image">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3"
                style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.buttons.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name?.trim()}
                  className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
