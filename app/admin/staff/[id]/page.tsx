"use client";

import employeeService from "@/lib/services/employeeService";
import { App } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ROLES = ["Kitchen Staff", "Waiter"];
const SALARY_TYPES = ["Monthly", "Hourly", "Daily"];

export default function StaffFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNewStaff = id === "new";
  const { t } = useTranslation(["common"]);
  const { message } = App.useApp();

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    position: "",
    hireDate: new Date().toISOString().split("T")[0],
    terminationDate: "",
    salary: 0,
    salaryType: "Monthly",
    role: "Kitchen Staff",
    roles: [] as string[],
    isActive: true,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);

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
        terminationDate: employee.terminationDate
          ? new Date(employee.terminationDate).toISOString().split("T")[0]
          : "",
        salary: employee.salary ?? 0,
        salaryType: employee.salaryType || "Monthly",
        role: employee.roles?.[0] || "Kitchen Staff",
        roles: employee.roles || [],
        isActive: employee.isActive !== undefined ? employee.isActive : true,
      });
      setCurrentAvatarUrl(employee.avatarUrl || null);
    } catch (err: any) {
      console.error("Failed to load staff:", err);
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
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "salary"
            ? parseFloat(value) || 0
            : value,
    }));
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      message.error("Only PNG, JPG, JPEG, and WEBP files are allowed");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("File size must be less than 5MB");
      return false;
    }
    setAvatarFile(file);
    setShouldRemoveAvatar(false);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    return true;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setCurrentAvatarUrl(null);
    setShouldRemoveAvatar(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isNewStaff) {
        await employeeService.createEmployee({
          ...formData,
          avatar: avatarFile || undefined,
        });
        message.success(t("dashboard.toasts.staff.created_message"));
      } else {
        const avatarValue = shouldRemoveAvatar
          ? null
          : (avatarFile ?? undefined);
        await employeeService.updateEmployee(id, {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          position: formData.position,
          hireDate: formData.hireDate,
          terminationDate: formData.terminationDate || undefined,
          salary: formData.salary,
          salaryType: formData.salaryType,
          isActive: formData.isActive,
          avatar: avatarValue,
        });
        message.success(t("dashboard.toasts.staff.updated_message"));
      }
      setTimeout(() => router.push("/admin/staff"), 1500);
    } catch (err: any) {
      message.error(
        err.response?.data?.message || t("dashboard.staff.errors.save_failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

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
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 mb-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: "var(--text)" }}>
                <svg
                  className="w-4 h-4"
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
                {t("dashboard.staff.back_to_list")}
              </button>
              <h2
                className="text-3xl font-bold"
                style={{ color: "var(--text)" }}>
                {isNewStaff
                  ? t("dashboard.staff.add_new_staff")
                  : t("dashboard.staff.edit_staff")}
              </h2>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Fields */}
            <div className="lg:col-span-8 space-y-6">
              {/* Basic Information */}
              <div
                className="rounded-xl p-6 shadow-sm"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <h3
                  className="text-lg font-semibold mb-6 flex items-center gap-2"
                  style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                  {t("dashboard.staff.basic_information")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.form.full_name")}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.form.email")}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={!isNewStaff}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.form.phone_number")}
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.form.position")}
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.form.hire_date")}
                    </label>
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  {isNewStaff && (
                    <div className="md:col-span-2">
                      <label
                        className="block mb-1.5 text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.staff.form.role")}
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
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

                  <div className="md:col-span-2">
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.form.address")}
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all resize-none"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div
                className="rounded-xl p-6 shadow-sm"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <h3
                  className="text-lg font-semibold mb-6 flex items-center gap-2"
                  style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                  {t("dashboard.staff.employment_details.title")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Salary */}
                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.employment_details.salary")}
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      min={0}
                      step={100000}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                    {formData.salary > 0 && (
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatSalary(formData.salary)}
                      </p>
                    )}
                  </div>

                  {/* Salary Type */}
                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.employment_details.salary_type")}
                    </label>
                    <select
                      name="salaryType"
                      value={formData.salaryType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}>
                      {SALARY_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {t(`dashboard.staff.employment_details.salary_types.${st.toLowerCase()}`, { defaultValue: st })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Termination Date */}
                  <div>
                    <label
                      className="block mb-1.5 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.employment_details.termination_date")}
                      <span className="ml-1 text-xs opacity-60">({t("common.optional", { defaultValue: "optional" })})</span>
                    </label>
                    <input
                      type="date"
                      name="terminationDate"
                      value={formData.terminationDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      style={{
                        background: "var(--surface)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  {/* Roles (read-only for edit, always populated from API) */}
                  {!isNewStaff && formData.roles.length > 0 && (
                    <div>
                      <label
                        className="block mb-1.5 text-sm font-medium"
                        style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.staff.employment_details.roles")}
                      </label>
                      <div className="flex flex-wrap gap-2 px-4 py-2.5 rounded-lg border min-h-[42px] items-center"
                        style={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                        }}>
                        {formData.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: "var(--primary-soft)",
                              color: "var(--primary)",
                            }}>
                            {t(
                              `dashboard.staff.roles.${role.toLowerCase()}`,
                              { defaultValue: role },
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isNewStaff && (
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
                    {t("dashboard.staff.account_status.title")}
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
                              ? t("dashboard.staff.account_status.active")
                              : t("dashboard.staff.account_status.inactive")}
                          </span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background: formData.isActive
                                ? "rgba(34, 197, 94, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                              color: formData.isActive ? "#22c55e" : "#ef4444",
                            }}>
                            {formData.isActive
                              ? t("dashboard.staff.account_status.enabled")
                              : t("dashboard.staff.account_status.disabled")}
                          </span>
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}>
                          {formData.isActive
                            ? t(
                                "dashboard.staff.account_status.account_can_access",
                              )
                            : t(
                                "dashboard.staff.account_status.account_disabled",
                              )}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Avatar Upload */}
            <div className="lg:col-span-4 space-y-6">
              <div
                className="rounded-xl p-6 shadow-sm"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <h3
                  className="text-lg font-semibold mb-6 flex items-center gap-2"
                  style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                  {t("dashboard.staff.avatar.profile_picture")}
                </h3>

                <div className="flex flex-col items-center">
                  {/* Avatar Display/Upload Area */}
                  <div
                    className="relative w-full mb-6"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}>
                    {avatarPreview || currentAvatarUrl ? (
                      /* Image Preview State */
                      <div className="relative group">
                        <div
                          className="w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300"
                          style={{
                            borderColor: isDragging
                              ? "var(--primary)"
                              : "var(--border)",
                            boxShadow: isDragging
                              ? "0 0 20px rgba(255,107,0,0.3)"
                              : "none",
                          }}>
                          <img
                            src={avatarPreview || currentAvatarUrl || ""}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Hover Overlay with Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex items-center justify-center gap-3">
                          <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={handleAvatarChange}
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="p-3 rounded-xl bg-white/90 hover:bg-white cursor-pointer transition-all transform hover:scale-110 active:scale-95"
                            title={t("dashboard.staff.avatar.change_photo")}>
                            <svg
                              className="w-6 h-6 text-gray-800"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="p-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white cursor-pointer transition-all transform hover:scale-110 active:scale-95"
                            title={t("dashboard.staff.avatar.remove_photo")}>
                            <svg
                              className="w-6 h-6"
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
                    ) : (
                      /* Empty State - Upload Area */
                      <div className="relative">
                        <input
                          type="file"
                          id="avatar-upload-empty"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleAvatarChange}
                        />
                        <label
                          htmlFor="avatar-upload-empty"
                          className="block w-full aspect-square rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 relative overflow-hidden group"
                          style={{
                            borderColor: isDragging
                              ? "var(--primary)"
                              : "var(--border)",
                            background: isDragging
                              ? "var(--surface)"
                              : "transparent",
                          }}>
                          {/* Gradient Background on Hover */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                              background:
                                "linear-gradient(135deg, rgba(255,107,0,0.05) 0%, rgba(255,107,0,0.1) 100%)",
                            }}
                          />

                          {/* Content */}
                          <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                            {/* Icon with Animation */}
                            <div
                              className="mb-4 p-4 rounded-full transition-all duration-300 group-hover:scale-110"
                              style={{
                                background: isDragging
                                  ? "var(--primary)"
                                  : "var(--surface)",
                                color: isDragging
                                  ? "white"
                                  : "var(--text-muted)",
                              }}>
                              {formData.fullName ? (
                                <div
                                  className="text-5xl font-bold transition-colors"
                                  style={{
                                    color: isDragging
                                      ? "white"
                                      : "var(--text-muted)",
                                  }}>
                                  {formData.fullName.charAt(0).toUpperCase()}
                                </div>
                              ) : (
                                <svg
                                  className="w-16 h-16 transition-transform group-hover:rotate-12"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* Text */}
                            <div className="space-y-2">
                              <p
                                className="font-semibold text-base"
                                style={{ color: "var(--text)" }}>
                                {isDragging
                                  ? t("dashboard.staff.avatar.drop_image_here")
                                  : t(
                                      "dashboard.staff.avatar.drop_your_photo_here",
                                    )}
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: "var(--text-muted)" }}>
                                {t("dashboard.staff.avatar.or_click_to_browse")}
                              </p>
                            </div>

                            {/* Decorative Upload Icon */}
                            <div className="mt-4 opacity-40 group-hover:opacity-60 transition-opacity">
                              <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: "var(--text-muted)" }}>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                              </svg>
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* File Requirements */}
                  <div
                    className="w-full p-3 rounded-lg mb-6 text-center"
                    style={{ background: "var(--surface)" }}>
                    <p
                      className="text-xs font-medium mb-1"
                      style={{ color: "var(--text-muted)" }}>
                      {t("dashboard.staff.avatar.supported_formats")}
                    </p>
                    <div
                      className="flex items-center justify-center gap-2 text-xs"
                      style={{ color: "var(--text-muted)" }}>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ background: "var(--card)" }}>
                        JPG
                      </span>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ background: "var(--card)" }}>
                        PNG
                      </span>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ background: "var(--card)" }}>
                        WEBP
                      </span>
                      <span className="opacity-60">
                        • {t("dashboard.staff.avatar.max_size")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-lg font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/30 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{
                        background: loading ? "#999" : "var(--primary)",
                        color: "var(--text)"
                      }}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t("common.saving")}
                        </span>
                      ) : isNewStaff ? (
                        t("dashboard.staff.create_staff")
                      ) : (
                        t("dashboard.staff.update_staff")
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full py-3 rounded-lg font-medium transition-all hover:bg-opacity-80"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}>
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
