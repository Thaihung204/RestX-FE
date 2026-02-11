"use client";

import MultiImageUpload from "@/components/MultiImageUpload";
import categoryService, { Category } from "@/lib/services/categoryService";
import dishService from "@/lib/services/dishService";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ImageItem {
  uid: string;
  url?: string;
  file?: File;
  preview?: string;
  isMain: boolean;
}

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
      setCategories(data.filter(cat => cat.isActive));
    } catch (err) {
      console.error('Failed to load categories:', err);
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
        const imageUrl = item.image || item.mainImageUrl || '';
        setImages([{
          uid: 'legacy-image',
          url: imageUrl,
          isMain: true,
        }]);
      }
    } catch (err: any) {
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

      // Validation
      if (!formData.name.trim()) {
        setError("Name is required");
        setLoading(false);
        return;
      }

      if (!formData.categoryId) {
        setError("Please select a category");
        setLoading(false);
        return;
      }
      
      // Parse price to number (supports decimals)
      const priceValue = parseFloat(formData.price.replace(/\./g, '').replace(/,/g, '.'));
      if (!formData.price || priceValue <= 0 || isNaN(priceValue)) {
        setError("Price must be greater than 0");
        setLoading(false);
        return;
      }

      // Prepare image data for submission
      const validImages = images.filter(img => img.file || img.uid !== 'legacy-image');
      
      // Separate main image and other images
      const mainImage = validImages.find(img => img.isMain);
      const otherImages = validImages.filter(img => !img.isMain);
      
      const orderedImages = mainImage 
        ? [mainImage, ...otherImages]
        : validImages; // Fallback if no main image (shouldn't happen with current UI logic)

      const imagesToSubmit = orderedImages.map((img, index) => ({
        id: img.file ? undefined : img.uid,
        file: img.file,
        imageType: index === 0 ? 0 : 1, // First is always Main
        displayOrder: index + 1,
        isActive: true
      }));

      const submitData: any = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        price: priceValue,
        description: formData.description.trim(),
        unit: formData.unit,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        isActive: formData.isActive,
        isVegetarian: formData.isVegetarian,
        isSpicy: formData.isSpicy,
        isBestSeller: formData.isBestSeller,
        autoDisableByStock: formData.autoDisableByStock,
        images: imagesToSubmit
      };

      if (isNewItem) {
        const result = await dishService.createDish(submitData);
        alert("Menu item created successfully!");
      } else {
        const result = await dishService.updateDish(id, submitData);
        alert("Menu item updated successfully!");
      }

      router.push("/admin/menu");
    } catch (err: any) {
      
      let errorMsg = "Failed to save menu item";

      if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          // Try to extract validation errors
          if (data?.errors) {
            const validationErrors = Object.entries(data.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
            errorMsg = `Validation errors:\n${validationErrors}`;
          } else {
            errorMsg =
              data?.message ||
              data?.title ||
              data?.error ||
              "Invalid data. Please check your input.";
          }
        } else if (status === 401) {
          errorMsg = "Unauthorized. Please login again.";
          setTimeout(() => router.push("/login"), 2000);
        } else if (status === 403) {
          errorMsg = "You don't have permission to perform this action.";
        } else if (status === 404) {
          errorMsg = "Menu item not found.";
        } else if (status === 500) {
          errorMsg = `Server error: ${data?.message || data?.title || 'Please try again later.'}`;
        } else {
          errorMsg =
            data?.message || data?.title || data?.error || `Error ${status}`;
        }
      } else if (err.request) {
        // Request sent but no response
        errorMsg = "No response from server. Please check your connection.";
      } else {
        // Error in request setup
        errorMsg = err.message || "Unknown error occurred";
      }

      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
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
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 mb-2 transition-colors p-2 rounded-lg"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
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
              <div className="lg:col-span-3 space-y-4">
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
                          }}></div>
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

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}>
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ color: "var(--text)" }}>
                    Item Images
                  </h3>
                  
                  <MultiImageUpload
                    value={images}
                    onChange={setImages}
                    maxCount={5}
                  />
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "linear-gradient(to right, #CC2D08, #B32607)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "linear-gradient(to right, #FF380B, #FF380BF0)")
                }>
                {isNewItem ? "Create Menu Item" : "Update Menu Item"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
