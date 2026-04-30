"use client";

/**
 * Cart review panel used inside AddOrderItem and CreateOrderModal.
 * Shows all selected items with +/- controls and total.
 */

import { formatVND } from "@/lib/utils/currency";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import type { StaffCartRow } from "./StaffMenuPicker";

const { Text } = Typography;

interface StaffCartPanelProps {
  cart: StaffCartRow[];
  updateCartQuantity: (itemId: string, delta: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function StaffCartPanel({ cart, updateCartQuantity, t }: StaffCartPanelProps) {
  const total = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  const totalItems = cart.reduce((sum, row) => sum + row.quantity, 0);

  if (cart.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 13, gap: 8,
        padding: "24px 0",
      }}>
        <img
          src="/images/dishStatus/spicy.png"
          alt=""
          style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.2 }}
        />
        <span>{t("staff.orders.modal.cart_empty")}</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10,
      }}>
        <Text strong style={{ fontSize: 13 }}>
          {t("staff.orders.modal.cart_title")} ({totalItems})
        </Text>
        <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {t("staff.orders.modal.total_estimate")}
        </Text>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
              {/* Image */}
              {row.item.imageUrl ? (
                <img
                  src={row.item.imageUrl}
                  alt={row.item.name}
                  style={{
                    width: 40, height: 40, objectFit: "cover",
                    borderRadius: 7, flexShrink: 0,
                    border: "1px solid var(--border)",
                  }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 7, flexShrink: 0,
                  background: "var(--border)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <img
                    src="/images/dishStatus/spicy.png"
                    alt=""
                    style={{ width: 18, height: 18, objectFit: "contain", opacity: 0.25 }}
                  />
                </div>
              )}

              {/* Name + price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 13, fontWeight: 600, display: "block",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                >
                  {row.item.name}
                </Text>
                <Text style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                  {formatVND(row.item.price * row.quantity)}
                </Text>
              </div>

              {/* +/- */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <Button
                  size="small" shape="circle" type="text"
                  icon={<MinusOutlined />}
                  onClick={() => updateCartQuantity(row.item.id, -1)}
                  style={{ border: "1px solid var(--border)", color: "var(--text)", width: 26, height: 26 }}
                />
                <Text style={{ minWidth: 18, textAlign: "center", fontSize: 13, fontWeight: 700 }}>
                  {row.quantity}
                </Text>
                <Button
                  size="small" shape="circle" type="text"
                  icon={<PlusOutlined />}
                  onClick={() => updateCartQuantity(row.item.id, 1)}
                  style={{ border: "1px solid var(--border)", color: "var(--text)", width: 26, height: 26 }}
                />
              </div>
            </div>

            {/* Combo children */}
            {row.comboId && (row.comboDetails ?? []).length > 0 && (
              <div style={{
                borderTop: "1px dashed var(--border)",
                padding: "5px 10px 6px 58px",
                background: "rgba(0,0,0,0.02)",
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                {(row.comboDetails ?? []).map((d, i) => (
                  <Text key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    • {d.dishName} x{d.quantity * row.quantity}
                  </Text>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        borderTop: "1px solid var(--border)",
        paddingTop: 10, marginTop: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Text style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {t("staff.orders.modal.total_estimate")}
        </Text>
        <Text strong style={{ fontSize: 16, color: "var(--primary)" }}>
          {formatVND(total)}
        </Text>
      </div>
    </div>
  );
}
