"use client";

import StatusToggle from "@/components/ui/StatusToggle";
import promotionService, { Promotion } from "@/lib/services/promotionService";
import { App, Button, Popconfirm, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

export default function PromotionSettings() {
  const { t } = useTranslation("common");
  const { message } = App.useApp();
  const hasFetchedRef = useRef(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );

  const [formData, setFormData] = useState<Promotion>({
    id: "",
    code: "",
    name: "",
    discountValue: 0,
    discountType: "PERCENTAGE",
    maxDiscountAmount: 0,
    minOrderAmount: 0,
    usageLimit: 0,
    usagePerCustomer: 1,
    validFrom: new Date().toISOString(),
    validTo: new Date().toISOString(),
    isActive: true,
    applicableItems: [],
  });

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const data = await promotionService.getAllPromotions();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
      setPromotions([]);
      message.error(
        t("dashboard.manage.promotion.toasts.fetch_error", {
          defaultValue: "Unable to load promotions",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPromotions();
  }, []);

  const handleOpenModal = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData(promotion);
    } else {
      setEditingPromotion(null);
      setFormData({
        id: "",
        code: "",
        name: "",
        discountValue: 0,
        discountType: "PERCENTAGE",
        maxDiscountAmount: 0,
        minOrderAmount: 0,
        usageLimit: 0,
        usagePerCustomer: 1,
        validFrom: new Date().toISOString(),
        validTo: new Date().toISOString(),
        isActive: true,
        applicableItems: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  const handleSave = async () => {
    if (!formData.code?.trim() || !formData.name?.trim()) {
      message.warning(
        t("dashboard.manage.promotion.toasts.required_fields", {
          defaultValue: "Please fill in required fields",
        }),
      );
      return;
    }

    try {
      setIsSaving(true);

      if (editingPromotion?.id) {
        await promotionService.updatePromotion(editingPromotion.id, {
          ...formData,
          id: editingPromotion.id,
          applicableItems: formData.applicableItems ?? [],
        });

        setPromotions((prev) =>
          prev.map((item) =>
            item.id === editingPromotion.id
              ? {
                  ...formData,
                  id: editingPromotion.id,
                }
              : item,
          ),
        );

        message.success(
          t("dashboard.manage.promotion.toasts.update_success", {
            defaultValue: "Promotion updated successfully",
          }),
        );
      } else {
        const createdId = await promotionService.createPromotion({
          ...formData,
          applicableItems: formData.applicableItems ?? [],
        });

        const newPromotion: Promotion = {
          ...formData,
          id: createdId || `temp-${Date.now()}`,
          code: formData.code.trim().toUpperCase(),
          applicableItems: formData.applicableItems ?? [],
        };
        setPromotions((prev) => [newPromotion, ...prev]);

        message.success(
          t("dashboard.manage.promotion.toasts.create_success", {
            defaultValue: "Promotion created successfully",
          }),
        );
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save promotion:", error);
      message.error(
        t("dashboard.manage.promotion.toasts.save_error", {
          defaultValue: "Unable to save promotion",
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await promotionService.deletePromotion(id);
      setPromotions((prev) => prev.filter((item) => item.id !== id));
      message.success(
        t("dashboard.manage.promotion.toasts.delete_success", {
          defaultValue: "Promotion deleted successfully",
        }),
      );
    } catch (error) {
      console.error("Failed to delete promotion:", error);
      message.error(
        t("dashboard.manage.promotion.toasts.delete_error", {
          defaultValue: "Unable to delete promotion",
        }),
      );
    }
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      const nextStatus = !promotion.isActive;
      await promotionService.updatePromotion(promotion.id, {
        ...promotion,
        isActive: nextStatus,
      });
      setPromotions((prev) =>
        prev.map((item) =>
          item.id === promotion.id ? { ...item, isActive: nextStatus } : item,
        ),
      );
      message.success(
        nextStatus
          ? t("dashboard.manage.promotion.toasts.activate_success", {
              defaultValue: "Promotion activated",
            })
          : t("dashboard.manage.promotion.toasts.deactivate_success", {
              defaultValue: "Promotion deactivated",
            }),
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      message.error(
        t("dashboard.manage.promotion.toasts.status_error", {
          defaultValue: "Unable to update status",
        }),
      );
    }
  };

  const formatDiscount = (discountValue: number, discountType: string) => {
    return discountType === "PERCENTAGE"
      ? `${discountValue}%`
      : `₫${discountValue.toLocaleString()}`;
  };

  const columns: ColumnsType<Promotion> = [
    {
      title: t("dashboard.manage.promotion.code", { defaultValue: "Code" }),
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <span className="font-semibold" style={{ color: "var(--text)" }}>
          {text}
        </span>
      ),
    },
    {
      title: t("dashboard.manage.promotion.name", { defaultValue: "Name" }),
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span className="font-medium" style={{ color: "var(--text)" }}>
          {text}
        </span>
      ),
    },
    {
      title: t("dashboard.manage.promotion.discount", {
        defaultValue: "Discount",
      }),
      key: "discount",
      render: (_, promo) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {formatDiscount(promo.discountValue, promo.discountType)}
        </span>
      ),
    },
    {
      title: t("dashboard.manage.promotion.min_order", {
        defaultValue: "Min Order",
      }),
      dataIndex: "minOrderAmount",
      key: "minOrderAmount",
      render: (val) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          ₫{(val ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: t("dashboard.manage.promotion.apply", { defaultValue: "Valid" }),
      key: "valid",
      render: (_, promo) => (
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {new Date(promo.validFrom).toLocaleDateString()} -{" "}
          {new Date(promo.validTo).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: t("dashboard.manage.loyalty.status", { defaultValue: "Status" }),
      key: "status",
      render: (_, promo) => (
        <StatusToggle
          checked={promo.isActive}
          onChange={() => handleToggleStatus(promo)}
          ariaLabel={
            promo.isActive
              ? t("common.status.deactivate", { defaultValue: "Deactivate" })
              : t("common.status.activate", { defaultValue: "Activate" })
          }
        />
      ),
    },
    {
      title: t("common.actions.title", { defaultValue: "Actions" }),
      key: "actions",
      width: 100,
      render: (_, promo) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(promo)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          />
          <Popconfirm
            title={t("common.confirm.delete_title", {
              defaultValue: "Are you sure?",
            })}
            description={t("common.confirm.delete_msg", {
              defaultValue: "This action cannot be undone.",
            })}
            onConfirm={() => handleDelete(promo.id)}
            okText={t("common.actions.yes", { defaultValue: "Yes" })}
            cancelText={t("common.actions.no", { defaultValue: "No" })}
            okButtonProps={{ danger: true }}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {t("dashboard.manage.promotion.title", {
              defaultValue: "Promotions",
            })}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t("dashboard.manage.promotion.desc", {
              defaultValue: "Manage promotions and discount codes",
            })}
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          style={{
            background:
              "linear-gradient(to right, var(--primary), var(--primary-hover))",
            border: "none",
          }}>
          {t("dashboard.manage.promotion.add", {
            defaultValue: "Add New Promotion",
          })}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={promotions}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="admin-loyalty-table"
      />

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
              <div
                className="p-6 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-10"
                style={{ borderColor: "var(--border)" }}>
                <h3
                  className="text-xl font-bold"
                  style={{ color: "var(--text)" }}>
                  {editingPromotion
                    ? t("dashboard.manage.promotion.edit", {
                        defaultValue: "Edit Promotion",
                      })
                    : t("dashboard.manage.promotion.add", {
                        defaultValue: "Add New Promotion",
                      })}
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

              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.code", {
                        defaultValue: "Code",
                      })}
                    </label>
                    <input
                      type="text"
                      value={formData.code ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      disabled={!!editingPromotion}
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.name", {
                        defaultValue: "Name",
                      })}
                    </label>
                    <input
                      type="text"
                      value={formData.name ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.discount_type", {
                        defaultValue: "Discount Type",
                      })}
                    </label>
                    <select
                      value={formData.discountType ?? "PERCENTAGE"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value as
                            | "PERCENTAGE"
                            | "FIXED",
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₫)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.discount_value", {
                        defaultValue: "Discount Value",
                      })}
                    </label>
                    <input
                      type="number"
                      value={formData.discountValue ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.max_discount", {
                        defaultValue: "Max Discount Amount",
                      })}
                    </label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.min_order", {
                        defaultValue: "Min Order Amount",
                      })}
                    </label>
                    <input
                      type="number"
                      value={formData.minOrderAmount ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minOrderAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.usage_limit", {
                        defaultValue: "Usage Limit",
                      })}
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usageLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.usage_per_customer", {
                        defaultValue: "Usage Per Customer",
                      })}
                    </label>
                    <input
                      type="number"
                      value={formData.usagePerCustomer ?? 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usagePerCustomer: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.valid_from", {
                        defaultValue: "Valid From",
                      })}
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        formData.validFrom
                          ? dayjs(formData.validFrom).format("YYYY-MM-DDTHH:mm")
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validFrom: new Date(e.target.value).toISOString(),
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "var(--text)" }}>
                      {t("dashboard.manage.promotion.valid_to", {
                        defaultValue: "Valid To",
                      })}
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        formData.validTo
                          ? dayjs(formData.validTo).format("YYYY-MM-DDTHH:mm")
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          validTo: new Date(e.target.value).toISOString(),
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all outline-none"
                      style={{
                        background: "var(--bg-base)",
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text)" }}>
                    {t("dashboard.manage.promotion.status", {
                      defaultValue: "Status",
                    })}
                  </label>
                  <StatusToggle
                    checked={formData.isActive}
                    onChange={() =>
                      setFormData({ ...formData, isActive: !formData.isActive })
                    }
                    ariaLabel={
                      formData.isActive
                        ? t("common.status.active", { defaultValue: "Active" })
                        : t("common.status.inactive", {
                            defaultValue: "Inactive",
                          })
                    }
                  />
                </div>
              </div>

              <div
                className="p-6 pt-4 border-t bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky bottom-0 z-10 flex justify-end gap-3"
                style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                  style={{ color: "var(--text-muted)" }}>
                  {t("dashboard.settings.buttons.cancel", {
                    defaultValue: "Cancel",
                  })}
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    !formData.code?.trim() || !formData.name?.trim() || isSaving
                  }
                  className="px-6 py-2.5 text-white rounded-xl font-medium shadow-lg hover:shadow-xl shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--primary)" }}>
                  {isSaving
                    ? t("common.saving", { defaultValue: "Saving..." })
                    : t("dashboard.settings.buttons.save_changes", {
                        defaultValue: "Save Changes",
                      })}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
