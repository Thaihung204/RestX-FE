"use client";

import DishCard, { DishCardItem } from "@/components/admin/menu/DishCard";
import { usePageLoading } from "@/components/PageTransitionLoader";
import { AdminSelect } from "@/components/ui/AdminSelect";
import categoryService, { Category } from "@/lib/services/categoryService";
import dishService from "@/lib/services/dishService";
import ingredientService, { IngredientItem } from "@/lib/services/ingredientService";
import recipeService, { DishRecipeItem } from "@/lib/services/recipeService";
import { App, Button, Modal } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface MenuItem extends DishCardItem {
  categoryId: string;
}

export default function MenuPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
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

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, categoryData] = await Promise.all([
        dishService.getDishes(1, 100),
        categoryService.getCategories(),
      ]);

      setDbCategories((categoryData || []).filter((c) => c.isActive !== false));
      message.success(t("dashboard.menu.toasts.fetch_success_message"));
      const arrayData =
        data.dishes ||
        data.data ||
        data.items ||
        (Array.isArray(data) ? data : null);

      if (arrayData && Array.isArray(arrayData)) {
        const mappedData = arrayData.map((item: any, index: number) => ({
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
              ? (item.images.find((img: any) => img.imageType === 0) ||
                  item.images[0]).imageUrl
              : null) ||
            "/placeholder-dish.jpg",
          description: item.description || "",
          available:
            item.isActive !== undefined
              ? item.isActive
              : item.available !== undefined
                ? item.available
                : true,
          isBestSeller:
            item.isBestSeller !== undefined ? item.isBestSeller : false,
        }));

        setMenuItems(mappedData);
        setError(null);
      } else {
        setError(t("dashboard.menu.errors.load_failed"));
      }
    } catch {
      setError(t("dashboard.menu.errors.load_failed"));
      message.error(t("dashboard.menu.toasts.fetch_error_message"));
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      setIngredientsLoading(true);
      const data = await ingredientService.getAll();
      setIngredients(data.filter((item) => item.isActive !== false));
    } catch {
      message.error(t("dashboard.menu.ingredients.errors.fetch_ingredients"));
    } finally {
      setIngredientsLoading(false);
    }
  };

  const fetchRecipes = async (dishId: string) => {
    try {
      setLoadingRecipes(true);
      const data = await recipeService.getByDishId(dishId);
      setDishRecipes(data);
    } catch {
      message.error(t("dashboard.menu.ingredients.errors.fetch_recipes"));
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchIngredients();
  }, []);

  const handleToggleStatus = async (item: DishCardItem) => {
    const nextStatus = !item.available;
    modal.confirm({
      title: nextStatus
        ? t("dashboard.menu.ingredients.status.activate_title")
        : t("dashboard.menu.ingredients.status.deactivate_title"),
      content: (
        <>
          {nextStatus
            ? t("dashboard.menu.ingredients.status.activate_confirm", {
                name: item.name,
              })
            : t("dashboard.menu.ingredients.status.deactivate_confirm", {
                name: item.name,
              })}
        </>
      ),
      okText: nextStatus
        ? t("dashboard.menu.ingredients.status.activate_action")
        : t("dashboard.menu.ingredients.status.deactivate_action"),
      okType: nextStatus ? "primary" : "danger",
      cancelText: t("dashboard.menu.modal.cancel"),
      onOk: async () => {
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
          await fetchMenuItems();
        } catch {
          message.error(t("dashboard.menu.ingredients.status.update_failed"));
        }
      },
    });
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
      message.warning(t("dashboard.menu.ingredients.validation.select_ingredient"));
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      message.warning(t("dashboard.menu.ingredients.validation.invalid_quantity"));
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
    } catch {
      message.error(t("dashboard.menu.ingredients.toasts.add_error"));
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleUpdateRecipe = async (recipe: DishRecipeItem) => {
    if (!recipe.id || !activeDish) return;
    if (!recipe.quantity || recipe.quantity <= 0) {
      message.warning(t("dashboard.menu.ingredients.validation.invalid_quantity"));
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
    } catch {
      message.error(t("dashboard.menu.ingredients.toasts.update_error"));
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
    } catch {
      message.error(t("dashboard.menu.ingredients.toasts.delete_error"));
    } finally {
      setSavingRecipe(false);
    }
  };

  const categoryFilters = useMemo(() => {
    return [
      { id: "All", name: t("dashboard.menu.categories.all") },
      ...dbCategories
        .map((category) => ({
          id: category.id,
          name: category.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }, [dbCategories, t]);

  const [selectedCategoryId, setSelectedCategoryId] = useState("All");

  const filteredItems =
    selectedCategoryId === "All"
      ? menuItems
      : menuItems.filter((item) => item.categoryId === selectedCategoryId);

  const isNumericInput = (value: string) => /^\d*\.?\d*$/.test(value);

  return (
    <main className="flex-1 p-6 lg:p-8">
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
          <Link href="/admin/menu/new">
            <button
              className="px-4 py-2 text-white rounded-lg font-medium transition-all"
              style={{ background: "var(--primary)", color: "white" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "linear-gradient(to right, #B32607)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  "linear-gradient(to right, var(--primary))")
              }
              suppressHydrationWarning>
              <svg
                className="w-5 h-5 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {t("dashboard.menu.add_item")}
            </button>
          </Link>
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
                  {menuItems.length}
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
                  {menuItems.filter((i) => i.available).length}
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
                  {menuItems.filter((i) => i.isBestSeller).length}
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: "var(--primary)" }}></div>
            <p className="ml-4" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.loading")}
            </p>
          </div>
        )}

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
            <p className="text-lg font-medium" style={{ color: "var(--text)" }}>
              {t("dashboard.menu.no_items")}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
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
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all`}
                  style={
                    selectedCategoryId === category.id
                      ? {
                          background: "linear-gradient(to right, var(--primary))",
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
            {filteredItems.length === 0 ? (
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
                <p className="text-lg font-medium" style={{ color: "var(--text)" }}>
                  {t("dashboard.menu.no_items")}
                </p>
                <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                  {selectedCategoryId === "All"
                    ? t("dashboard.menu.add_first_item")
                    : t("dashboard.menu.empty_category", {
                        category:
                          categoryFilters.find((c) => c.id === selectedCategoryId)
                            ?.name || "",
                      })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {filteredItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <DishCard
                      item={item}
                      formatPrice={formatPrice}
                      onToggleStatus={handleToggleStatus}
                      onAddIngredients={handleOpenIngredients}
                      labels={{
                        bestSeller: t("dashboard.menu.best_seller"),
                        outOfStock: t("dashboard.menu.out_of_stock"),
                        noDescription: t("dashboard.menu.no_description"),
                        price: t("dashboard.menu.price"),
                        edit: t("dashboard.menu.edit"),
                        ingredients: t("dashboard.menu.ingredients.actions.ingredients"),
                        activate: t("dashboard.menu.ingredients.actions.activate"),
                        deactivate: t("dashboard.menu.ingredients.actions.deactivate"),
                        status_icon_label: t("dashboard.menu.ingredients.actions.status_icon_label"),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        title={
          activeDish
            ? t("dashboard.menu.ingredients.modal.title", { name: activeDish.name })
            : t("dashboard.menu.ingredients.modal.title_empty")
        }
        open={recipeModalOpen}
        onCancel={() => setRecipeModalOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px] gap-3">
            <AdminSelect
              value={selectedIngredientId}
              onChange={(e) => setSelectedIngredientId(e.target.value)}
              disabled={ingredientsLoading}
            >
              <option value="">{t("dashboard.menu.ingredients.modal.select_placeholder")}</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id || ingredient.name} value={ingredient.id || ""}>
                  {ingredient.name} ({ingredient.unit})
                </option>
              ))}
            </AdminSelect>
            <input
              type="text"
              value={quantity}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (isNumericInput(nextValue)) {
                  setQuantity(nextValue);
                }
              }}
              placeholder={t("dashboard.menu.ingredients.modal.quantity_placeholder")}
              className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <Button
              type="primary"
              onClick={handleAddRecipe}
              loading={savingRecipe}
              className="w-full">
              {t("dashboard.menu.ingredients.actions.add")}
            </Button>
          </div>

          <div className="border rounded-lg" style={{ borderColor: "var(--border)" }}>
            {loadingRecipes ? (
              <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.menu.ingredients.modal.loading_recipes")}
              </div>
            ) : dishRecipes.length === 0 ? (
              <div className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.menu.ingredients.modal.empty_recipes")}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {dishRecipes.map((recipe) => {
                  const ingredientName =
                    recipe.ingredientName ||
                    ingredients.find((item) => item.id === recipe.ingredientId)
                      ?.name ||
                    "";
                  return (
                    <div key={recipe.id || recipe.ingredientId} className="p-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                            {ingredientName}
                          </p>
                        </div>
                        <input
                          type="text"
                          value={String(recipe.quantity ?? "")}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            if (!isNumericInput(nextValue)) return;

                            setDishRecipes((prev) =>
                              prev.map((r) =>
                                r.ingredientId === recipe.ingredientId
                                  ? {
                                      ...r,
                                      quantity:
                                        nextValue === "" ? 0 : Number(nextValue),
                                    }
                                  : r,
                              ),
                            );
                          }}
                          className="w-full md:w-[120px] px-4 py-2.5 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            danger
                            onClick={() => handleDeleteRecipe(recipe)}
                            loading={savingRecipe}
                            className="min-w-[72px]">
                            {t("dashboard.menu.ingredients.actions.delete")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </main>
  );
}
