 "use client";

import employeeService from "@/lib/services/employeeService";
import { useToast } from "@/lib/contexts/ToastContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ROLES = ["Manager", "Chef", "Waiter", "Cashier", "Staff"];
const SALARY_TYPES = ["Hourly", "Monthly", "Daily"];

export default function StaffFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNewStaff = id === "new";
  const { showToast } = useToast();
  const { t } = useTranslation(["common"]);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    position: "",
    hireDate: new Date().toISOString().split("T")[0],
    salary: "",
    salaryType: "Monthly",
    role: "Staff",
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNewStaff) {
      fetchStaff();
    }
  }, [id, isNewStaff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const employee = await employeeService.getEmployeeById(id);

      setFormData({
        email: employee.email || "",
        fullName: employee.fullName || "",
        phoneNumber: employee.phoneNumber || "",
        address: employee.address || "",
        position: employee.position || "",
        hireDate: employee.hireDate
          ? new Date(employee.hireDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        salary: employee.salary?.toString() || "0",
        salaryType: employee.salaryType || "Monthly",
        role: employee.roles?.[0] || "Staff",
        isActive: employee.isActive !== undefined ? employee.isActive : true,
      });
    } catch (err: any) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validation
      if (!formData.fullName.trim()) {
        showToast(
          "error",
          t("dashboard.toasts.staff.validation_error_title"),
          t("dashboard.toasts.staff.validation_full_name_required"),
        );
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        showToast(
          "error",
          t("dashboard.toasts.staff.validation_error_title"),
          t("dashboard.toasts.staff.validation_email_required"),
        );
        setLoading(false);
        return;
      }

      if (!formData.position.trim()) {
        showToast(
          "error",
          t("dashboard.toasts.staff.validation_error_title"),
          t("dashboard.toasts.staff.validation_position_required"),
        );
        setLoading(false);
        return;
      }

      if (
        !formData.salary ||
        parseInt(formData.salary.replace(/\D/g, "")) <= 0
      ) {
        showToast(
          "error",
          t("dashboard.toasts.staff.validation_error_title"),
          t("dashboard.toasts.staff.validation_salary_required"),
        );
        setLoading(false);
        return;
      }

      if (isNewStaff) {
        // Create new staff
        const submitData = {
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          position: formData.position.trim(),
          hireDate: formData.hireDate,
          salary: parseInt(formData.salary.replace(/\D/g, "")) || 0,
          salaryType: formData.salaryType,
          role: formData.role,
        };

        await employeeService.createEmployee(submitData);
        showToast(
          "success",
          t("dashboard.toasts.staff.created_title"),
          t("dashboard.toasts.staff.created_message"),
        );
        setTimeout(() => router.push("/admin/staff"), 1500);
        return;
      } else {
        // Update existing staff
        const submitData = {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          position: formData.position.trim(),
          hireDate: formData.hireDate,
          salary: parseInt(formData.salary.replace(/\D/g, "")) || 0,
          salaryType: formData.salaryType,
          isActive: formData.isActive,
        };

        await employeeService.updateEmployee(id, submitData);
        showToast(
          "success",
          t("dashboard.toasts.staff.updated_title"),
          t("dashboard.toasts.staff.updated_message"),
        );
        setTimeout(() => router.push("/admin/staff"), 1500);
        return;
      }
    } catch (err: any) {
      let errorMsg = "Failed to save staff";

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 400) {
          errorMsg =
            data?.message ||
            data?.title ||
            "Invalid data. Please check your input.";
        } else if (status === 401) {
          errorMsg = "Unauthorized. Please login again.";
          setTimeout(() => router.push("/login"), 2000);
        } else if (status === 403) {
          errorMsg = "You don't have permission to perform this action.";
        } else if (status === 404) {
          errorMsg = "Staff not found.";
        } else if (status === 500) {
          errorMsg = "Server error. Please try again later.";
        } else {
          errorMsg =
            data?.message || data?.title || data?.error || `Error ${status}`;
        }
      } else if (err.request) {
        errorMsg = "No response from server. Please check your connection.";
      } else {
        errorMsg = err.message || "Unknown error occurred";
      }

      console.error("Error saving staff:", errorMsg);
      showToast(
        "error",
        t("dashboard.toasts.staff.save_failed_title"),
        errorMsg,
      );
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

  if (loading && !isNewStaff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 mb-4 transition-colors"
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
              Back to Staff List
            </button>
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text)" }}>
              {isNewStaff ? "Add New Staff" : "Edit Staff"}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {isNewStaff
                ? "Fill in the details to add a new staff member"
                : "Update staff member information"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-xl p-6 mb-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!isNewStaff}
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder="Enter email"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Position */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Position <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder="e.g., Head Chef, Server, etc."
                  />
                </div>

                {/* Role (only for new staff) */}
                {isNewStaff && (
                  <div>
                    <label
                      className="block mb-2 font-medium"
                      style={{ color: "var(--text)" }}>
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Hire Date */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Hire Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                {/* Address - full width */}
                <div className="md:col-span-2">
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div
              className="rounded-xl p-6 mb-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                Salary Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Salary */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Salary (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData((prev) => ({ ...prev, salary: value }));
                    }}
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder="0"
                  />
                  {formData.salary && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-muted)" }}>
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseInt(formData.salary) || 0)}
                    </p>
                  )}
                </div>

                {/* Salary Type */}
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{ color: "var(--text)" }}>
                    Salary Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="salaryType"
                    value={formData.salaryType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    {SALARY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status (only for edit) */}
            {!isNewStaff && (
              <div
                className="rounded-xl p-6 mb-6"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <h3
                  className="text-xl font-bold mb-4"
                  style={{ color: "var(--text)" }}>
                  Status
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-2 border-gray-300 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    style={{
                      accentColor: "#FF380B",
                    }}
                  />
                  <span style={{ color: "var(--text)" }}>
                    Active (Staff member is currently working)
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all"
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
                className="flex-1 px-6 py-3 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading ? "#CC2D08" : "#FF380B",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#CC2D08";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#FF380B";
                }}>
                {loading
                  ? "Saving..."
                  : isNewStaff
                    ? "Create Staff"
                    : "Update Staff"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
