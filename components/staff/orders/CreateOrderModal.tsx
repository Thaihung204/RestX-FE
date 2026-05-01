"use client";

import type { ComboSummaryDto } from "@/lib/services/dishService";
import type { TableItem } from "@/lib/services/tableService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Badge, Modal, Select, Typography } from "antd";
import { useState } from "react";
import StaffCartConfirmModal from "./StaffCartConfirmModal";
import StaffMenuPicker, { type StaffCartRow } from "./StaffMenuPicker";

const { Text } = Typography;

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCreating: boolean;
  tables: TableItem[];
  selectedTableId: string;
  setSelectedTableId: (value: string) => void;
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

export default function CreateOrderModal({
  isOpen,
  onClose,
  onConfirm,
  isCreating,
  tables,
  selectedTableId,
  setSelectedTableId,
  menuCategories,
  comboItems,
  activeMenuCategory,
  setActiveMenuCategory,
  cart,
  addToCart,
  addComboToCart,
  updateCartQuantity,
  t,
}: CreateOrderModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cartItemCount = cart.reduce((sum, row) => sum + row.quantity, 0);

  const selectedTable = tables.find((tbl) => tbl.id === selectedTableId);
  const contextLabel = selectedTable
    ? `${t("staff.orders.order.table")} ${selectedTable.code}${
        selectedTable.floorName ? ` — ${selectedTable.floorName}` : ""
      }`
    : undefined;

  const tableOptions = tables
    .filter((tbl) => tbl.isActive)
    .map((table) => ({
      value: table.id,
      label: `${t("staff.orders.order.table")} ${table.code}${
        table.floorName ? ` — ${table.floorName}` : ""
      }`,
    }));

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingCartOutlined style={{ fontSize: 18, color: "var(--primary)" }} />
            <span>{t("staff.orders.modal.create_order")}</span>
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
          disabled: !selectedTableId || cart.length === 0,
          style: {
            background: !selectedTableId || cart.length === 0
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
        {/* Table selector */}
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "var(--primary)" }}>
            {t("staff.orders.modal.select_table")}
          </Text>
          <Select
            placeholder={t("staff.orders.modal.select_table_placeholder")}
            size="middle"
            style={{ width: "100%" }}
            value={selectedTableId || undefined}
            onChange={setSelectedTableId}
            options={tableOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            listHeight={220}
            virtual={false}
            styles={{ popup: { root: { overscrollBehavior: "contain" } } }}
            onPopupScroll={(e) => e.stopPropagation()}
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
        isConfirming={isCreating}
        t={t}
      />
    </>
  );
}
