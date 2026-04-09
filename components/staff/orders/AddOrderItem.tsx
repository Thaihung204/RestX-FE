import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { Button, Card, Col, Modal, Row, Select, Space, Typography } from "antd";

const { Text } = Typography;

interface OrderOption {
  id: string;
  reference: string;
  tableName: string;
}

interface AddOrderItemProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedOrderIdForAdd: string;
  setSelectedOrderIdForAdd: (value: string) => void;
  orders: OrderOption[];
  menuCategories: MenuCategory[];
  activeMenuCategory: string;
  setActiveMenuCategory: (value: string) => void;
  cart: { item: DishItem; quantity: number }[];
  addToCart: (item: DishItem) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  t: (key: string) => string;
}

export default function AddOrderItem({
  isOpen,
  onClose,
  onConfirm,
  selectedOrderIdForAdd,
  setSelectedOrderIdForAdd,
  orders,
  menuCategories,
  activeMenuCategory,
  setActiveMenuCategory,
  cart,
  addToCart,
  updateCartQuantity,
  t,
}: AddOrderItemProps) {
  const itemQuantityMap = cart.reduce<Record<string, number>>((acc, row) => {
    acc[row.item.id] = row.quantity;
    return acc;
  }, {});

  return (
    <Modal
      title={t("staff.orders.modal.add_item")}
      open={isOpen}
      onCancel={onClose}
      onOk={onConfirm}
      okText={t("staff.orders.modal.add_item")}
      width={820}
      centered>
      <Row gutter={[12, 12]}>
        <Col xs={24}>
          <Select
            placeholder={t("staff.orders.modal.order_detail")}
            size="small"
            style={{ width: "100%", marginBottom: 10 }}
            value={selectedOrderIdForAdd || undefined}
            onChange={setSelectedOrderIdForAdd}
            options={orders.map((order) => ({
              value: order.id,
              label: `${order.reference} - ${t("staff.orders.order.table")} ${order.tableName}`,
            }))}
          />

          <Select
            size="small"
            style={{ width: "100%", marginBottom: 10 }}
            value={activeMenuCategory || undefined}
            onChange={setActiveMenuCategory}
            options={menuCategories.map((c) => ({
              value: c.categoryId,
              label: c.categoryName,
            }))}
          />

          <Row gutter={[12, 12]}>
            {menuCategories
              .find((c) => c.categoryId === activeMenuCategory)
              ?.items.map((item) => {
                const currentQty = itemQuantityMap[item.id] || 0;

                return (
                  <Col xs={24} sm={12} key={item.id}>
                    <Card hoverable size="small">
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
                          <div style={{ fontSize: 12 }}>{item.price.toLocaleString("vi-VN")}đ</div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: 12 }}>
                            {t("staff.orders.modal.cart")}: <strong>{currentQty}</strong>
                          </Text>
                          <Space size={6}>
                            <Button
                              size="small"
                              disabled={currentQty <= 0}
                              onClick={() => updateCartQuantity(item.id, -1)}>
                              -
                            </Button>
                            <Button size="small" type="primary" onClick={() => addToCart(item)}>
                              +
                            </Button>
                          </Space>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
          </Row>
        </Col>
      </Row>
    </Modal>
  );
}
