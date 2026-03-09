"use client";

import { type OrderDetailModalItem } from "@/lib/types/order";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface OrderDetailsModalProps {
  open: boolean;
  orderNumber: string;
  tableCode: string;
  total: number;
  items: OrderDetailModalItem[];
  onClose: () => void;
}

export default function OrderDetailsModal({
  open,
  orderNumber,
  tableCode,
  total,
  items,
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
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

        <div className="px-6 py-4 max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm py-4" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.orders.modal.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: "var(--text-muted)" }}>
                  <th className="text-left pb-3">
                    {t("dashboard.orders.modal.columns.dish")}
                  </th>
                  <th className="text-right pb-3">
                    {t("dashboard.orders.modal.columns.qty")}
                  </th>
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
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.orders.modal.total")}
          </span>
          <span className="text-xl font-bold text-green-500">
            {total.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
