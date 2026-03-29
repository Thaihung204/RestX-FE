import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { MinusOutlined, PlusOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Modal, Row, Select, Space, Tabs, Typography } from "antd";

const { Text } = Typography;

interface OrderOption {
  id: string;
  reference: string;
  tableName: string;
}

interface AddItemProps {
  isOpen: boolean;
  isMobile: boolean;
  mode: "light" | "dark";
  selectedOrderIdForAdd: string;
  setSelectedOrderIdForAdd: (value: string) => void;
  menuCategories: MenuCategory[];
  activeMenuCategory: string;
  setActiveMenuCategory: (value: string) => void;
  cart: { item: DishItem; quantity: number }[];
  cartTotal: number;
  orders: OrderOption[];
  onClose: () => void;
  onAddToCart: (item: DishItem) => void;
  onUpdateCartQuantity: (itemId: string, delta: number) => void;
  onSubmit: () => void;
  labels: {
    title: string;
    orderPlaceholder: string;
    table: string;
    cart: string;
    total: string;
    noItems: string;
    addItem: string;
  };
}

export default function AddItem({
  isOpen,
  isMobile,
  mode,
  selectedOrderIdForAdd,
  setSelectedOrderIdForAdd,
  menuCategories,
  activeMenuCategory,
  setActiveMenuCategory,
  cart,
  cartTotal,
  orders,
  onClose,
  onAddToCart,
  onUpdateCartQuantity,
  onSubmit,
  labels,
}: AddItemProps) {
  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          <span>{labels.title}</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      maskClosable={false}
      keyboard={false}
      footer={null}
      width={isMobile ? "95%" : 900}
      centered
      style={{
        backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
        border: mode === "dark" ? "1px solid rgba(255, 56, 11, 0.2)" : "1px solid #E5E7EB",
        borderRadius: 12,
      }}
      styles={{
        header: {
          backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
          borderBottom: mode === "dark" ? "1px solid rgba(255, 56, 11, 0.2)" : "1px solid #E5E7EB",
          borderRadius: "12px 12px 0 0",
          padding: "20px 28px",
          position: "relative",
          paddingRight: "56px",
        },
        body: {
          padding: isMobile ? 20 : 28,
          maxHeight: isMobile ? "80vh" : "auto",
          overflowY: "auto",
          backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
        },
        footer: {
          borderRadius: "0 0 12px 12px",
        },
        mask: {
          background: mode === "dark" ? "rgba(0, 0, 0, 0.92)" : "rgba(0, 0, 0, 0.45)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          filter: "none",
        },
      }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <div style={{ marginBottom: 16 }}>
            <Select
              placeholder={labels.orderPlaceholder}
              size={isMobile ? "middle" : "large"}
              style={{ width: "100%" }}
              value={selectedOrderIdForAdd || undefined}
              onChange={setSelectedOrderIdForAdd}
              options={orders.map((order) => ({
                value: order.id,
                label: `${order.reference} - ${labels.table} ${order.tableName}`,
              }))}
            />
          </div>

          <Tabs
            activeKey={activeMenuCategory}
            onChange={setActiveMenuCategory}
            size={isMobile ? "small" : "middle"}
            items={menuCategories.map((cat) => ({
              key: cat.categoryId,
              label: cat.categoryName,
            }))}
          />

          <Row gutter={[isMobile ? 8 : 12, isMobile ? 8 : 12]}>
            {menuCategories
              .find((c) => c.categoryId === activeMenuCategory)
              ?.items.map((item) => (
                <Col xs={24} sm={12} key={item.id}>
                  <Card
                    hoverable
                    size="small"
                    style={{ borderRadius: isMobile ? 12 : 16, overflow: "hidden" }}
                    styles={{ body: { padding: isMobile ? 10 : 12 } }}
                    onClick={() => onAddToCart(item)}>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ display: "block", fontSize: isMobile ? 13 : 14 }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: isMobile ? 12 : 14 }}>{item.price.toLocaleString("vi-VN")}đ</Text>
                      </div>
                      <PlusOutlined style={{ fontSize: isMobile ? 14 : 16 }} />
                    </div>
                  </Card>
                </Col>
              ))}
          </Row>
        </Col>

        <Col xs={24} md={10}>
          <Card
            title={
              <Space size={isMobile ? 8 : 12}>
                <ShoppingCartOutlined />
                <span style={{ fontSize: isMobile ? 14 : 16 }}>
                  {labels.cart} ({cart.length})
                </span>
              </Space>
            }
            style={{
              borderRadius: 12,
              background: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
              border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: mode === "dark" ? "0 2px 8px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}>
            {cart.length > 0 ? (
              <>
                <div>
                  {cart.map((c, index) => (
                    <div
                      key={c.item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: isMobile ? "8px 0" : "12px 0",
                        borderBottom:
                          index < cart.length - 1
                            ? mode === "dark"
                              ? "1px solid var(--border)"
                              : "1px solid #E5E7EB"
                            : "none",
                        gap: isMobile ? 8 : 12,
                      }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{c.item.name}</div>
                        <div style={{ fontSize: isMobile ? 12 : 14, color: mode === "dark" ? "var(--text-muted)" : "#4F4F4F" }}>
                          {(c.item.price * c.quantity).toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => onUpdateCartQuantity(c.item.id, -1)} />
                        <span style={{ minWidth: 20, textAlign: "center", fontSize: isMobile ? 13 : 14 }}>{c.quantity}</span>
                        <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => onUpdateCartQuantity(c.item.id, 1)} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", margin: isMobile ? "12px 0" : "16px 0" }}>
                  <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{labels.total}</Text>
                  <Text strong style={{ fontSize: isMobile ? 16 : 18, color: "var(--primary)" }}>
                    {cartTotal.toLocaleString("vi-VN")}đ
                  </Text>
                </div>

                <Button
                  type="primary"
                  size={isMobile ? "middle" : "large"}
                  block
                  onClick={onSubmit}
                  style={{
                    borderRadius: 12,
                    height: isMobile ? 44 : 48,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
                    border: "none",
                  }}>
                  {labels.addItem}
                </Button>
              </>
            ) : (
              <Empty
                description={labels.noItems}
                styles={{ image: { opacity: mode === "dark" ? 0.65 : 0.4 } }}
                style={{ color: mode === "dark" ? undefined : "#4F4F4F" }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
}
