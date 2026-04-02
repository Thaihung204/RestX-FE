"use client";

import { type OrderDetailModalItem } from "@/lib/types/order";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface OrderDetailsModalOrder {
  id: string;
  customerId: string;
  customerName: string;
  tableId: string;
  reservationId?: string | null;
  handledBy?: string | null;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  completedAt?: string | null;
  cancelledAt?: string | null;
  paymentStatus: "unpaid" | "paid";
  paymentStatusName?: string | null;
}

interface OrderDetailsModalProps {
  open: boolean;
  order: OrderDetailsModalOrder | null;
  orderNumber: string;
  tableCode: string;
  total: number;
  items: OrderDetailModalItem[];
  paymentStatusText: {
    paid: string;
    unpaid: string;
  };
  onClose: () => void;
}

export default function OrderDetailsModal({
  open,
  order,
  orderNumber,
  tableCode,
  total,
  items,
  paymentStatusText,
  onClose,
}: OrderDetailsModalProps) {
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentLabel =
    order?.paymentStatusName && order.paymentStatusName.trim().length > 0
      ? order.paymentStatusName
      : order?.paymentStatus
        ? paymentStatusText[order.paymentStatus]
        : "-";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-start justify-between gap-4 px-6 py-5 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {t("dashboard.orders.modal.title", { orderNumber })}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className="px-2.5 py-1 rounded-full"
                style={{
                  color: "var(--text-muted)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                {t("dashboard.orders.modal.table_code", { tableCode })}
              </span>
              <span
                className="px-2.5 py-1 rounded-full"
                style={{
                  color: "var(--text-muted)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                {t("dashboard.orders.modal.total_items", { count: totalItems })}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full transition"
            style={{ color: "var(--text-muted)", background: "var(--surface)" }}
            onClick={onClose}
            aria-label={t("dashboard.orders.modal.close")}>
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

        <div className="px-6 py-4 space-y-4 max-h-[460px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.fields.reference")}
              </p>
              <p className="font-medium break-all" style={{ color: "var(--text)" }}>
                {orderNumber || "-"}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.fields.customer")}
              </p>
              <p className="font-medium break-all" style={{ color: "var(--text)" }}>
                {order?.customerName ?? "-"}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.fields.table")}
              </p>
              <p className="font-medium break-all" style={{ color: "var(--text)" }}>
                {tableCode || "-"}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.fields.reservation_id")}
              </p>
              <p className="font-medium break-all" style={{ color: "var(--text)" }}>
                {order?.reservationId ?? "-"}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.fields.handled_by")}
              </p>
              <p className="font-medium break-all" style={{ color: "var(--text)" }}>
                {order?.handledBy ?? "-"}
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.fields.payment_status")}
              </p>
              <p className="font-medium" style={{ color: "var(--text)" }}>
                {paymentLabel}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-sm py-4" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.modal.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th className="text-left pb-3">{t("dashboard.orders.modal.columns.dish")}</th>
                  <th className="text-left pb-3">
                    {t("dashboard.orders.modal.columns.status")}
                  </th>
                  <th className="text-left pb-3">
                    {t("dashboard.orders.modal.columns.note")}
                  </th>
                  <th className="text-right pb-3">{t("dashboard.orders.modal.columns.qty")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="py-2.5" style={{ color: "var(--text)" }}>
                      {item.name && item.name.trim().length > 0
                        ? item.name
                        : t("dashboard.orders.modal.unknown_dish")}
                    </td>
                    <td className="py-2.5" style={{ color: "var(--text-muted)" }}>
                      {item.status ?? "-"}
                    </td>
                    <td className="py-2.5" style={{ color: "var(--text-muted)" }}>
                      {item.note ?? "-"}
                    </td>
                    <td
                      className="py-2.5 text-right font-semibold"
                      style={{ color: "var(--text-muted)" }}>
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm mb-4">
            <div>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.summary.sub_total")}
              </p>
              <p className="font-semibold" style={{ color: "var(--text)" }}>
                {(order?.subTotal ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.summary.discount")}
              </p>
              <p className="font-semibold" style={{ color: "var(--text)" }}>
                {(order?.discountAmount ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.summary.tax")}
              </p>
              <p className="font-semibold" style={{ color: "var(--text)" }}>
                {(order?.taxAmount ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.summary.service_charge")}
              </p>
              <p className="font-semibold" style={{ color: "var(--text)" }}>
                {(order?.serviceCharge ?? 0).toLocaleString("vi-VN")}đ
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>
                {t("dashboard.orders.modal.summary.completed_cancelled")}
              </p>
              <p className="font-semibold text-xs md:text-sm" style={{ color: "var(--text)" }}>
                {order?.completedAt ?? "-"} / {order?.cancelledAt ?? "-"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.modal.total")}
            </span>
            <span className="text-xl font-bold text-green-500">
              {total.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
