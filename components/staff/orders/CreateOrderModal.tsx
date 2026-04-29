"use client";

import type { ComboSummaryDto } from "@/lib/services/dishService";
import type { TableItem } from "@/lib/services/tableService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { formatVND } from "@/lib/utils/currency";
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Badge, Button, Card, Col, Empty, Modal, Row, Select, Tag, Typography } from "antd";

const { Text, Title } = Typography;

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
  cart: { item: DishItem; quantity: number }[];
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
  const itemQuantityMap = cart.reduce<Record<string, number>>((acc, row) => {
    acc[row.item.id] = row.quantity;
    return acc;
  }, {});

  const cartTotal = cart.reduce((sum, row) => sum + row.item.price * row.quantity, 0);
  const cartItemCount = cart.reduce((sum, row) => sum + row.quantity, 0);

  const tableOptions = tables
    .filter((t) => t.isActive)
    .map((table) => ({
      value: table.id,
      label: `${t("staff.orders.order.table", { defaultValue: "Bàn" })} ${table.code}${
        table.floorName ? ` — ${table.floorName}` : ""
      }`,
    }));

  const activeCategory = menuCategories.find((c) => c.categoryId === activeMenuCategory);

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShoppingCartOutlined style={{ fontSize: 18, color: "var(--primary)" }} />
          <span>
            {t("staff.orders.modal.create_order", { defaultValue: "Tạo Order Mới" })}
          </span>
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
      onOk={onConfirm}
      okText={t("staff.orders.modal.create_order", { defaultValue: "Tạo Order" })}
      okButtonProps={{
        disabled: !selectedTableId || cart.length === 0,
        loading: isCreating,
        style: {
          background:
            !selectedTableId || cart.length === 0
              ? undefined
              : "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
        },
      }}
      cancelButtonProps={{ style: { borderRadius: 8 } }}
      width={860}
      centered
      styles={{ body: { maxHeight: "72vh", overflowY: "auto", paddingTop: 8 } }}
    >
      <Row gutter={[16, 16]}>
        {/* Table select */}
        <Col xs={24}>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13 }}>
              {t("staff.orders.modal.select_table", { defaultValue: "Chọn bàn *" })}
            </Text>
          </div>
          <Select
            placeholder={t("staff.orders.modal.select_table_placeholder", {
              defaultValue: "Chọn bàn để tạo order...",
            })}
            size="middle"
            style={{ width: "100%" }}
            value={selectedTableId || undefined}
            onChange={setSelectedTableId}
            options={tableOptions}
            showSearch
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
            listHeight={220}
            virtual={false}
            styles={{ popup: { root: { overscrollBehavior: "contain" } } }}
            onPopupScroll={(event) => event.stopPropagation()}
          />
        </Col>

        {/* Category select */}
        <Col xs={24}>
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13 }}>
              {t("staff.orders.modal.select_category", { defaultValue: "Danh mục" })}
            </Text>
          </div>
          <Select
            size="middle"
            style={{ width: "100%" }}
            value={activeMenuCategory || undefined}
            onChange={setActiveMenuCategory}
            options={menuCategories.map((c) => ({
              value: c.categoryId,
              label: c.categoryName,
            }))}
            getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
          />
        </Col>

        {/* Dish grid */}
        <Col xs={24}>
          {activeCategory && activeCategory.items.length > 0 ? (
            <Row gutter={[10, 10]}>
              {activeCategory.items.map((item) => {
                const currentQty = itemQuantityMap[item.id] || 0;

                return (
                  <Col xs={24} sm={12} key={item.id}>
                    <Card
                      hoverable
                      size="small"
                      styles={{ body: { padding: "10px 12px" } }}
                      style={{
                        borderRadius: 10,
                        border: currentQty > 0 ? "1.5px solid var(--primary)" : undefined,
                        transition: "border-color 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.name}
                          </Text>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--primary)",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {formatVND(item.price)}
                          </div>
                        </div>

                        {currentQty > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            <Button
                              size="small"
                              shape="circle"
                              type="text"
                              icon={<MinusOutlined />}
                              onClick={() => updateCartQuantity(item.id, -1)}
                              style={{
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                width: 28,
                                height: 28,
                              }}
                            />
                            <Text
                              style={{
                                minWidth: 20,
                                textAlign: "center",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {currentQty}
                            </Text>
                            <Button
                              size="small"
                              shape="circle"
                              type="text"
                              icon={<PlusOutlined />}
                              onClick={() => updateCartQuantity(item.id, 1)}
                              style={{
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                width: 28,
                                height: 28,
                              }}
                            />
                          </div>
                        ) : (
                          <Button
                            size="small"
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            onClick={() => addToCart(item)}
                            style={{ flexShrink: 0 }}
                          />
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty
              description={t("staff.orders.modal.no_dishes", {
                defaultValue: "Không có món trong danh mục này",
              })}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Col>

        {/* Combo section */}
        {comboItems.length > 0 && (
          <Col xs={24}>
            <Title level={5} style={{ margin: "4px 0 8px", fontSize: 13 }}>
              {t("dashboard.menu.combo.title", { defaultValue: "Combos" })}
            </Title>
            <Row gutter={[10, 10]}>
              {comboItems.map((combo) => {
                const totalDishes = (combo.details || []).reduce(
                  (sum, detail) => sum + (detail.quantity > 0 ? detail.quantity : 1),
                  0
                );

                return (
                  <Col xs={24} sm={12} key={combo.id}>
                    <Card size="small" styles={{ body: { padding: "10px 12px" } }} style={{ borderRadius: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {combo.name}
                          </Text>
                          <Text
                            style={{
                              display: "block",
                              fontSize: 11,
                              color: "var(--text-muted)",
                            }}
                          >
                            {t("dashboard.menu.combo.fields.total_items", {
                              defaultValue: "Total items",
                            })}
                            : {totalDishes}
                          </Text>
                          <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
                            {formatVND(Number(combo.price || 0))}
                          </div>
                        </div>

                        <Button
                          size="small"
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => addComboToCart(combo)}
                        >
                          {t("dashboard.menu.combo.actions.add_combo", {
                            defaultValue: "Thêm",
                          })}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>
        )}

        {/* Cart summary */}
        {cart.length > 0 && (
          <Col xs={24}>
            <Card
              size="small"
              style={{
                borderRadius: 10,
                background: "linear-gradient(135deg, rgba(255,107,59,0.06) 0%, rgba(255,107,59,0.02) 100%)",
                border: "1px solid rgba(255,107,59,0.25)",
              }}
              styles={{ body: { padding: "12px 16px" } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 13 }}>
                    {t("staff.orders.modal.cart_summary", { defaultValue: "Tóm tắt giỏ hàng" })}
                  </Text>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cart.map((row) => (
                      <Tag key={row.item.id} color="orange" style={{ fontSize: 11, margin: 0 }}>
                        {row.item.name} x{row.quantity}
                      </Tag>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {t("staff.orders.modal.total_estimate", { defaultValue: "Ước tính" })}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>
                    {formatVND(cartTotal)}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </Modal>
  );
}
