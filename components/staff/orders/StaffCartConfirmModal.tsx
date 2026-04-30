"use client";

/**
 * Standalone cart review popup.
 * Opens after the user clicks the primary action in AddOrderItem / CreateOrderModal.
 * Shows all selected items with +/- controls, total, and a final confirm button.
 */

import { formatVND } from "@/lib/utils/currency";
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Modal, Typography } from "antd";
import type { StaffCartRow } from "./StaffMenuPicker";

const { Text } = Typography;

interface StaffCartConfirmModalProps {
  open: boolean;
  cart: StaffCartRow[];
  updateCartQuantity: (itemId: string, delta: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
  /** Extra info line shown below the title (e.g. table name or order reference) */
  contextLabel?: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function StaffCartConfirmModal({
  open,
  cart,
  updateCartQuantity,
  onBack,
  onConfirm,
  isConfirming = false,
  contextLabel,
  t,
}: StaffCartConfirmModalProps) {
  const total = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  const totalItems = cart.reduce((sum, row) => sum + row.quantity, 0);

  return (
    <Modal
      open={open}
      onCancel={onBack}
      footer={null}
      centered
      width={480}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShoppingCartOutlined style={{ fontSize: 18, color: "var(--primary)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {t("staff.orders.modal.cart_confirm_title")} ({totalItems})
            </div>
            {contextLabel && (
              <div style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginTop: 1 }}>
                {contextLabel}
              </div>
            )}
          </div>
        </div>
      }
      styles={{ body: { padding: "8px 20px 20px" } }}
    >
      {/* Item list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: "55vh",
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {cart.map((row) => (
          <div
            key={row.item.id}
            style={{
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              overflow: "hidden",
            }}
          >
            {/* Main row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              {/* Image */}
              {row.item.imageUrl ? (
                <img
                  src={row.item.imageUrl}
                  alt={row.item.name}
                  style={{
                    width: 44, height: 44, objectFit: "cover",
                    borderRadius: 8, flexShrink: 0,
                    border: "1px solid var(--border)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                    background: "var(--border)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <img
                    src="/images/dishStatus/spicy.png"
                    alt=""
                    style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.25 }}
                  />
                </div>
              )}

              {/* Name + price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 14, fontWeight: 600, display: "block",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {row.item.name}
                </Text>
                <Text style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>
                  {formatVND(row.item.price)} × {row.quantity} = {formatVND(row.item.price * row.quantity)}
                </Text>
              </div>

              {/* +/- */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <Button
                  size="small" shape="circle" type="text"
                  icon={<MinusOutlined />}
                  onClick={() => updateCartQuantity(row.item.id, -1)}
                  style={{ border: "1px solid var(--border)", color: "var(--text)", width: 28, height: 28 }}
                />
                <Text style={{ minWidth: 20, textAlign: "center", fontSize: 14, fontWeight: 700 }}>
                  {row.quantity}
                </Text>
                <Button
                  size="small" shape="circle" type="text"
                  icon={<PlusOutlined />}
                  onClick={() => updateCartQuantity(row.item.id, 1)}
                  style={{ border: "1px solid var(--border)", color: "var(--text)", width: 28, height: 28 }}
                />
              </div>
            </div>

            {/* Combo children */}
            {row.comboId && (row.comboDetails ?? []).length > 0 && (
              <div
                style={{
                  borderTop: "1px dashed var(--border)",
                  padding: "5px 12px 7px 66px",
                  background: "rgba(0,0,0,0.02)",
                  display: "flex", flexDirection: "column", gap: 2,
                }}
              >
                {(row.comboDetails ?? []).map((d, i) => (
                  <Text key={i} style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    • {d.dishName} ×{d.quantity * row.quantity}
                  </Text>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
          borderTop: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {t("staff.orders.modal.total_estimate")}
        </Text>
        <Text strong style={{ fontSize: 18, color: "var(--primary)" }}>
          {formatVND(total)}
        </Text>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <Button
          block
          size="large"
          onClick={onBack}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          {t("staff.orders.modal.cart_confirm_back")}
        </Button>
        <Button
          block
          type="primary"
          size="large"
          loading={isConfirming}
          disabled={cart.length === 0 || isConfirming}
          onClick={onConfirm}
          style={{
            borderRadius: 8,
            fontWeight: 600,
            background: "var(--primary)",
            border: "none",
          }}
        >
          {t("staff.orders.modal.cart_confirm_submit")}
        </Button>
      </div>
    </Modal>
  );
}
