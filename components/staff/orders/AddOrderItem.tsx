import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Modal, Row, Select, Typography } from "antd";

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
            getPopupContainer={(triggerNode) =>
              triggerNode.parentElement || document.body
            }
            listHeight={220}
            virtual={false}
            styles={{ popup: { root: { overscrollBehavior: "contain" } } }}
            onPopupScroll={(event) => event.stopPropagation()}
            options={orders.map((order) => {
              const tableLabel =
                order.tableCodes && order.tableCodes.length > 0
                  ? order.tableCodes.join(" - ")
                  : order.tableName;

              return {
                value: order.id,
                label: `${order.reference} - ${t("staff.orders.order.table")} ${tableLabel}`,
              };
            })}
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
                    <Card
                      hoverable
                      size="small"
                      styles={{ body: { padding: 10 } }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Text
                            strong
                            style={{
                              fontSize: 13,
                              display: "block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {item.name}
                          </Text>
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--primary)",
                              fontWeight: 600,
                            }}>
                            {item.price.toLocaleString("vi-VN")}đ
                          </div>
                        </div>

                        {currentQty > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              flexShrink: 0,
                            }}>
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
                                minWidth: 18,
                                textAlign: "center",
                                fontSize: 12,
                                fontWeight: 700,
                              }}>
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
        </Col>
      </Row>
    </Modal>
  );
}
