"use client";

import dishService from "@/lib/services/dishService";
import { message, Modal } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  available: boolean;
  isBestSeller: boolean;
}

export default function MenuPage() {
  const { t } = useTranslation();

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dishService.getDishes(1, 100);
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
          category: item.categoryName || item.category || "Main Course",
          price: item.price || 0,
          image:
            item.mainImageUrl ||
            item.imageUrl ||
            item.image ||
            (item.images && item.images.length > 0
              ? (item.images.find((img: any) => img.imageType === 0) || item.images[0]).imageUrl
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
        setError("Data structure not supported");
      }
    } catch (err: any) {
      if (err.response) {
        setError(
          `API Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`,
        );
      } else if (err.request) {
        setError("Network Error: No response from server");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load menu items",
        );
      }
      message.error(t("dashboard.menu.toasts.fetch_error_message"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    Modal.confirm({
      title: t("dashboard.menu.modal.delete_title"),
      content: (
        <>
          {t("dashboard.menu.modal.delete_confirm")} <strong>&quot;{name}&quot;</strong>?
          <br />
          {t("dashboard.menu.modal.cannot_undo")}
        </>
      ),
      okText: t("dashboard.menu.modal.delete"),
      okType: "danger",
      cancelText: t("dashboard.menu.modal.cancel"),
      onOk: async () => {
        try {
          await dishService.deleteDish(id);
          message.success(t("dashboard.menu.toasts.delete_success_message"));
          await fetchMenuItems();
        } catch (err: any) {
          const errorMsg =
            err.response?.data?.message || err.message || "Unknown error";
          message.error(t("dashboard.menu.toasts.delete_error_message"));
        }
      },
    });
  };

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(menuItems.map((item) => item.category)),
    ).sort();
    return ["All", ...uniqueCategories];
  }, [menuItems]);

  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

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
              style={{
                background: "linear-gradient(to right, #FF380B, #CC2D08)",
              }}
              onMouseEnter={(e) =>
              (e.currentTarget.style.background =
                "linear-gradient(to right, #CC2D08, #B32607)")
              }
              onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                "linear-gradient(to right, #FF380B, #CC2D08)")
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
                  style={{ color: "#FF380B" }}>
                  {menuItems.filter((i) => i.isBestSeller).length}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,56,11,0.1)" }}>
                <svg
                  className="w-6 h-6"
                  style={{ color: "#FF380B" }}
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
                  {categories.length - 1}
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
              style={{ borderColor: "#FF380B" }}></div>
            <p className="ml-4" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.loading")}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 font-medium">⚠️ {error}</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Please check your API connection
            </p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all`}
                  style={
                    selectedCategory === category
                      ? {
                        background:
                          "linear-gradient(to right, #FF380B, #CC2D08)",
                        color: "white",
                      }
                      : {
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }
                  }
                  suppressHydrationWarning>
                  {category === "All" ? t("dashboard.menu.categories.all") : category}
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
                <p
                  className="text-lg font-medium"
                  style={{ color: "var(--text)" }}>
                  {t("dashboard.menu.no_items")}
                </p>
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--text-muted)" }}>
                  {selectedCategory === "All"
                    ? t("dashboard.menu.add_first_item")
                    : t("dashboard.menu.empty_category", { category: selectedCategory })}
                </p>
              </div>
            ) : (
              /* Menu Items Grid */
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl overflow-hidden transition-all group"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(255,56,11,0.5)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }>
                    {/* Image */}
                    <div
                      className="relative overflow-hidden"
                      style={{
                        background: "var(--surface)",
                        aspectRatio: "4/3",
                      }}>
                      {item.image && item.image !== "/placeholder-dish.jpg" ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-16 h-16"
                            style={{ color: "var(--text-muted)" }}
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
                      )}
                      {item.isBestSeller && (
                        <div
                          className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1"
                          style={{ backgroundColor: "#FF380B" }}>
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {t("dashboard.menu.best_seller")}
                        </div>
                      )}
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold">
                            {t("dashboard.menu.out_of_stock")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3
                            className="text-sm font-bold mb-1 line-clamp-1"
                            style={{ color: "var(--text)" }}>
                            {item.name}
                          </h3>
                          <p
                            className="text-xs line-clamp-2"
                            style={{ color: "var(--text-muted)" }}>
                            {item.description || t("dashboard.menu.no_description")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 gap-1">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[10px] sm:text-xs"
                            style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.menu.price")}
                          </p>
                          <p
                            className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate"
                            style={{ color: "#FF380B" }}>
                            {formatPrice(item.price)}đ
                          </p>
                        </div>
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-500/10 text-blue-500 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium border border-blue-500/20 whitespace-nowrap flex-shrink-0 max-w-[45%] truncate">
                          {item.category}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Link
                          href={`/admin/menu/${item.id}`}
                          className="flex-1">
                          <button
                            className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              backgroundColor: "rgba(255,56,11,0.1)",
                              color: "#FF380B",
                            }}
                            onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,56,11,0.2)")
                            }
                            onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "rgba(255,56,11,0.1)")
                            }
                            suppressHydrationWarning>
                            {t("dashboard.menu.edit")}
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            background: "var(--surface)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.borderColor =
                              "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.color = "#ef4444";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--surface)";
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-muted)";
                          }}
                          suppressHydrationWarning>
                          <svg
                            className="w-4 h-4"
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
