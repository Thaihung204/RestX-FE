"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function MenuItemFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNewItem = id === "new";

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    available: true,
    popular: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = [
    "Main Course",
    "Appetizer",
    "Dessert",
    "Beverages",
  ];

  // Load existing item data if editing
  useEffect(() => {
    if (!isNewItem) {
      // TODO: Fetch item data from API using id
      // For demo purposes, using mock data
      const mockItem = {
        name: "Grilled Salmon",
        category: "Main Course",
        price: "28.99",
        description: "Fresh Atlantic salmon with herbs",
        available: true,
        popular: true,
      };
      setFormData(mockItem);
    }
  }, [id, isNewItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewItem) {
      // TODO: Add API call to create menu item
      console.log("Creating new item:", formData);
    } else {
      // TODO: Add API call to update menu item
      console.log("Updating item:", id, formData);
    }
    // Redirect back to menu page
    router.push("/admin/menu");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Check file type
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
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");
    // Format with thousand separators
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
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-orange-500/10 transition-all"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Two Column Layout: Form Left, Image Right */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Form Fields (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Basic Information Card */}
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
                  {/* Item Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text)" }}>
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      placeholder="e.g., Grilled Salmon"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text)" }}>
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}>
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label
                      htmlFor="price"
                      className="block text-sm font-medium mb-2"
                      style={{ color: "var(--text)" }}>
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handlePriceChange}
                        required
                        className="w-full pl-4 pr-16 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                        placeholder="0"
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 font-bold"
                        style={{ color: "var(--text-muted)" }}>
                        VNĐ
                      </span>
                    </div>
                  </div>

                  {/* Description */}
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
                      className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                      placeholder="Describe the dish, ingredients, or special features..."
                    />
                  </div>
                </div>
              </div>

                  {/* Settings Card */}
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
                      {/* Available Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--text)" }}>
                            Available for Order
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Customers can order this item
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="available"
                            checked={formData.available}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      {/* Popular Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--text)" }}>
                            Mark as Popular
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Display "Popular" badge on this item
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="popular"
                            checked={formData.popular}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Image Upload (1/3 width) */}
                <div className="lg:col-span-1">
              {/* Image Upload Card */}
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
                  <div className="relative" style={{ aspectRatio: '4/3' }}>
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
                    className="border-2 border-dashed rounded-lg text-center hover:border-orange-500/50 transition-all cursor-pointer block"
                    style={{ 
                      borderColor: "var(--border)",
                      aspectRatio: '4/3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
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
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          PNG, JPG, WEBP (5MB)
                        </p>
                      </div>
                      <span className="px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-lg text-xs font-medium hover:bg-orange-500/20 transition-all">
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

              {/* Action Buttons */}
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
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg font-medium hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20">
                  {isNewItem ? "Add Menu Item" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
