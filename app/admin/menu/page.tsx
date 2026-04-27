"use client";

import ContentAreaLoader from "@/components/admin/ContentAreaLoader";
import DishCard, { DishCardItem } from "@/components/admin/menu/DishCard";
import MenuManagementTabs from "@/components/admin/menu/MenuManagementTabs";
import { DropDown } from "@/components/ui/DropDown";
import categoryService, { Category } from "@/lib/services/categoryService";
import dishService from "@/lib/services/dishService";
import ingredientService, {
    IngredientItem,
} from "@/lib/services/ingredientService";
import menuService from "@/lib/services/menuService";
import recipeService, { DishRecipeItem } from "@/lib/services/recipeService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { PlusOutlined } from "@ant-design/icons";
import { App, Button, Modal } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface MenuItem extends DishCardItem {
  categoryId: string;
}

export default function MenuPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [activeDish, setActiveDish] = useState<MenuItem | null>(null);
  const [dishRecipes, setDishRecipes] = useState<DishRecipeItem[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");

  const normalizeMenuItem = (item: any, index: number): MenuItem => ({
    id:
      item.id?.toString() ||
      item.dishId?.toString() ||
      `dish-${index}-${Date.now()}`,
    name: item.name || "",
    categoryId:
      item.categoryId?.toString() ||
      item.category?.id?.toString() ||
      item.category?.categoryId?.toString() ||
      "",
    categoryName:
      item.categoryName?.trim() ||
      item.category?.categoryName?.trim() ||
      item.category?.name?.trim() ||
      item.category?.trim() ||
      "",
    price: item.price || 0,
    image:
      item.mainImageUrl ||
      item.imageUrl ||
      item.image ||
      (item.images && item.images.length > 0
        ? (item.images.find((img: any) => img.imageType === 0) || item.images[0])
            .imageUrl
        : null) ||
      "/placeholder-dish.jpg",
    description: item.description || "",
    isActive:
      item.isActive !== undefined
        ? item.isActive
        : item.available !== undefined
          ? item.available
          : true,
    available:
      item.isActive !== undefined
        ? item.isActive
        : item.available !== undefined
          ? item.available
          : true,
    isBestSeller: item.isBestSeller !== undefined ? item.isBestSeller : false,
  });

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, categoryData] = await Promise.all([
        dishService.getDishes(1, 100),
        categoryService.getCategories(),
      ]);

      setDbCategories((categoryData || []).filter((c) => c.isActive !== false));
      const arrayData =
        data.dishes ||
        data.data ||
        data.items ||
        (Array.isArray(data) ? data : null);

      if (arrayData && Array.isArray(arrayData)) {
        const mappedData = arrayData.map((item: any, index: number) =>
          normalizeMenuItem(item, index),
        );

        setAllMenuItems(mappedData);
        setMenuItems(mappedData);
        setError(null);
      } else {
        setError(t("dashboard.menu.errors.load_failed"));
      }
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.toasts.fetch_error_message"),
      );
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      setIngredientsLoading(true);
      const data = await ingredientService.getAll();
      setIngredients(data.filter((item) => item.isActive !== false));
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ingredients.errors.fetch_ingredients"),
      );
      message.error(errorMsg);
    } finally {
      setIngredientsLoading(false);
    }
  };

  const fetchRecipes = async (dishId: string) => {
    try {
      setLoadingRecipes(true);
      const data = await recipeService.getByDishId(dishId);
      setDishRecipes(data);
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ingredients.errors.fetch_recipes"),
      );
      message.error(errorMsg);
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchIngredients();
  }, []);

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    if (categoryId === "All") {
      setMenuItems(allMenuItems);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await menuService.getDishesByCategory(categoryId);
      const arrayData = Array.isArray(data) ? data : [];
      setMenuItems(arrayData.map((item: any, index: number) => normalizeMenuItem(item, index)));
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.toasts.fetch_error_message"),
      );
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item: DishCardItem) => {
    const nextStatus = !item.isActive;
    try {
      await dishService.toggleDishStatus(item.id, nextStatus);
      message.success(
        nextStatus
          ? t("dashboard.menu.ingredients.status.activate_success", {
              name: item.name,
            })
          : t("dashboard.menu.ingredients.status.deactivate_success", {
              name: item.name,
            }),
      );
      setMenuItems((prev) =>
        prev.map((dish) =>
          dish.id === item.id
            ? {
                ...dish,
                isActive: nextStatus,
                available: nextStatus,
              }
            : dish,
        ),
      );
      setAllMenuItems((prev) =>
        prev.map((dish) =>
          dish.id === item.id
            ? {
                ...dish,
                isActive: nextStatus,
                available: nextStatus,
              }
            : dish,
        ),
      );
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ingredients.status.update_failed"),
      );
      message.error(errorMsg);
    }
  };

  const handleOpenIngredients = async (item: DishCardItem) => {
    const dish = menuItems.find((menuItem) => menuItem.id === item.id) || null;
    setActiveDish(dish);
    setRecipeModalOpen(true);
    setSelectedIngredientId("");
    setQuantity("1");
    await fetchRecipes(item.id);
  };

  const handleAddRecipe = async () => {
    if (!activeDish) return;
    if (!selectedIngredientId) {
      message.warning(
        t("dashboard.menu.ingredients.validation.select_ingredient"),
      );
      return;
    }

    const parsedQuantity = Number(quantity);
    if (
      !quantity.trim() ||
      Number.isNaN(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      message.warning(
        t("dashboard.menu.ingredients.validation.invalid_quantity"),
      );
      return;
    }

    try {
      setSavingRecipe(true);
      await recipeService.create({
        dishId: activeDish.id,
        ingredientId: selectedIngredientId,
        quantity: parsedQuantity,
      });
      message.success(t("dashboard.menu.ingredients.toasts.add_success"));
      await fetchRecipes(activeDish.id);
      setSelectedIngredientId("");
      setQuantity("1");
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ingredients.toasts.add_error"),
      );
      message.error(errorMsg);
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleUpdateRecipe = async (recipe: DishRecipeItem) => {
    if (!recipe.id || !activeDish) return;
    if (!recipe.quantity || recipe.quantity <= 0) {
      message.warning(
        t("dashboard.menu.ingredients.validation.invalid_quantity"),
      );
      return;
    }

    try {
      setSavingRecipe(true);
      await recipeService.update(recipe.id, {
        ...recipe,
        dishId: activeDish.id,
      });
      message.success(t("dashboard.menu.ingredients.toasts.update_success"));
      await fetchRecipes(activeDish.id);
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ingredients.toasts.update_error"),
      );
      message.error(errorMsg);
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleDeleteRecipe = async (recipe: DishRecipeItem) => {
    if (!recipe.id || !activeDish) return;
    try {
      setSavingRecipe(true);
      await recipeService.delete(recipe.id);
      message.success(t("dashboard.menu.ingredients.toasts.delete_success"));
      await fetchRecipes(activeDish.id);
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.ingredients.toasts.delete_error"),
      );
      message.error(errorMsg);
    } finally {
      setSavingRecipe(false);
    }
  };

  const categoryFilters = useMemo(() => {
    return [
      { id: "All", name: t("dashboard.menu.categories.all") },
      ...dbCategories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
    ];
  }, [dbCategories, t]);

  const isNumericInput = (value: string) => /^\d*\.?\d*$/.test(value);

  return (
    <main className="flex-1 p-6 lg:p-8">
      {loading && <ContentAreaLoader />}
      {!loading && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--text)" }}>
                {t("dashboard.menu.title")}
              </h2>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.menu.subtitle")}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 flex-wrap">
              <MenuManagementTabs activeTab="dishes" />

              <Link href="/admin/menu/new">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="!inline-flex !h-12 !items-center !rounded-xl !px-6 !text-base !font-semibold"
                  style={{
                    background: "var(--primary)",
                    borderColor: "var(--primary)",
                  }}>
                  {t("dashboard.menu.add_item")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.menu.stats.total_items")}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--text)" }}>
                    {allMenuItems.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.menu.stats.available")}
                  </p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {allMenuItems.filter((i) => i.isActive).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-500"
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
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(255, 56, 11, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.menu.stats.popular_items")}
                  </p>
                  <p
                    className="text-3xl font-bold mt-1"
                    style={{ color: "var(--primary)" }}>
                    {allMenuItems.filter((i) => i.isBestSeller).length}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,56,11,0.1)" }}>
                  <svg
                    className="w-6 h-6"
                    style={{ color: "var(--primary)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
              }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.menu.stats.categories")}
                  </p>
                  <p className="text-3xl font-bold text-purple-500 mt-1">
                    {categoryFilters.length - 1}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg
                className="w-16 h-16 mb-4"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p
                className="text-lg font-medium"
                style={{ color: "var(--text)" }}>
                {t("dashboard.menu.no_items")}
              </p>
              <p
                className="text-sm mt-2"
                style={{ color: "var(--text-muted)" }}>
                {t("dashboard.menu.errors.retry_hint")}
              </p>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categoryFilters.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => void handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all`}
                    style={
                      selectedCategoryId === category.id
                        ? {
                            background:
                              "linear-gradient(to right, var(--primary))",
                            color: "white",
                          }
                        : {
                            background: "var(--surface)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }
                    }
                    suppressHydrationWarning>
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Empty State */}
              {menuItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg
                    className="w-16 h-16 mb-4"
                    style={{ color: "var(--text-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p
                    className="text-lg font-medium"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.menu.no_items")}
                  </p>
                  <p
                    className="text-sm mt-2"
                    style={{ color: "var(--text-muted)" }}>
                    {selectedCategoryId === "All"
                      ? t("dashboard.menu.add_first_item")
                      : t("dashboard.menu.empty_category", {
                          category:
                            categoryFilters.find(
                              (c) => c.id === selectedCategoryId,
                            )?.name || "",
                        })}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {menuItems.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <DishCard
                        item={item}
                        onToggleStatus={handleToggleStatus}
                        onAddIngredients={handleOpenIngredients}
                        labels={{
                          bestSeller: t("dashboard.menu.best_seller"),
                          outOfStock: t("dashboard.menu.out_of_stock"),
                          noDescription: t("dashboard.menu.no_description"),
                          price: t("dashboard.menu.price"),
                          edit: t("dashboard.menu.edit"),
                          ingredients: t(
                            "dashboard.menu.ingredients.actions.ingredients",
                          ),
                          active: t("common.active"),
                          inactive: t("common.inactive"),
                          activate: t(
                            "dashboard.menu.ingredients.actions.activate",
                          ),
                          deactivate: t(
                            "dashboard.menu.ingredients.actions.deactivate",
                          ),
                          status_icon_label: t(
                            "dashboard.menu.ingredients.actions.status_icon_label",
                          ),
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,56,11,0.1)" }}>
              <svg className="w-4 h-4" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: "var(--text)" }}>
                {activeDish
                  ? t("dashboard.menu.ingredients.modal.title", { name: activeDish.name })
                  : t("dashboard.menu.ingredients.modal.title_empty")}
              </p>
              <p className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                {dishRecipes.length > 0 ? t("dashboard.menu.ingredients.modal.ingredient_count", { count: dishRecipes.length }) : t("dashboard.menu.ingredients.modal.no_ingredient")}
              </p>
            </div>
          </div>
        }
        open={recipeModalOpen}
        onCancel={() => setRecipeModalOpen(false)}
        footer={null}
        width={680}
        destroyOnHidden>
        <div className="space-y-5 pt-1">
          {/* Add ingredient section */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.ingredients.modal.add_section_title")}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <DropDown
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                disabled={ingredientsLoading}>
                <option value="">— {t("dashboard.menu.ingredients.modal.select_option_empty")} —</option>
                {ingredients.map((ingredient) => {
                  const stockPct = ingredient.maxStockLevel > 0
                    ? (ingredient.currentQuantity ?? 0) / ingredient.maxStockLevel
                    : 1;
                  const stockLabel = stockPct <= 0 ? t("dashboard.menu.ingredients.modal.stock_out") : stockPct < 0.2 ? t("dashboard.menu.ingredients.modal.stock_low") : "";
                  return (
                    <option key={ingredient.id || ingredient.name} value={ingredient.id || ""}>
                      {ingredient.name} ({ingredient.unit}){stockLabel ? ` — ${stockLabel}` : ""}
                    </option>
                  );
                })}
              </DropDown>

              {/* Selected ingredient info card */}
              {selectedIngredientId && (() => {
                const ing = ingredients.find((i) => i.id === selectedIngredientId);
                if (!ing) return null;
                const current = ing.currentQuantity ?? 0;
                const stockPct = ing.maxStockLevel > 0 ? current / ing.maxStockLevel : 1;
                const stockStatus = current <= 0
                  ? { label: t("dashboard.menu.ingredients.modal.stock_status_out"), color: "#ef4444", bg: "rgba(239,68,68,0.1)" }
                  : stockPct < 0.2
                  ? { label: t("dashboard.menu.ingredients.modal.stock_status_low"), color: "#f59e0b", bg: "rgba(245,158,11,0.1)" }
                  : { label: t("dashboard.menu.ingredients.modal.stock_status_ok"), color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
                return (
                  <div
                    className="rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.menu.ingredients.modal.label_unit")}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{ing.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.menu.ingredients.modal.label_stock")}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {current.toLocaleString()} {ing.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.menu.ingredients.modal.label_min_max")}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {ing.minStockLevel} / {ing.maxStockLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Trạng thái</p>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: stockStatus.bg, color: stockStatus.color }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: stockStatus.color }} />
                        {stockStatus.label}
                      </span>
                    </div>
                    {ing.supplierName && (
                      <div className="col-span-2">
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.menu.ingredients.modal.label_supplier")}</p>
                        <p className="text-sm" style={{ color: "var(--text)" }}>{ing.supplierName}</p>
                      </div>
                    )}
                    {ing.type && (
                      <div className="col-span-2">
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.menu.ingredients.modal.label_type")}</p>
                        <p className="text-sm" style={{ color: "var(--text)" }}>{ing.type}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.menu.ingredients.modal.quantity_label")}
                    {selectedIngredientId && (() => {
                      const unit = ingredients.find((i) => i.id === selectedIngredientId)?.unit;
                      return unit ? <span className="ml-1 font-semibold" style={{ color: "var(--text)" }}>({unit})</span> : null;
                    })()}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        if (isNumericInput(nextValue)) setQuantity(nextValue);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg outline-none transition-all pr-16"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                    />
                    {selectedIngredientId && (
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                        {ingredients.find((i) => i.id === selectedIngredientId)?.unit ?? ""}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="primary"
                  onClick={handleAddRecipe}
                  loading={savingRecipe}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                  className="!px-5 !h-[42px] self-end"
                  style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
                  {t("dashboard.menu.ingredients.actions.add")}
                </Button>
              </div>
            </div>
          </div>

          {/* Recipe list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.ingredients.modal.list_section_title")}
            </p>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}>
              {loadingRecipes ? (
                <div className="p-6 flex items-center justify-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span className="text-sm">{t("dashboard.menu.ingredients.modal.loading_recipes")}</span>
                </div>
              ) : dishRecipes.length === 0 ? (
                <div className="p-8 flex flex-col items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-sm">{t("dashboard.menu.ingredients.modal.empty_recipes")}</p>
                </div>
              ) : (
                <>
                  {/* Table header */}
                  <div
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
                    style={{ background: "var(--surface)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                    <span>{t("dashboard.menu.ingredients.modal.col_ingredient")}</span>
                    <span className="w-24 text-center">{t("dashboard.menu.ingredients.modal.col_stock")}</span>
                    <span className="w-36 text-center">{t("dashboard.menu.ingredients.modal.col_quantity")}</span>
                    <span className="w-16 text-center">{t("dashboard.menu.ingredients.modal.col_delete")}</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {dishRecipes.map((recipe) => {
                      const ing = ingredients.find((item) => item.id === recipe.ingredientId);
                      const ingredientName = recipe.ingredientName || ing?.name || "";
                      const unit = ing?.unit ?? "";
                      const current = ing?.currentQuantity ?? 0;
                      const stockPct = (ing?.maxStockLevel ?? 0) > 0 ? current / ing!.maxStockLevel : 1;
                      const stockColor = current <= 0 ? "#ef4444" : stockPct < 0.2 ? "#f59e0b" : "#22c55e";

                      return (
                        <div
                          key={recipe.id || recipe.ingredientId}
                          className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-4 py-3 transition-colors hover:bg-black/5">
                          {/* Name + meta */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                              {ingredientName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {unit && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                                  {unit}
                                </span>
                              )}
                              {ing?.type && (
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {ing.type}
                                </span>
                              )}
                              {ing?.supplierName && (
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  · {ing.supplierName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stock */}
                          <div className="w-24 text-center">
                            <p className="text-xs font-medium" style={{ color: stockColor }}>
                              {current.toLocaleString()} {unit}
                            </p>
                            {ing && (
                              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, stockPct * 100)}%`,
                                    background: stockColor,
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Quantity input */}
                          <div className="w-36 relative">
                            <input
                              type="text"
                              value={String(recipe.quantity ?? "")}
                              onChange={(e) => {
                                const nextValue = e.target.value;
                                if (!isNumericInput(nextValue)) return;
                                setDishRecipes((prev) =>
                                  prev.map((r) =>
                                    r.ingredientId === recipe.ingredientId
                                      ? { ...r, quantity: nextValue === "" ? 0 : Number(nextValue) }
                                      : r,
                                  ),
                                );
                              }}
                              onBlur={() => handleUpdateRecipe(recipe)}
                              className="w-full px-3 py-2 rounded-lg outline-none transition-all text-sm pr-10"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                              }}
                            />
                            {unit && (
                              <span
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                                style={{ color: "var(--text-muted)" }}>
                                {unit}
                              </span>
                            )}
                          </div>

                          {/* Delete */}
                          <div className="w-16 flex justify-center">
                            <button
                              onClick={() => handleDeleteRecipe(recipe)}
                              disabled={savingRecipe}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                              title={t("dashboard.menu.ingredients.modal.delete_tooltip")}>
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
