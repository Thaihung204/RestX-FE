"use client";

/**
 * Shared menu picker used by both AddOrderItem and CreateOrderModal.
 * Shows dish categories (with images) + combo section (with images + dish list).
 * Renders +/- controls when an item is already in the cart.
 */

import type { ComboSummaryDto } from "@/lib/services/dishService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { formatVND } from "@/lib/utils/currency";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Row, Select, Typography } from "antd";

const { Text } = Typography;

export type StaffCartRow = {
  item: DishItem;
  quantity: number;
  comboId?: string;
  comboDetails?: { dishName: string; quantity: number }[];
};

interface StaffMenuPickerProps {
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

export default function StaffMenuPicker({
  menuCategories,
  comboItems,
  activeMenuCategory,
  setActiveMenuCategory,
  cart,
  addToCart,
  addComboToCart,
  updateCartQuantity,
  t,
}: StaffMenuPickerProps) {
  const itemQuantityMap = cart.reduce<Record<string, number>>((acc, row) => {
    acc[row.item.id] = row.quantity;
    return acc;
  }, {});

  const activeCategory = menuCategories.find((c) => c.categoryId === activeMenuCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Category selector */}
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
        listHeight={220}
        virtual={false}
        styles={{ popup: { root: { overscrollBehavior: "contain" } } }}
        onPopupScroll={(e) => e.stopPropagation()}
      />

      {/* Dish list */}
      {activeCategory && activeCategory.items.length > 0 ? (
        <Row gutter={[10, 10]}>
          {activeCategory.items.map((item) => {
            const currentQty = itemQuantityMap[item.id] || 0;
            return (
              <Col xs={24} key={item.id}>
                <Card
                  hoverable={currentQty === 0}
                  size="small"
                  styles={{ body: { padding: "10px 12px" } }}
                  style={{
                    borderRadius: 10,
                    border: currentQty > 0 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                    transition: "border-color 0.2s",
                    cursor: currentQty === 0 ? "pointer" : "default",
                  }}
                  onClick={currentQty === 0 ? () => addToCart(item) : undefined}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Dish image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: 44, height: 44, objectFit: "cover",
                          borderRadius: 8, flexShrink: 0,
                          border: "1px solid var(--border)",
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                        background: "var(--surface)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        border: "1px solid var(--border)",
                      }}>
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
                        strong
                        style={{
                          fontSize: 13, display: "block",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </Text>
                      <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginTop: 2 }}>
                        {formatVND(item.price)}
                      </div>
                    </div>

                    {/* +/- or + button */}
                    {currentQty > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <Button
                          size="small" shape="circle" type="text"
                          icon={<MinusOutlined />}
                          onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, -1); }}
                          style={{ border: "1px solid var(--border)", color: "var(--text)", width: 28, height: 28 }}
                        />
                        <Text style={{ minWidth: 20, textAlign: "center", fontSize: 13, fontWeight: 700 }}>
                          {currentQty}
                        </Text>
                        <Button
                          size="small" shape="circle" type="text"
                          icon={<PlusOutlined />}
                          onClick={(e) => { e.stopPropagation(); updateCartQuantity(item.id, 1); }}
                          style={{ border: "1px solid var(--border)", color: "var(--text)", width: 28, height: 28 }}
                        />
                      </div>
                    ) : (
                      <Button
                        size="small" type="primary" shape="circle"
                        icon={<PlusOutlined />}
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
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
          description={t("staff.orders.modal.no_dishes")}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {/* Combo section */}
      {comboItems.length > 0 && (
        <div>
          <Text
            strong
            style={{
              display: "block", fontSize: 13,
              color: "var(--primary)", marginBottom: 8,
            }}
          >
            {t("menu_page.combo_section_title")}
          </Text>
          <Row gutter={[10, 10]}>
            {comboItems.map((combo) => {
              const currentQty = itemQuantityMap[combo.id] || 0;
              return (
                <Col xs={24} key={combo.id}>
                  <Card
                    size="small"
                    styles={{ body: { padding: "10px 12px" } }}
                    style={{
                      borderRadius: 10,
                      border: currentQty > 0 ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      {/* Combo image */}
                      {combo.imageUrl ? (
                        <img
                          src={combo.imageUrl}
                          alt={combo.name}
                          style={{
                            width: 52, height: 52, objectFit: "cover",
                            borderRadius: 8, flexShrink: 0,
                            border: "1px solid var(--border)",
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                          background: "var(--surface)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          border: "1px solid var(--border)",
                        }}>
                          <img
                            src="/images/dishStatus/spicy.png"
                            alt=""
                            style={{ width: 22, height: 22, objectFit: "contain", opacity: 0.25 }}
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <Text strong style={{ fontSize: 13, color: "var(--primary)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{combo.name}</Text>
                            <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginTop: 2 }}>
                              {formatVND(Number(combo.price || 0))}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 3 }}>
                          {(combo.details || []).map((d) => (
                            <Text
                              key={d.id ?? d.dishId}
                              style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}
                            >
                              • {d.dishName || d.dishId} x{d.quantity > 0 ? d.quantity : 1}
                            </Text>
                          ))}
                        </div>
                      </div>

                      {/* +/- or + */}
                      {currentQty > 0 ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <Button
                            size="small" shape="circle" type="text"
                            icon={<MinusOutlined />}
                            onClick={() => updateCartQuantity(combo.id, -1)}
                            style={{ border: "1px solid var(--border)", color: "var(--text)", width: 28, height: 28 }}
                          />
                          <Text style={{ minWidth: 20, textAlign: "center", fontSize: 13, fontWeight: 700 }}>
                            {currentQty}
                          </Text>
                          <Button
                            size="small" shape="circle" type="text"
                            icon={<PlusOutlined />}
                            onClick={() => addComboToCart(combo)}
                            style={{ border: "1px solid var(--border)", color: "var(--text)", width: 28, height: 28 }}
                          />
                        </div>
                      ) : (
                        <Button
                          size="small" type="primary" shape="circle"
                          icon={<PlusOutlined />}
                          onClick={() => addComboToCart(combo)}
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </div>
  );
}
