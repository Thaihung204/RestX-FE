"use client";

import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StaffFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "active" as "active" | "inactive",
    startDate: "",
    salary: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const roles = ["Manager", "Waiter", "Chef", "Cashier"];

  useEffect(() => {
    if (!isNew) {
      const mockStaff = {
        name: "John Doe",
        email: "john@restaurant.com",
        phone: "0901234567",
        role: "Manager",
        status: "active" as "active" | "inactive",
        startDate: "2024-01-15",
        salary: "15000000",
      };
      setFormData(mockStaff);
    }
  }, [id, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      console.log("Creating new staff:", formData);
    } else {
      console.log("Updating staff:", id, formData);
    }
    router.push("/admin/staff");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      console.log("Deleting staff:", id);
      router.push("/admin/staff");
    }
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
                  {isNew ? "Add New Staff Member" : "Edit Staff Member"}
                </h2>
                <p style={{ color: "var(--text-muted)" }}>
                  {isNew
                    ? "Fill in the details to add a new staff member"
                    : "Update staff member information"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                          placeholder="e.g., John Doe"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}                          placeholder="john@restaurant.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}                          placeholder="0901234567"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}>
                          <option value="">Select a role</option>
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="status"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="startDate"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Ngày vào làm <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="salary"
                          className="block text-sm font-medium mb-2"
                          style={{ color: "var(--text)" }}>
                          Lương (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="salary"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          required
                          min="0"
                          step="100000"
                          className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                          }}
                          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #FF380B'}
                          onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                          placeholder="15000000"
                        />
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
                      Profile Picture
                    </h3>
                    {imagePreview ? (
                      <div className="relative aspect-square">
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
                        className="border-2 border-dashed rounded-lg text-center transition-all cursor-pointer block aspect-square flex items-center justify-center"
                        style={{ borderColor: "var(--border)" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF380B80'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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
                            style={{ background: '#FF380B1A', color: '#FF380B' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#FF380B33'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#FF380B1A'}>
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
                {!isNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2.5 rounded-lg font-medium transition-all"
                    style={{ background: '#ef444410', color: '#ef4444' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#ef444420'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ef444410'}>
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg"
                  style={{ 
                    background: 'linear-gradient(to right, #FF380B, #FF380BF0)',
                    boxShadow: '0 10px 15px -3px #FF380B33, 0 4px 6px -4px #FF380B33'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #FF380BF0, #FF380BE0)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #FF380B, #FF380BF0)';
                  }}>
                  {isNew ? "Add Staff Member" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
