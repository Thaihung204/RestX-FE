"use client";

import { DropDown } from "@/components/ui/DropDown";
import StatusToggle from "@/components/ui/StatusToggle";
import aiService from "@/lib/services/aiService";
import dishService, {
    ComboDetailItemDto,
    DishResponseDto,
} from "@/lib/services/dishService";
import type { AIContentVariant } from "@/lib/types/ai";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { App, Button } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ComboDetailFormItem {
  id?: string;
  dishId: string;
  quantity: string;
}

const MAX_AI_PROMPT_LENGTH = 500;
const MAX_COMBO_NAME_LENGTH = 255;
const MAX_COMBO_DESCRIPTION_LENGTH = 2000;
const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ComboFormPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();

  const id = String(params.id || "new");
  const isNewCombo = id === "new";

  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    isActive: true,
  });

  const [details, setDetails] = useState<ComboDetailFormItem[]>([
    { dishId: "", quantity: "1" },
  ]);

  const [dishes, setDishes] = useState<DishResponseDto[]>([]);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [isImageDropActive, setIsImageDropActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputId = "combo-image-upload-input";
  const imagePreviewUrl = imageFile ? URL.createObjectURL(imageFile) : "";
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIContentVariant[]>([]);

  const availableDishes = useMemo(
    () => dishes.filter((dish) => dish.isActive !== false),
    [dishes],
  );

  const loadDishes = async () => {
    const response = await dishService.getDishes(1, 200);
    const dishArray =
      response.dishes ||
      response.data ||
      response.items ||
      (Array.isArray(response) ? response : []);

    setDishes(Array.isArray(dishArray) ? dishArray : []);
  };

  const loadComboById = async (comboId: string) => {
    const combo = await dishService.getComboById(comboId);

    setFormData({
      name: combo.name || "",
      description: combo.description || "",
      price: combo.price ? String(combo.price) : "",
      isActive: combo.isActive,
    });

    setExistingImageUrl(combo.imageUrl || "");
    setAiSuggestions([]);

    if (combo.details && combo.details.length > 0) {
      setDetails(
        combo.details.map((detail) => ({
          id: detail.id,
          dishId: detail.dishId,
          quantity: String(detail.quantity || 1),
        })),
      );
      return;
    }

    setDetails([{ dishId: "", quantity: "1" }]);
  };

  useEffect(() => {
    const initialize = async () => {
      const defaultLoadError = t("dashboard.menu.combo.errors.load_failed", {
        defaultValue: "Failed to load combo data",
      });

      try {
        setLoadingInitialData(true);
        setError(null);

        if (!isNewCombo && !GUID_PATTERN.test(id)) {
          setError(
            t("dashboard.menu.combo.errors.invalid_combo_id", {
              defaultValue: "Invalid combo ID",
            }),
          );
          return;
        }

        await loadDishes();

        if (!isNewCombo) {
          await loadComboById(id);
        }
      } catch (err: unknown) {
        const loadErrorMessage = extractApiErrorMessage(err, defaultLoadError);

        setError(loadErrorMessage);

        const status = (err as { response?: { status?: unknown } })?.response
          ?.status;

        // When ID no longer exists in current tenant, bounce back to list page.
        if (
          status === 400 &&
          /combo not found|khong tim thay combo|không tìm thấy combo/i.test(
            loadErrorMessage,
          )
        ) {
          message.error(
            t("dashboard.menu.combo.errors.combo_not_found", {
              defaultValue:
                "Combo not found in current tenant. Please refresh combo list.",
            }),
          );
          router.replace("/admin/menu/combo");
          return;
        }

        message.error(loadErrorMessage);
      } finally {
        setLoadingInitialData(false);
      }
    };

    initialize();
    // Keep initialization stable for current route id to avoid duplicated fetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNewCombo]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleDetailChange = (
    index: number,
    field: "dishId" | "quantity",
    value: string,
  ) => {
    setDetails((prev) =>
      prev.map((detail, rowIndex) =>
        rowIndex === index ? { ...detail, [field]: value } : detail,
      ),
    );
  };

  const handleAddDetail = () => {
    setDetails((prev) => [...prev, { dishId: "", quantity: "1" }]);
    message.success(
      t("dashboard.menu.combo.toasts.add_dish_row_success", {
        defaultValue: "Dish row added",
      }),
    );
  };

  const handleRemoveDetail = (index: number) => {
    if (details.length <= 1) {
      setDetails([{ dishId: "", quantity: "1" }]);
      message.warning(
        t("dashboard.menu.combo.toasts.keep_one_dish_row", {
          defaultValue: "At least one dish row is required",
        }),
      );
      return;
    }

    setDetails((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    message.success(
      t("dashboard.menu.combo.toasts.remove_dish_row_success", {
        defaultValue: "Dish row removed",
      }),
    );
  };


  const setSelectedImage = (file?: File) => {
    if (!file) {
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      message.error(
        t("dashboard.menu.combo.errors.image_invalid_type", {
          defaultValue: "Only image files are supported",
        }),
      );
      return;
    }
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      message.error(
        t("dashboard.menu.combo.errors.image_too_large", {
          defaultValue: "Image must be less than 5MB",
        }),
      );
      return;
    }
    setImageFile(file);
    setError(null);
    message.success(
      t("dashboard.menu.combo.toasts.image_selected_success", {
        defaultValue: "Image selected successfully",
      }),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedImage(e.target.files?.[0]);
  };

  const handleImageDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsImageDropActive(true);
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleImageDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsImageDropActive(false);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsImageDropActive(false);
    setSelectedImage(e.dataTransfer.files?.[0]);
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const resetSelectedImage = () => {
    if (!imageFile) {
      return;
    }

    setImageFile(undefined);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    message.info(
      t("dashboard.menu.combo.toasts.image_cleared", {
        defaultValue: "Image selection cleared",
      }),
    );
  };

  const handleGenerateDescription = async () => {
    const normalizedComboName = formData.name.trim();
    if (!normalizedComboName) {
      message.warning(
        t("dashboard.menu.ai_content.name_required", {
          defaultValue: "Please enter combo name before generating AI content.",
        }),
      );
      return;
    }

    const dishNameMap = new Map(
      dishes.map((dish) => [dish.id, dish.name?.trim() || ""]),
    );
    const comboDishes = details
      .map((detail) => {
        const normalizedDishId = detail.dishId.trim();
        const resolvedDishName = dishNameMap.get(normalizedDishId) || normalizedDishId;
        const quantity = Math.floor(Number(detail.quantity || "0"));

        if (!resolvedDishName || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }

        return `${quantity} ${resolvedDishName}`;
      })
      .filter((item): item is string => Boolean(item));

    if (comboDishes.length === 0) {
      message.warning(
        t("dashboard.menu.combo.errors.details_required", {
          defaultValue: "Please select at least one valid dish before generating AI content.",
        }),
      );
      return;
    }

    try {
      setAiGenerating(true);
      setAiSuggestions([]);

      const response = await aiService.generateContent({
        comboName: normalizedComboName,
        comboDishes,
      });

      const variants = (response?.variants || []).filter(
        (item) => typeof item?.content === "string" && item.content.trim().length > 0,
      );

      if (variants.length === 0) {
        message.warning(
          t("dashboard.menu.combo.ai_content.empty_result", {
            defaultValue: "AI did not return any content. Please try another prompt.",
          }),
        );
        return;
      }

      setAiSuggestions(variants);
      message.success(
        t("dashboard.menu.combo.ai_content.generate_success", {
          defaultValue: "AI content generated. Choose one variant below.",
        }),
      );
    } catch {
      message.error(
        t("dashboard.menu.combo.ai_content.generate_failed", {
          defaultValue: "Failed to generate content with AI.",
        }),
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAIVariant = (variant: AIContentVariant) => {
    setFormData((prev) => ({ ...prev, description: variant.content || prev.description }));
    message.success(
      t("dashboard.menu.combo.ai_content.apply_success", {
        defaultValue: "Description updated from AI variant.",
      }),
    );
  };

  const validatePayload = (): ComboDetailItemDto[] | null => {
    // Name required, max length aligned with backend model
    const name = formData.name.trim();
    if (!name) {
      setError(
        t("dashboard.menu.combo.errors.name_required", {
          defaultValue: "Combo name is required",
        }),
      );
      return null;
    }
    if (name.length > MAX_COMBO_NAME_LENGTH) {
      setError(
        t("dashboard.menu.combo.errors.name_too_long", {
          defaultValue: "Combo name must be at most 255 characters",
        }),
      );
      return null;
    }

    // Description max length aligned with backend model
    if (
      formData.description &&
      formData.description.trim().length > MAX_COMBO_DESCRIPTION_LENGTH
    ) {
      setError(
        t("dashboard.menu.combo.errors.description_too_long", {
          defaultValue: "Description must be at most 2000 characters",
        }),
      );
      return null;
    }

    // Price required, > 0, max 99999999
    const price = Number(formData.price);
    if (Number.isNaN(price) || price <= 0) {
      setError(
        t("dashboard.menu.combo.errors.price_invalid", {
          defaultValue: "Price must be greater than zero",
        }),
      );
      return null;
    }
    if (price > 99999999) {
      setError(
        t("dashboard.menu.combo.errors.price_too_high", {
          defaultValue: "Price must be less than 100,000,000",
        }),
      );
      return null;
    }

    // Image: if selected, must be image/* and <= 5MB (already checked in setSelectedImage)

    // At least 1 dish
    const normalizedDetails = details
      .map((detail) => ({
        id: detail.id,
        dishId: detail.dishId,
        quantity: Math.floor(Number(detail.quantity || "0")),
      }))
      .filter((detail) => !!detail.dishId);

    if (normalizedDetails.length === 0) {
      setError(
        t("dashboard.menu.combo.errors.details_required", {
          defaultValue: "Please select at least one dish",
        }),
      );
      return null;
    }

    // Each quantity must be a positive integer
    if (
      normalizedDetails.some(
        (detail) => !Number.isFinite(detail.quantity) || detail.quantity <= 0,
      )
    ) {
      setError(
        t("dashboard.menu.combo.errors.quantity_invalid", {
          defaultValue: "Dish quantity must be greater than zero",
        }),
      );
      return null;
    }

    // Merge duplicate dishes instead of blocking save.
    const mergedDetailsByDish = new Map<
      string,
      { id?: string; dishId: string; quantity: number }
    >();
    normalizedDetails.forEach((detail) => {
      const existing = mergedDetailsByDish.get(detail.dishId);
      if (existing) {
        existing.quantity += detail.quantity;
        return;
      }

      mergedDetailsByDish.set(detail.dishId, {
        id: detail.id,
        dishId: detail.dishId,
        quantity: detail.quantity,
      });
    });

    setError(null);

    return Array.from(mergedDetailsByDish.values());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedDetails = validatePayload();
    if (!normalizedDetails) {
      message.error(
        t("dashboard.menu.combo.toasts.validation_error", {
          defaultValue: "Please review combo information",
        }),
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim().slice(0, MAX_COMBO_DESCRIPTION_LENGTH),
        price: Number(formData.price),
        isActive: formData.isActive,
        details: normalizedDetails,
        file: imageFile,
      };

      if (isNewCombo) {
        await dishService.createCombo(payload);
        message.success(
          t("dashboard.menu.combo.toasts.create_success", {
            defaultValue: "Combo created successfully",
          }),
        );
      } else {
        await dishService.updateCombo(id, payload);
        message.success(
          t("dashboard.menu.combo.toasts.update_success", {
            defaultValue: "Combo updated successfully",
          }),
        );
      }

      router.push("/admin/menu/combo");
    } catch (err: unknown) {
      const defaultSaveError = t("dashboard.menu.combo.toasts.save_error", {
        defaultValue: "Unable to save combo",
      });

      const badRequestSaveError = t(
        "dashboard.menu.combo.toasts.save_error_bad_request",
        {
          defaultValue:
            "Unable to save combo. Please review combo dishes and try again.",
        },
      );

      const serverSaveError = t("dashboard.menu.combo.toasts.save_error_server", {
        defaultValue:
          "The system is busy and cannot save the combo right now. Please try again later.",
      });

      const extractedError = extractApiErrorMessage(
        err,
        defaultSaveError,
      );

      const status = (err as { response?: { status?: unknown } })?.response?.status;

      let errorMsg = extractedError;
      if (status === 400 && extractedError === defaultSaveError) {
        errorMsg = badRequestSaveError;
      } else if (
        typeof status === "number" &&
        status >= 500 &&
        extractedError === defaultSaveError
      ) {
        errorMsg = serverSaveError;
      }

      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            ← {t("admin.order_detail.actions.back")}
          </button>
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              {isNewCombo
                ? t("dashboard.menu.combo.form.create_title", { defaultValue: "Create Combo" })
                : t("dashboard.menu.combo.form.edit_title", { defaultValue: "Edit Combo" })}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.form.subtitle", { defaultValue: "Configure combo information and included dishes" })}
            </p>
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#ef4444",
            }}>
            {error}
          </div>
        )}

        {loadingInitialData ? (
          <div className="rounded-xl p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.loading", { defaultValue: "Loading combos..." })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                {t("dashboard.menu.combo.form.basic_info", {
                  defaultValue: "Basic Information",
                })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                    {t("dashboard.menu.combo.fields.name", { defaultValue: "Combo Name" })}
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                    {t("dashboard.menu.combo.fields.price", { defaultValue: "Price" })}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                  {t("dashboard.menu.combo.fields.description", {
                    defaultValue: "Description",
                  })}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) =>
                      setAiPrompt(e.target.value.slice(0, MAX_AI_PROMPT_LENGTH))
                    }
                    maxLength={MAX_AI_PROMPT_LENGTH}
                    disabled={aiGenerating}
                    className="md:col-span-2 w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiGenerating}
                    className="px-4 py-2.5 rounded-lg font-medium transition-opacity disabled:opacity-60"
                    style={{
                      background: "var(--primary)",
                      border: "1px solid var(--primary)",
                      color: "#fff",
                    }}>
                    {aiGenerating
                      ? t("dashboard.menu.combo.ai_content.generating", {
                          defaultValue: "Generating...",
                        })
                      : t("dashboard.menu.combo.ai_content.generate", {
                          defaultValue: "Generate AI",
                        })}
                  </button>
                </div>

                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg outline-none resize-none"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />

                {aiSuggestions.length > 0 && (
                  <div
                    className="rounded-xl p-3 space-y-2 mt-3"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {t("dashboard.menu.combo.ai_content.variants_title", {
                        defaultValue: "AI variants (click one to apply)",
                      })}
                    </p>

                    <div className="space-y-2">
                      {aiSuggestions.map((variant, index) => (
                        <button
                          key={`combo-ai-variant-${index}`}
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
                                t("dashboard.menu.combo.ai_content.variant_label", {
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
                                {t("dashboard.menu.combo.ai_content.score_label", {
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

              <div className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    {t("dashboard.menu.combo.fields.active", { defaultValue: "Active" })}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.menu.combo.fields.active_hint", {
                      defaultValue: "When active, this combo is available for ordering",
                    })}
                  </p>
                </div>
                <StatusToggle
                  checked={formData.isActive}
                  onChange={() =>
                    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  ariaLabel={t("dashboard.menu.combo.fields.active", {
                    defaultValue: "Active",
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                  {t("dashboard.menu.combo.fields.image", { defaultValue: "Image" })}
                </label>

                {/* Hidden file input */}
                <input
                  id={imageInputId}
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="space-y-3">
                  {/* Preview — shown when image selected or existing */}
                  {(imageFile || existingImageUrl) ? (
                    <div
                      className="relative group rounded-xl overflow-hidden border-2 transition-all"
                      style={{
                        borderColor: "var(--primary)",
                        aspectRatio: "4/3",
                        background: "var(--surface)",
                        boxShadow: "0 0 0 3px var(--primary)22",
                        maxWidth: 280,
                      }}>
                      <img
                        src={imagePreviewUrl || existingImageUrl}
                        alt={t("dashboard.menu.combo.fields.image", { defaultValue: "Image" })}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay with remove button */}
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(undefined);
                            if (imageInputRef.current) imageInputRef.current.value = "";
                          }}
                          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-110 active:scale-95"
                          title={t("dashboard.menu.images.remove", { defaultValue: "Remove image" })}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {/* Change button */}
                      <button
                        type="button"
                        onClick={openImagePicker}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
                        {t("dashboard.menu.combo.actions.change_image", { defaultValue: "Change" })}
                      </button>
                    </div>
                  ) : (
                    /* Empty state upload button */
                    <button
                      type="button"
                      onClick={openImagePicker}
                      onDragEnter={(e) => { e.preventDefault(); setIsImageDropActive(true); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragLeave={(e) => { e.preventDefault(); setIsImageDropActive(false); }}
                      onDrop={(e) => { e.preventDefault(); setIsImageDropActive(false); setSelectedImage(e.dataTransfer.files?.[0]); }}
                      className="w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 transition-all group"
                      style={{
                        borderColor: isImageDropActive ? "var(--primary)" : "var(--border)",
                        background: isImageDropActive ? "var(--primary-soft)" : "var(--surface)",
                      }}>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--primary)]/10"
                        style={{ background: "var(--bg-base)" }}>
                        <svg
                          className="w-6 h-6 transition-colors group-hover:text-[var(--primary)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{ color: "var(--text-muted)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium transition-colors group-hover:text-[var(--primary)]" style={{ color: "var(--text)" }}>
                          {t("dashboard.menu.images.click_to_upload", { defaultValue: "Click to upload image" })}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.menu.images.format_hint", { defaultValue: "PNG, JPG, WEBP up to 5MB" })}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {t("dashboard.menu.combo.form.details", {
                    defaultValue: "Combo Dishes",
                  })}
                </h3>
                <Button type="dashed" onClick={handleAddDetail}>
                  {t("dashboard.menu.combo.actions.add_row", {
                    defaultValue: "Add Dish",
                  })}
                </Button>
              </div>

              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div
                    key={`${detail.id || "new"}-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[1fr_120px_80px] gap-3">
                    <DropDown
                      value={detail.dishId}
                      onChange={(e) =>
                        handleDetailChange(index, "dishId", e.target.value)
                      }>
                      <option value="">
                      </option>
                      {availableDishes.map((dish) => (
                        <option key={dish.id} value={dish.id}>
                          {dish.name} ({(dish.price || 0).toLocaleString("vi-VN")} VND)
                        </option>
                      ))}
                    </DropDown>

                    <input
                      type="number"
                      min="1"
                      value={detail.quantity || ""}
                      onChange={(e) =>
                        handleDetailChange(index, "quantity", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-lg outline-none"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                    />

                    <Button danger onClick={() => handleRemoveDetail(index)}>
                      {t("common.actions.remove", { defaultValue: "Remove" })}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => router.push("/admin/menu/combo")}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                className="flex-1"
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
                {isNewCombo
                  ? t("dashboard.menu.combo.actions.create", {
                      defaultValue: "Create Combo",
                    })
                  : t("dashboard.menu.combo.actions.update", {
                      defaultValue: "Update Combo",
                    })}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
