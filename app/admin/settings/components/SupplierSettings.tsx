"use client";

import supplierService, { SupplierItem } from "@/lib/services/supplierService";
import { App, Popconfirm } from "antd";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

// Re-use the shared type from service; alias for local clarity
type Supplier = SupplierItem & { phone: string; email: string; address: string };

export default function SupplierSettings() {
  const { t } = useTranslation("common");
  const { message } = App.useApp();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Supplier>({
    name: "",
    phone: "",
    email: "",
    address: "",
    isActive: true,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data as Supplier[]);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
          t("dashboard.manage.suppliers.fetch_failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({
        id: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      message.error(t("dashboard.manage.suppliers.name_required"));
      return;
    }

    try {
      setSaving(true);
      if (editingSupplier?.id) {
        await supplierService.update(editingSupplier.id, {
          ...formData,
          id: editingSupplier.id,
        });
        message.success(t("dashboard.manage.suppliers.updated"));
      } else {
        await supplierService.create(formData);
        message.success(t("dashboard.manage.suppliers.created"));
      }
      await fetchSuppliers();
      handleCloseModal();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
          t("dashboard.manage.suppliers.save_failed"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supplierService.delete(id);
      message.success(t("dashboard.manage.suppliers.deleted", { defaultValue: "Đã xoá" }));
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
          t("dashboard.manage.suppliers.delete_failed"),
      );
    }
  };

  const toggleStatus = async (supplier: Supplier) => {
    if (!supplier.id) return;
    const updated = { ...supplier, isActive: !supplier.isActive };
    // Optimistic update
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? updated : s)),
      );
    try {
      await supplierService.update(supplier.id, updated);
    } catch (err: any) {
      // Revert on failure
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? supplier : s)),
      );
      message.error(t("dashboard.manage.suppliers.status_update_failed"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: "var(--primary)" }}
        />
        <span
          className="ml-4 text-lg font-medium"
          style={{ color: "var(--text-muted)" }}>
          {t("dashboard.manage.suppliers.loading")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
            {t("dashboard.manage.suppliers.title")}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.manage.suppliers.subtitle")}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl"
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          }}>
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
          {t("dashboard.manage.suppliers.add")}
        </button>
      </div>

      {/* Table Layout for Suppliers */}
      <div
        className="rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
        }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead style={{ background: "var(--bg-base)" }}>
              <tr>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.suppliers.name")}
                </th>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.suppliers.contact")}
                </th>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.suppliers.status")}
                </th>
                <th
                  className="p-5 font-semibold text-sm tracking-wide uppercase text-right"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.manage.suppliers.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="p-4 align-top">
                    <div>
                      <div
                        className="font-bold text-base mb-1"
                        style={{ color: "var(--text)" }}>
                        {supplier.name}
                      </div>
                      <div
                        className="flex items-start gap-2 text-sm max-w-xs"
                        style={{ color: "var(--text-muted)" }}>
                        <svg
                          className="w-4 h-4 mt-0.5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="space-y-1.5">
                      <div
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {supplier.phone}
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm"
                        style={{ color: "var(--text-muted)" }}>
                        <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {supplier.email || "-"}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <button
                      onClick={() => toggleStatus(supplier)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-colors ${supplier.isActive
                        ? "bg-green-500 text-white dark:bg-green-600"
                        : "bg-gray-500 text-white dark:bg-gray-600"
                        }`}>
                      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-white"></span>
                      {supplier.isActive
                        ? t("dashboard.manage.suppliers.active")
                        : t("dashboard.manage.suppliers.inactive")}
                    </button>
                  </td>
                  <td className="p-4 text-right align-top">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(supplier)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-blue-500 hover:text-blue-600"
                        title={t("dashboard.manage.suppliers.tooltip_edit")}>
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
                      </button>
                      <Popconfirm
                        title={t("dashboard.manage.suppliers.confirm_delete")}
                        onConfirm={() => supplier.id && handleDelete(supplier.id)}
                        okText={t("common.yes")}
                        cancelText={t("common.no")}
                        okButtonProps={{ danger: true }}>
                        <button
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 hover:text-red-600"
                          title={t("dashboard.manage.suppliers.tooltip_delete")}>
                          <svg
                            className="w-5 h-5"
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
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-zinc-800">
                        <svg
                          className="w-8 h-8 opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <p
                        className="text-lg font-medium"
                        style={{ color: "var(--text)" }}>
                        {t("dashboard.manage.suppliers.empty")}
                      </p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 px-4 py-2 text-sm text-[var(--primary)] font-medium hover:bg-[var(--primary)]/10 rounded-lg transition-colors">
                        {t("dashboard.manage.suppliers.add")}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
            onClick={handleCloseModal}>
            <div
              className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-scale-in flex flex-col max-h-[90vh]"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div
                className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10"
                style={{ borderColor: "var(--border)" }}>
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--text)" }}>
                  {editingSupplier
                    ? t("dashboard.manage.suppliers.edit")
                    : t("dashboard.manage.suppliers.add")}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ color: "var(--text-muted)" }}>
                  <svg
                    className="w-5 h-5"
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

              {/* Scrollable Content */}
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.suppliers.name")}{" "}
                    <span className="text-[var(--primary)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                    style={{
                      background: "var(--bg-base)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder={t(
                      "dashboard.manage.suppliers.name_placeholder",
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.suppliers.phone")}{" "}
                      <span className="text-[var(--primary)]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                        style={{
                          background: "var(--bg-base)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                        placeholder={t(
                          "dashboard.manage.suppliers.phone_placeholder",
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.suppliers.email")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                        style={{
                          background: "var(--bg-base)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                        placeholder={t(
                          "dashboard.manage.suppliers.email_placeholder",
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.suppliers.address")}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none resize-none"
                    rows={3}
                    style={{
                      background: "var(--bg-base)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    placeholder={t(
                      "dashboard.manage.suppliers.address_placeholder",
                    )}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.suppliers.status", {
                      defaultValue: "Status",
                    })}
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isActive: !formData.isActive,
                        })
                      }
                      className={`
                        relative w-14 h-8 rounded-full cursor-pointer transition-colors duration-200 ease-in-out
                        ${formData.isActive
                          ? "bg-[var(--primary)]"
                          : "bg-gray-200 dark:bg-zinc-700"
                        }
                      `}
                      role="switch"
                      aria-checked={formData.isActive}>
                      <span
                        className={`
                          absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-200 ease-in-out
                          ${formData.isActive
                            ? "translate-x-6"
                            : "translate-x-0"
                          }
                        `}
                      />
                    </div>
                    <span
                      className={`font-medium text-sm ${formData.isActive
                        ? "text-[var(--primary)]"
                        : "text-gray-500"
                        }`}>
                      {formData.isActive
                        ? t("dashboard.manage.suppliers.active", {
                          defaultValue: "Active",
                        })
                        : t("dashboard.manage.suppliers.inactive", {
                          defaultValue: "Inactive",
                        })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3"
                style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.buttons.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim() || saving}
                  className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--primary)" }}>
                  {saving
                    ? t("dashboard.settings.buttons.saving")
                    : t("dashboard.settings.buttons.save_changes")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
