"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import axiosInstance from "@/lib/services/axiosInstance";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
}

// Hardcoded categories (temporary solution)
const STATIC_CATEGORIES: Category[] = [
  { id: "600DCEDC-D5E1-43CE-B8C9-08A64937A66C", name: "Món chính" },
  { id: "C7F1CA77-9B44-4418-B69A-8825BAD9FD6A", name: "Đồ uống" },
];

export default function MenuItemFormPage() {
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
    maxValue: "",
    quantity: "",
    isActive: true,
    isPopular: false,
    isVegetarian: false,
    isSpicy: false,
    isBestSeller: false,
    autoDisableByStock: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    if (!isNewItem) {
      fetchMenuItem();
    }
  }, [id, isNewItem]);

  const fetchMenuItem = async () => {
    try {
      setLoading(true);
      console.log("Fetching menu item ID:", id);
      const response = await axiosInstance.get(`/dishes/${id}`);

      const item = response.data;
      console.log("Fetched item data:", item);

      // Handle both categoryId (GUID) and categoryName cases
      let categoryId = "";
      if (item.categoryId) {
        // Backend returns categoryId directly
        categoryId = item.categoryId;
      } else if (item.categoryName) {
        // Backend returns categoryName, find matching ID
        const category = STATIC_CATEGORIES.find(
          (cat) => cat.name === item.categoryName,
        );
        categoryId = category?.id || "";
      }

      console.log("Resolved categoryId:", categoryId);

      setFormData({
        name: item.name || "",
        categoryId: categoryId,
        price: item.price?.toString() || "",
        description: item.description || "",
        unit: item.unit || "portion",
        maxValue: item.maxValue?.toString() || "",
        quantity: item.quantity?.toString() || "0",
        isActive: item.isActive !== undefined ? item.isActive : true,
        isPopular: item.isPopular !== undefined ? item.isPopular : false,
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

      if (item.image || item.mainImageUrl) {
        setImagePreview(item.image || item.mainImageUrl);
      }
    } catch (err: any) {
      console.error("Failed to fetch menu item:", err);
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
      });
      setError("Failed to load menu item");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Prepare JSON payload (backend expects JSON, not FormData)
      const submitData = {
        name: formData.name,
        categoryId: formData.categoryId,
        price: parseInt(formData.price.replace(/\D/g, "")) || 0,
        description: formData.description,
        unit: formData.unit,
        maxValue: formData.maxValue ? parseInt(formData.maxValue) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        isActive: formData.isActive,
        isPopular: formData.isPopular,
        isVegetarian: formData.isVegetarian,
        isSpicy: formData.isSpicy,
        isBestSeller: formData.isBestSeller,
        autoDisableByStock: formData.autoDisableByStock,
      };

      console.log("Submitting data:", submitData);

      if (isNewItem) {
        // Create new item
        const response = await axiosInstance.post(`/dishes`, submitData);
        console.log("Menu item created successfully:", response.data);
      } else {
        // Update existing item
        const response = await axiosInstance.put(`/dishes/${id}`, submitData);
        console.log("Menu item updated successfully:", response.data);
      }

      router.push("/admin/menu");
    } catch (err: any) {
      console.error("API error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.response?.data?.error ||
        `Failed to save menu item (${err.response?.status || "Unknown"})`;
      setError(errorMsg);
    } finally {
      setLoading(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Only PNG, JPG, JPEG, and WEBP files are allowed");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const formatPrice = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setFormData((prev) => ({
      ...prev,
      price: formatted,
    }));
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#FF380B10")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--surface)")
                }>
                <svg
                  className="w-5 h-5"
                  style={{ color: "var(--text)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h2
                  className="text-3xl font-bold mb-2"
                  style={{ color: "var(--text)" }}>
                  {isNewItem ? "Add New Menu Item" : "Edit Menu Item"}
                </h2>
                <p style={{ color: "var(--text-muted)" }}>
                  {isNewItem
                    ? "Create a new dish for your restaurant menu"
                    : "Update the menu item information"}
                </p>
              </div>
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
                  style={{ borderColor: "#FF380B" }}></div>
                <p className="ml-4" style={{ color: "var(--text-muted)" }}>
                  Loading...
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ color: "var(--text)" }}>
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--text)" }}>
                        Item Name
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
                          "0 0 0 2px #FF380B")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                        placeholder="e.g., Grilled Salmon"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="categoryId"
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--text)" }}>
                        Category
                      </label>
                      <select
                        id="categoryId"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                        onFocus={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 0 0 2px #FF380B")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }>
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="unit"
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--text)" }}>
                        Unit
                      </label>
                      <select
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                        onFocus={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 0 0 2px #FF380B")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }>
                        <option value="portion">Portion</option>
                        <option value="plate">Plate</option>
                        <option value="bowl">Bowl</option>
                        <option value="cup">Cup</option>
                        <option value="glass">Glass</option>
                        <option value="piece">Piece</option>
                        <option value="serving">Serving</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="price"
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--text)" }}>
                        Price
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
                            "0 0 0 2px #FF380B")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }
                          placeholder="0"
                        />
                        <span
                          className="absolute right-4 top-1/2 -translate-y-1/2 font-bold"
                          style={{ color: "var(--text-muted)" }}>
                          VNĐ
                        </span>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium mb-2"
                        style={{ color: "var(--text)" }}>
                        Description
                      </label>
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
                          "0 0 0 2px #FF380B")
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                        placeholder="Describe the dish, ingredients, or special features..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="quantity"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Quantity in Stock
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
                            "0 0 0 2px #FF380B")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="maxValue"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Max Value
                        </label>
                        <input
                          type="number"
                          id="maxValue"
                          name="maxValue"
                          value={formData.maxValue}
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
                            "0 0 0 2px #FF380B")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ color: "var(--text)" }}>
                    Item Properties
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}>
                          Vegetarian
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          This item is suitable for vegetarians
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isVegetarian"
                          checked={formData.isVegetarian}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: formData.isVegetarian
                              ? "#FF380B"
                              : "#4b5563",
                          }}></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}>
                          Spicy
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          This item contains spicy ingredients
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isSpicy"
                          checked={formData.isSpicy}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: formData.isSpicy
                              ? "#FF380B"
                              : "#4b5563",
                          }}></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}>
                          Best Seller
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          Mark as best selling item
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isBestSeller"
                          checked={formData.isBestSeller}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: formData.isBestSeller
                              ? "#FF380B"
                              : "#4b5563",
                          }}></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ color: "var(--text)" }}>
                    Settings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}>
                          Available for Order
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          Customers can order this item
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: formData.isActive
                              ? "#FF380B"
                              : "#4b5563",
                          }}
                          onFocus={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 0 0 4px #FF380B33")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}>
                          Mark as Popular
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          Display &quot;Popular&quot; badge on this item
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="isPopular"
                          checked={formData.isPopular}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: formData.isPopular
                              ? "#FF380B"
                              : "#4b5563",
                          }}
                          onFocus={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 0 0 4px #FF380B33")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.boxShadow = "none")
                          }></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm"
                          style={{ color: "var(--text)" }}>
                          Auto-Disable by Stock
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}>
                          Automatically disable when out of stock
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoDisableByStock"
                          checked={formData.autoDisableByStock}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            backgroundColor: formData.autoDisableByStock
                              ? "#FF380B"
                              : "#4b5563",
                          }}></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div
                  className="rounded-xl p-4 sticky top-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ color: "var(--text)" }}>
                    Item Image
                  </h3>
                  {imagePreview ? (
                    <div className="relative" style={{ aspectRatio: "4/3" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg">
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
                    </div>
                  ) : (
                    <label
                      htmlFor="image-upload"
                      className="border-2 border-dashed rounded-lg text-center transition-all cursor-pointer block"
                      style={{
                        borderColor: "var(--border)",
                        aspectRatio: "4/3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = "#FF380B80")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }>
                      <div className="flex flex-col items-center gap-2 p-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: "var(--surface)" }}>
                          <svg
                            className="w-6 h-6"
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
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: "var(--text)" }}>
                            Click to upload
                          </p>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--text-muted)" }}>
                            PNG, JPG, WEBP (5MB)
                          </p>
                        </div>
                        <span
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: "#FF380B1A",
                            color: "#FF380B",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "#FF380B33")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "#FF380B1A")
                          }>
                          Choose File
                        </span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all hover:bg-gray-500/10"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? "#999"
                    : "linear-gradient(to right, #FF380B, #FF380BF0)",
                  boxShadow:
                    "0 10px 15px -3px #FF380B33, 0 4px 6px -4px #FF380B33",
                }}
                onMouseEnter={(e) => {
                  if (!loading)
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #FF380BF0, #FF380BE0)";
                }}
                onMouseLeave={(e) => {
                  if (!loading)
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #FF380B, #FF380BF0)";
                }}>
                {loading
                  ? "Saving..."
                  : isNewItem
                    ? "Add Menu Item"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
