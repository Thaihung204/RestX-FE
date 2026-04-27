"use client";

import MultiImageUpload from "@/components/MultiImageUpload";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { DropDown } from "@/components/ui/DropDown";
import StatusToggle from "@/components/ui/StatusToggle";
import aiService from "@/lib/services/aiService";
import categoryService, { Category } from "@/lib/services/categoryService";
import dishService from "@/lib/services/dishService";
import type { AIContentVariant } from "@/lib/types/ai";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { message, Modal } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ImageItem {
  uid: string;
  url?: string;
  file?: File;
  preview?: string;
  isMain: boolean;
}

const MAX_AI_PROMPT_LENGTH = 500;
const MAX_DISH_NAME_LENGTH = 255;
const MAX_DISH_DESCRIPTION_LENGTH = 2000;

export default function MenuItemFormPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNewItem = id === "new";

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    description: "",
    unit: "portion",
    quantity: "",
    isActive: true,
    isVegetarian: false,
    isSpicy: false,
    isBestSeller: false,
    autoDisableByStock: false,
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptModalOpen, setAiPromptModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIContentVariant[]>([]);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isNewItem) {
      fetchMenuItem();
    }
  }, [id, isNewItem]);

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.getCategories();
      setCategories(data.filter((cat) => cat.isActive));
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchMenuItem = async () => {
    try {
      setLoading(true);
      const item = await dishService.getDishById(id);

      // Handle both categoryId (GUID) and categoryName cases
      let categoryId = "";
      if (item.categoryId) {
        categoryId = item.categoryId;
      } else if (item.categoryName) {
        const category = categories.find(
          (cat: Category) => cat.name === item.categoryName,
        );
        categoryId = category?.id || "";
      }

      setFormData({
        name: item.name || "",
        categoryId: categoryId,
        price: item.price ? formatPrice(item.price.toString()) : "",
        description: item.description || "",
        unit: item.unit || "portion",
        quantity: item.quantity?.toString() || "0",
        isActive: item.isActive !== undefined ? item.isActive : true,
        isVegetarian:
          item.isVegetarian !== undefined ? item.isVegetarian : false,
        isSpicy: item.isSpicy !== undefined ? item.isSpicy : false,
        isBestSeller:
          item.isBestSeller !== undefined ? item.isBestSeller : false,
        autoDisableByStock:
          item.autoDisableByStock !== undefined
            ? item.autoDisableByStock
            : false,
      });

      if (item.images && item.images.length > 0) {
        const loadedImages: ImageItem[] = item.images.map((img) => ({
          uid: img.id,
          url: img.imageUrl,
          isMain: img.imageType === 0,
        }));
        setImages(loadedImages);
      } else if (item.image || item.mainImageUrl) {
        const imageUrl = item.image || item.mainImageUrl || "";
        setImages([
          {
            uid: "legacy-image",
            url: imageUrl,
            isMain: true,
          },
        ]);
      }

      setAiSuggestions([]);
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.toasts.detail_error_message"),
      );

      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    const normalizedDishName = formData.name.trim();
    const normalizedPrompt = aiPrompt.trim();

    if (!normalizedDishName) {
      message.warning(
        t("dashboard.menu.ai_content.name_required", {
          defaultValue: "Please enter dish name before generating AI content.",
        }),
      );
      return;
    }

    try {
      setAiGenerating(true);
      setAiSuggestions([]);

      const payload: {
        dishName: string;
        customContext?: string;
      } = {
        dishName: normalizedDishName,
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
          t("dashboard.menu.ai_content.empty_result", {
            defaultValue: "AI did not return any content. Please try another prompt.",
          }),
        );
        return;
      }

      setAiSuggestions(variants);
      setAiPromptModalOpen(false);
      message.success(
        t("dashboard.menu.ai_content.generate_success", {
          defaultValue: "AI content generated. Choose one variant below.",
        }),
      );
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ai_content.generate_failed", {
          defaultValue: "Failed to generate content with AI.",
        }),
      );

      message.error(errorMsg);
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAIVariant = (variant: AIContentVariant) => {
    setFormData((prev) => ({ ...prev, description: variant.content || prev.description }));
    message.success(
      t("dashboard.menu.ai_content.apply_success", {
        defaultValue: "Description updated from AI variant.",
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const normalizedName = formData.name.trim();
      const normalizedDescription = formData.description.trim();

      // Validation
      if (!normalizedName) {
        setError(t("dashboard.menu.errors.name_required"));
        message.error(t("dashboard.menu.toasts.validation_error_message"));
        setLoading(false);
        return;
      }

      if (normalizedName.length > MAX_DISH_NAME_LENGTH) {
        setError(
          t("dashboard.menu.errors.name_too_long", {
            defaultValue: "Dish name must be at most 255 characters",
          }),
        );
        message.error(t("dashboard.menu.toasts.validation_error_message"));
        setLoading(false);
        return;
      }

      if (normalizedDescription.length > MAX_DISH_DESCRIPTION_LENGTH) {
        setError(
          t("dashboard.menu.errors.description_too_long", {
            defaultValue: "Description must be at most 2000 characters",
          }),
        );
        message.error(t("dashboard.menu.toasts.validation_error_message"));
        setLoading(false);
        return;
      }

      if (!formData.categoryId) {
        setError(t("dashboard.menu.errors.category_required"));
        message.error(t("dashboard.menu.toasts.validation_error_message"));
        setLoading(false);
        return;
      }

      // Parse price to number (supports decimals)
      const priceValue = parseFloat(
        formData.price.replace(/\./g, "").replace(/,/g, "."),
      );
      if (!formData.price || priceValue <= 0 || isNaN(priceValue)) {
        setError(t("dashboard.menu.errors.price_invalid"));
        message.error(t("dashboard.menu.toasts.validation_error_message"));
        setLoading(false);
        return;
      }

      // Prepare image data for submission
      const validImages = images.filter(
        (img) => img.file || img.uid !== "legacy-image",
      );

      // Separate main image and other images - ensure main image is always first with displayOrder = 1
      const mainImage = validImages.find((img) => img.isMain);
      const otherImages = validImages.filter((img) => !img.isMain);

      const orderedImages = mainImage
        ? [mainImage, ...otherImages]
        : validImages; // Fallback if no main image (shouldn't happen with current UI logic)

      const imagesToSubmit = orderedImages.map((img, index) => ({
        id: img.file
          ? undefined
          : img.uid === "legacy-image"
            ? undefined
            : img.uid,
        file: img.file,
        imageType: index === 0 ? 0 : 1, // First is always Main (imageType 0)
        displayOrder: index + 1, // Main image gets displayOrder = 1
        isActive: true,
      }));

      const submitData: any = {
        name: normalizedName,
        categoryId: formData.categoryId,
        price: priceValue,
        description: normalizedDescription,
        unit: formData.unit,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        isActive: formData.isActive,
        isVegetarian: formData.isVegetarian,
        isSpicy: formData.isSpicy,
        isBestSeller: formData.isBestSeller,
        autoDisableByStock: formData.autoDisableByStock,
        images: imagesToSubmit,
      };

      if (isNewItem) {
        const result = await dishService.createDish(submitData);
        message.success(t("dashboard.menu.toasts.create_success_message"));
      } else {
        const result = await dishService.updateDish(id, submitData);
        message.success(t("dashboard.menu.toasts.update_success_message"));
      }

      router.push("/admin/menu");
    } catch (err: any) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.toasts.save_error_message"),
      );

      if (err?.response?.status === 401) {
        setTimeout(() => router.push("/login"), 2000);
      }

      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = () => {
    setConfirmToggleOpen(true);
  };

  const confirmToggleStatus = async () => {
    const nextStatus = !formData.isActive;
    try {
      setTogglingStatus(true);
      await dishService.toggleDishStatus(id, nextStatus);
      message.success(
        nextStatus
          ? t("dashboard.menu.ingredients.status.activate_success", { name: formData.name })
          : t("dashboard.menu.ingredients.status.deactivate_success", { name: formData.name }),
      );
      setFormData((prev) => ({ ...prev, isActive: nextStatus }));
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(err, t("dashboard.menu.ingredients.status.update_failed"));
      message.error(errorMsg);
    } finally {
      setTogglingStatus(false);
      setConfirmToggleOpen(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setFormData((prev) => ({
      ...prev,
      price: formatted,
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
              ← {t("admin.order_detail.actions.back")}
            </button>
            <div>
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--text)" }}>
                {isNewItem ? t("menu_form.title_new") : t("menu_form.title_edit")}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                {isNewItem ? t("menu_form.subtitle_new") : t("menu_form.subtitle_edit")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            )}

            {loading && !isNewItem && (
              <div className="flex items-center justify-center py-8">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: "var(--primary)" }}></div>
                <p className="ml-4" style={{ color: "var(--text-muted)" }}>
                  {t("menu_form.loading")}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3 space-y-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>
                    {t("menu_form.basic_information")}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                        {t("menu_form.item_name")}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full pl-4 pr-16 py-3 rounded-lg outline-none transition-all"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                        onFocus={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 0 0 2px var(--primary)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                      />
                    </div>

                    <div>
                      <label htmlFor="categoryId" className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                        {t("menu_form.category")}
                      </label>
                      <DropDown id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required className="py-3">
                        <option value="">{t("menu_form.select_category")}</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </DropDown>
                    </div>

                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                        {t("menu_form.unit")}
                      </label>
                      <DropDown id="unit" name="unit" value={formData.unit} onChange={handleChange} required className="py-3">
                        <option value="portion">{t("menu_form.unit_portion")}</option>
                        <option value="plate">{t("menu_form.unit_plate")}</option>
                        <option value="bowl">{t("menu_form.unit_bowl")}</option>
                        <option value="cup">{t("menu_form.unit_cup")}</option>
                        <option value="glass">{t("menu_form.unit_glass")}</option>
                        <option value="piece">{t("menu_form.unit_piece")}</option>
                        <option value="serving">{t("menu_form.unit_serving")}</option>
                      </DropDown>
                    </div>

                    <div>
                      <label htmlFor="price" className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                        {t("menu_form.price")}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handlePriceChange}
                          required
                          className="w-full pl-4 pr-16 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                          onFocus={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 0 0 2px var(--primary)")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }
                        />
                        <span
                          className="absolute right-4 top-1/2 -translate-y-1/2 font-bold"
                          style={{ color: "var(--text-muted)" }}>
                          VNĐ
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label htmlFor="description" className="block text-sm font-medium" style={{ color: "var(--text)" }}>
                          {t("menu_form.description")}
                        </label>

                        <button
                          type="button"
                          onClick={() => setAiPromptModalOpen(true)}
                          disabled={aiGenerating}
                          className="ai-generate-trigger-button px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
                          style={{
                            background: "var(--primary)",
                            border: "1px solid var(--primary)",
                            color: "#fff",
                          }}>
                          {aiGenerating
                            ? t("dashboard.menu.ai_content.generating", {
                              defaultValue: "Generating...",
                            })
                            : t("dashboard.menu.ai_content.generate", {
                              defaultValue: "Generate AI",
                            })}
                        </button>
                      </div>

                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.menu.ai_content.name_based_hint", {
                          defaultValue:
                            "AI uses dish name as main context. Optional prompt adds extra direction.",
                        })}
                      </p>

                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg outline-none transition-all resize-none"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                        onFocus={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 0 0 2px var(--primary)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                      />

                      {aiSuggestions.length > 0 && (
                        <div
                          className="rounded-xl p-3 space-y-2"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}>
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                            {t("dashboard.menu.ai_content.variants_title", {
                              defaultValue: "AI variants (click one to apply)",
                            })}
                          </p>

                          <div className="space-y-2">
                            {aiSuggestions.map((variant, index) => (
                              <button
                                key={`dish-ai-variant-${index}`}
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
                                      t("dashboard.menu.ai_content.variant_label", {
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
                                      {t("dashboard.menu.ai_content.score_label", {
                                        defaultValue: "Score: {{score}}",
                                        score: variant.score,
                                      })}
                                    </span>
                                  )}
                                </div>

                                <p
                                  className="text-sm mt-2"
                                  style={{ color: "var(--text-muted)" }}>
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
                      <label htmlFor="quantity" className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
                        {t("menu_form.quantity_in_stock")}
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                        onFocus={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 0 0 2px var(--primary)")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>
                    {t("menu_form.item_properties")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                          {t("menu_form.vegetarian")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("menu_form.vegetarian_desc")}
                        </p>
                      </div>
                      <StatusToggle checked={formData.isVegetarian} onChange={() => setFormData((prev) => ({ ...prev, isVegetarian: !prev.isVegetarian }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                          {t("menu_form.spicy")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("menu_form.spicy_desc")}
                        </p>
                      </div>
                      <StatusToggle checked={formData.isSpicy} onChange={() => setFormData((prev) => ({ ...prev, isSpicy: !prev.isSpicy }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                          {t("menu_form.best_seller")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("menu_form.best_seller_desc")}
                        </p>
                      </div>
                      <StatusToggle checked={formData.isBestSeller} onChange={() => setFormData((prev) => ({ ...prev, isBestSeller: !prev.isBestSeller }))} />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>
                    {t("menu_form.settings")}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--text)" }}>
                          {t("menu_form.auto_disable_by_stock")}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("menu_form.auto_disable_by_stock_desc")}
                        </p>
                      </div>
                      <StatusToggle checked={formData.autoDisableByStock} onChange={() => setFormData((prev) => ({ ...prev, autoDisableByStock: !prev.autoDisableByStock }))} />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>
                    {t("menu_form.item_images")}
                  </h3>

                  <MultiImageUpload
                    value={images}
                    onChange={setImages}
                    maxCount={5}
                  />
                </div>

                {!isNewItem && (
                  <div
                    className="rounded-xl p-5 shadow-sm"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}>
                    <h3
                      className="text-lg font-semibold mb-4 flex items-center gap-2"
                      style={{ color: "var(--text)" }}>
                      <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                      {t("dashboard.menu.dish_status.title", {
                        defaultValue: "Dish Status",
                      })}
                    </h3>

                    <div
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ background: "var(--surface)" }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            background: formData.isActive
                              ? "rgba(34, 197, 94, 0.1)"
                              : "rgba(239, 68, 68, 0.1)",
                          }}>
                          {formData.isActive ? (
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="font-semibold"
                              style={{ color: "var(--text)" }}>
                              {formData.isActive
                                ? t("dashboard.menu.dish_status.active", {
                                  defaultValue: "Active",
                                })
                                : t("dashboard.menu.dish_status.inactive", {
                                  defaultValue: "Inactive",
                                })}
                            </span>
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                              style={{
                                background: formData.isActive
                                  ? "rgba(34, 197, 94, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                                color: formData.isActive
                                  ? "#22c55e"
                                  : "#ef4444",
                              }}>
                              {formData.isActive
                                ? t("dashboard.menu.dish_status.enabled", {
                                  defaultValue: "Enabled",
                                })
                                : t("dashboard.menu.dish_status.disabled", {
                                  defaultValue: "Disabled",
                                })}
                            </span>
                          </div>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}>
                            {formData.isActive
                              ? t("dashboard.menu.dish_status.can_order", {
                                defaultValue: "Customers can order this dish",
                              })
                              : t("dashboard.menu.dish_status.cannot_order", {
                                defaultValue:
                                  "This dish is currently unavailable",
                              })}
                          </p>
                        </div>
                      </div>

                      <StatusToggle
                        checked={formData.isActive}
                        onChange={() => handleToggleStatus()}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all hover:bg-gray-500/10"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {t("menu_form.cancel")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--primary)", color: "white" }}>
                {isNewItem ? t("menu_form.create") : t("menu_form.update")}
              </button>
            </div>
          </form>
        </div>
      </main>

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
            {t("dashboard.menu.ai_content.prompt_modal_title", {
              defaultValue: "Generate description with AI",
            })}
          </h3>

          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.menu.ai_content.prompt_modal_hint", {
              defaultValue:
                "Enter optional instructions for AI. Leave empty to generate from dish name only.",
            })}
          </p>

          <label className="text-sm font-medium block" style={{ color: "var(--text)" }}>
            {t("dashboard.menu.ai_content.prompt_label", {
              defaultValue: "Prompt",
            })}
          </label>

          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value.slice(0, MAX_AI_PROMPT_LENGTH))}
            maxLength={MAX_AI_PROMPT_LENGTH}
            disabled={aiGenerating}
            rows={4}
            placeholder={t("dashboard.menu.ai_content.prompt_placeholder", {
              defaultValue: "Optional prompt (e.g., focus on spicy flavor and premium ingredients)",
            })}
            className="ai-prompt-textarea w-full px-3 py-2 rounded-lg outline-none resize-none"
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
                ? t("dashboard.menu.ai_content.generating", {
                  defaultValue: "Generating...",
                })
                : t("dashboard.menu.ai_content.generate", {
                  defaultValue: "Generate AI",
                })}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmToggleOpen}
        title={
          formData.isActive
            ? t("dashboard.menu.ingredients.status.confirm_deactivate_title")
            : t("dashboard.menu.ingredients.status.confirm_activate_title")
        }
        description={
          formData.isActive
            ? t("dashboard.menu.ingredients.status.confirm_deactivate_desc", { name: formData.name })
            : t("dashboard.menu.ingredients.status.confirm_activate_desc", { name: formData.name })
        }
        confirmText={formData.isActive ? t("common.deactivate") : t("common.activate")}
        cancelText={t("common.cancel")}
        variant={formData.isActive ? "warning" : "info"}
        loading={togglingStatus}
        onConfirm={confirmToggleStatus}
        onCancel={() => setConfirmToggleOpen(false)}
      />
    </div>
  );
}