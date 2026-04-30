"use client";

import type { ComboSummaryDto } from "@/lib/services/dishService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Badge, Modal, Select, Typography } from "antd";
import { useState } from "react";
import StaffCartConfirmModal from "./StaffCartConfirmModal";
import StaffMenuPicker, { type StaffCartRow } from "./StaffMenuPicker";

const { Text } = Typography;

interface OrderOption {
  id: string;
  reference: string;
  tableName: string;
  tableCodes?: string[];
}

interface AddOrderItemProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedOrderIdForAdd: string;
  setSelectedOrderIdForAdd: (value: string) => void;
  orders: OrderOption[];
  menuCategories: MenuCategory[];
  comboItems: ComboSummaryDto[];
  activeMenuCategory: string;
  setActiveMenuCategory: (value: string) => void;
  cart: StaffCartRow[];
  addToCart: (item: DishItem) => void;
  addComboToCart: (combo: ComboSummaryDto) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function AddOrderItem({
  isOpen,
  onClose,
  onConfirm,
  selectedOrderIdForAdd,
  setSelectedOrderIdForAdd,
  orders,
  menuCategories,
  comboItems,
  activeMenuCategory,
  setActiveMenuCategory,
  cart,
  addToCart,
  addComboToCart,
  updateCartQuantity,
  t,
}: AddOrderItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, row) => sum + row.quantity, 0);

  const selectedOrder = orders.find((o) => o.id === selectedOrderIdForAdd);
  const contextLabel = selectedOrder
    ? `${selectedOrder.reference} — ${t("staff.orders.order.table")} ${
        selectedOrder.tableCodes?.join(" - ") || selectedOrder.tableName
      }`
    : undefined;

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingCartOutlined style={{ fontSize: 18, color: "var(--primary)" }} />
            <span>{t("staff.orders.modal.add_item")}</span>
            {cartItemCount > 0 && (
              <Badge
                count={cartItemCount}
                style={{ backgroundColor: "var(--primary)", marginLeft: 4 }}
              />
            )}
          </div>
        }
        open={isOpen}
        onCancel={onClose}
        onOk={() => setConfirmOpen(true)}
        okText={
          <span>
            {t("staff.orders.modal.review_cart")}
            {cartItemCount > 0 ? ` (${cartItemCount})` : ""}
          </span>
        }
        okButtonProps={{
          disabled: cart.length === 0 || !selectedOrderIdForAdd,
          style: {
            background: cart.length === 0 || !selectedOrderIdForAdd
              ? undefined
              : "var(--primary)",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        cancelText={t("staff.orders.modal.cancel")}
        width={520}
        centered
        styles={{ body: { padding: "12px 16px", maxHeight: "70vh", overflowY: "auto" } }}
      >
        {/* Order selector */}
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "var(--primary)" }}>
            {t("staff.orders.modal.select_order")}
          </Text>
          <Select
            placeholder={t("staff.orders.modal.order_detail")}
            size="middle"
            style={{ width: "100%" }}
            value={selectedOrderIdForAdd || undefined}
            onChange={setSelectedOrderIdForAdd}
            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            listHeight={220}
            virtual={false}
            styles={{ popup: { root: { overscrollBehavior: "contain" } } }}
            onPopupScroll={(e) => e.stopPropagation()}
            options={orders.map((order) => {
              const tableLabel =
                order.tableCodes && order.tableCodes.length > 0
                  ? order.tableCodes.join(" - ")
                  : order.tableName;
              return {
                value: order.id,
                label: `${order.reference} — ${t("staff.orders.order.table")} ${tableLabel}`,
              };
            })}
          />
        </div>

        {/* Menu picker */}
        <StaffMenuPicker
          menuCategories={menuCategories}
          comboItems={comboItems}
          activeMenuCategory={activeMenuCategory}
          setActiveMenuCategory={setActiveMenuCategory}
          cart={cart}
          addToCart={addToCart}
          addComboToCart={addComboToCart}
          updateCartQuantity={updateCartQuantity}
          t={t}
        />
      </Modal>

      {/* Cart confirm popup */}
      <StaffCartConfirmModal
        open={confirmOpen}
        cart={cart}
        updateCartQuantity={updateCartQuantity}
        contextLabel={contextLabel}
        onBack={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onConfirm();
        }}
        t={t}
      />
    </>
  );
}
