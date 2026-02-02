"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
  lastUpdated: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

export default function IngredientsPage() {
  const { t } = useTranslation("common");

  const [ingredients] = useState<Ingredient[]>([
    {
      id: "1",
      name: "Cá hồi tươi",
      category: "Seafood",
      unit: "kg",
      quantity: 25,
      minQuantity: 10,
      price: 450000,
      supplier: "Ocean Fresh Co.",
      lastUpdated: "2025-01-24",
      status: "in-stock",
    },
    {
      id: "2",
      name: "Cá ngừ đại dương",
      category: "Seafood",
      unit: "kg",
      quantity: 8,
      minQuantity: 10,
      price: 380000,
      supplier: "Ocean Fresh Co.",
      lastUpdated: "2025-01-24",
      status: "low-stock",
    },
    {
      id: "3",
      name: "Gạo Nhật",
      category: "Grains",
      unit: "kg",
      quantity: 150,
      minQuantity: 50,
      price: 35000,
      supplier: "Rice Imports Ltd.",
      lastUpdated: "2025-01-23",
      status: "in-stock",
    },
    {
      id: "4",
      name: "Rong biển Nori",
      category: "Vegetables",
      unit: "pack",
      quantity: 0,
      minQuantity: 20,
      price: 120000,
      supplier: "Asian Foods Supply",
      lastUpdated: "2025-01-22",
      status: "out-of-stock",
    },
    {
      id: "5",
      name: "Bơ",
      category: "Vegetables",
      unit: "kg",
      quantity: 12,
      minQuantity: 5,
      price: 95000,
      supplier: "Fresh Produce Co.",
      lastUpdated: "2025-01-24",
      status: "in-stock",
    },
    {
      id: "6",
      name: "Dưa chuột",
      category: "Vegetables",
      unit: "kg",
      quantity: 18,
      minQuantity: 10,
      price: 25000,
      supplier: "Fresh Produce Co.",
      lastUpdated: "2025-01-24",
      status: "in-stock",
    },
    {
      id: "7",
      name: "Sốt Sriracha",
      category: "Sauces",
      unit: "bottle",
      quantity: 45,
      minQuantity: 20,
      price: 65000,
      supplier: "Asian Foods Supply",
      lastUpdated: "2025-01-23",
      status: "in-stock",
    },
    {
      id: "8",
      name: "Sốt Shoyu",
      category: "Sauces",
      unit: "bottle",
      quantity: 6,
      minQuantity: 15,
      price: 55000,
      supplier: "Asian Foods Supply",
      lastUpdated: "2025-01-24",
      status: "low-stock",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = [
    "Seafood",
    "Grains",
    "Vegetables",
    "Sauces",
    "Spices",
    "Dairy",
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN");
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "low-stock":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "out-of-stock":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch =
      ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ingredient.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || ingredient.category === filterCategory;
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "in-stock" && ingredient.status === "in-stock") ||
      (activeTab === "low-stock" && ingredient.status === "low-stock") ||
      (activeTab === "out-of-stock" && ingredient.status === "out-of-stock");
    return matchesSearch && matchesCategory && matchesTab;
  });

  const stats = {
    total: ingredients.length,
    inStock: ingredients.filter((i) => i.status === "in-stock").length,
    lowStock: ingredients.filter((i) => i.status === "low-stock").length,
    outOfStock: ingredients.filter((i) => i.status === "out-of-stock").length,
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text)" }}>
              {t("dashboard.ingredients.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.ingredients.subtitle")}
            </p>
          </div>
          <Link href="/admin/ingredients/new">
            <button
              className="px-6 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg flex items-center gap-2"
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
              }>
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
              {t("dashboard.ingredients.add_ingredient")}
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.ingredients.stats.total_items")}
                </p>
                <p
                  className="text-3xl font-bold mt-1"
                  style={{ color: "var(--text)" }}>
                  {stats.total}
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
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
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.ingredients.stats.in_stock")}
                </p>
                <p className="text-3xl font-bold mt-1 text-green-500">
                  {stats.inStock}
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(234, 179, 8, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.ingredients.stats.low_stock")}
                </p>
                <p className="text-3xl font-bold mt-1 text-yellow-500">
                  {stats.lowStock}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.ingredients.stats.out_of_stock")}
                </p>
                <p className="text-3xl font-bold mt-1 text-red-500">
                  {stats.outOfStock}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-500"
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
              </div>
            </div>
          </div>
        </div>

        {/* Filter Container */}
        <div
          className="p-6 rounded-xl space-y-6"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "all" },
              { id: "in-stock", label: "in-stock" },
              { id: "low-stock", label: "low-stock" },
              { id: "out-of-stock", label: "out-of-stock" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={
                  activeTab === tab.id
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
                }>
                {t(`dashboard.ingredients.tabs.${tab.label}`)}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={t("dashboard.ingredients.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg transition-all outline-none"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 rounded-lg outline-none transition-all"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}>
              <option value="all">
                {t("dashboard.ingredients.filter.all")}
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {t(
                    `dashboard.ingredients.categories.${category.toLowerCase()}`,
                  )}
                </option>
              ))}
            </select>
          </div>

          {/* Ingredients Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: "var(--border)" }}>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.name")}
                  </th>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.category")}
                  </th>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.quantity")}
                  </th>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.price")}
                  </th>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.supplier")}
                  </th>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.status")}
                  </th>
                  <th
                    className="text-left py-4 px-4 font-semibold"
                    style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.ingredients.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((ingredient) => (
                  <tr
                    key={ingredient.id}
                    className="border-b transition-colors"
                    style={{
                      borderColor: "var(--border-subtle)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255, 56, 11, 0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }>
                    <td className="py-4 px-4">
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: "var(--text)" }}>
                          {ingredient.name}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.ingredients.table.last_updated")}:{" "}
                          {ingredient.lastUpdated}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-sm border"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text-muted)",
                        }}>
                        {t(
                          `dashboard.ingredients.categories.${ingredient.category.toLowerCase()}`,
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <p
                          className="font-medium"
                          style={{ color: "var(--text)" }}>
                          {ingredient.quantity} {ingredient.unit}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.ingredients.table.min")}:{" "}
                          {ingredient.minQuantity} {ingredient.unit}
                        </p>
                      </div>
                    </td>
                    <td
                      className="py-4 px-4 font-medium"
                      style={{ color: "#FF380B" }}>
                      {formatPrice(ingredient.price)} đ
                    </td>
                    <td className="py-4 px-4" style={{ color: "var(--text)" }}>
                      {ingredient.supplier}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          ingredient.status,
                        )}`}>
                        {t(`dashboard.ingredients.status.${ingredient.status}`)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/ingredients/${ingredient.id}`}
                          className="p-2 rounded-lg transition-all"
                          style={{
                            background: "rgba(255, 56, 11, 0.1)",
                            color: "#FF380B",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255, 56, 11, 0.2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(255, 56, 11, 0.1)")
                          }>
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
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIngredients.length === 0 && (
              <div className="text-center py-12">
                <p style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.ingredients.no_results")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
