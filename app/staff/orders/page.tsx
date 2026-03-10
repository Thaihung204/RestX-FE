"use client";

import menuService from "@/lib/services/menuService";
import orderService, { OrderDto, OrderRequestDto } from "@/lib/services/orderService";
import { tableService } from "@/lib/services/tableService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import {
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../../theme/AntdProvider";

const { Text } = Typography;
const { Search } = Input;

type OrderItemStatus = "pending" | "preparing" | "ready" | "served";

interface OrderItem {
  id: string;
  dishId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  status: OrderItemStatus;
}

interface Order {
  id: string;
  reference: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  createdAt: string;
  total: number;
  notes?: string;
  raw?: OrderDto;
}

const mapOrderItemStatus = (status?: string | null): OrderItemStatus => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "served" || normalized === "completed") return "served";
  if (normalized === "ready") return "ready";
  if (normalized === "preparing" || normalized === "processing")
    return "preparing";
  return "pending";
};

// Status configs will be created inside the component to use translations

export default function OrderManagement() {
  const { message } = App.useApp();
  const { mode } = useThemeMode();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<{ id: string; name: string }[]>([]);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = await tableService.getAllTables();
        setTables(data.map((row) => ({ id: row.id, name: `${row.code}` })));
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      }
    };
    fetchTables();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getAllOrders();

        const uniqueDishIds = Array.from(
          new Set(
            data
              .flatMap((order) =>
                (order.orderDetails ?? []).map((detail) => detail.dishId),
              )
              .filter(Boolean),
          ),
        );

        const dishNameMap: Record<string, string> = {};
        await Promise.all(
          uniqueDishIds.map(async (dishId) => {
            try {
              const dish = await menuService.getDishById(dishId);
              dishNameMap[dishId] = dish?.name || dishId;
            } catch {
              dishNameMap[dishId] = dishId;
            }
          }),
        );

        const mappedOrders: Order[] = data.map((order: OrderDto) => {
          const tableName =
            tables.find((table) => table.id === order.tableId)?.name ||
            order.tableId;

          const aggregatedItems = new Map<string, OrderItem>();
          (order.orderDetails ?? []).forEach((detail, index) => {
            const status = mapOrderItemStatus(detail.status);
            const key = `${detail.dishId}__${status}`;
            const existing = aggregatedItems.get(key);
            const quantity = detail.quantity ?? 0;

            if (existing) {
              aggregatedItems.set(key, {
                ...existing,
                quantity: existing.quantity + quantity,
                note: existing.note || detail.note || undefined,
              });
              return;
            }

            aggregatedItems.set(key, {
              id: detail.id || `${order.id || "order"}-${index}`,
              dishId: detail.dishId,
              name: dishNameMap[detail.dishId] || detail.dishId,
              quantity,
              price: 0,
              note: detail.note || undefined,
              status,
            });
          });

          const items = Array.from(aggregatedItems.values());

          return {
            id: order.id || "",
            reference:
              order.reference && order.reference.trim().length > 0
                ? order.reference
                : order.id || "",
            tableId: order.tableId,
            tableName,
            items,
            createdAt: order.completedAt
              ? new Date(order.completedAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            total: Number(order.totalAmount || 0),
            notes: undefined,
            raw: order,
          };
        });

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchOrders();
  }, [tables, ordersRefreshKey]);

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await menuService.getMenu();
        setMenuCategories(data ?? []);
      } catch (error) {
        console.error("Failed to fetch menu:", error);
        setMenuCategories([]);
      }
    };

    fetchMenu();
  }, []);

    const itemStatusConfig: Record<
    OrderItemStatus,
    { color: string; text: string }
  > = {
    pending: { color: "orange", text: t("common.status.pending") },
    preparing: { color: "blue", text: t("common.status.preparing") },
    ready: { color: "green", text: t("common.status.ready") },
    served: { color: "default", text: t("common.status.served") },
  };
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState<{ item: DishItem; quantity: number }[]>([]);
  const [selectedOrderIdForAdd, setSelectedOrderIdForAdd] = useState<string>("");
  const [activeMenuCategory, setActiveMenuCategory] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    if (!activeMenuCategory && menuCategories.length > 0) {
      setActiveMenuCategory(menuCategories[0].categoryId);
    }
  }, [menuCategories, activeMenuCategory]);

  // Check viewport
  React.useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 576); // xs breakpoint
      setIsTablet(width >= 576 && width < 992); // sm to md breakpoint
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.tableName.toLowerCase().includes(searchText.toLowerCase()) ||
      order.reference.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });


  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleUpdateItemStatus = (
    orderId: string,
    itemId: string,
    newStatus: OrderItemStatus,
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedItems = order.items.map((item) =>
            item.id === itemId ? { ...item, status: newStatus } : item,
          );
          return { ...order, items: updatedItems };
        }
        return order;
      }),
    );
    message.success(t("staff.orders.messages.status_updated"));
  };

  const addToCart = (item: DishItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) =>
          c.item.id === itemId
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c,
        )
        .filter((c) => c.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const handleAddItemsToOrder = async () => {
    if (!selectedOrderIdForAdd || cart.length === 0) {
      message.error(t("staff.orders.messages.select_table_and_items"));
      return;
    }

    const selectedOrder = orders.find((o) => o.id === selectedOrderIdForAdd);
    if (!selectedOrder?.raw) {
      message.error(t("staff.orders.messages.order_create_failed"));
      return;
    }

    try {
      const payload: OrderRequestDto = {
        tableId: selectedOrder.raw.tableId,
        customerId:
          selectedOrder.raw.customerId ||
          "00000000-0000-0000-0000-000000000000",
        orderStatusId: selectedOrder.raw.orderStatusId,
        paymentStatusId: selectedOrder.raw.paymentStatusId,
        reservationId: selectedOrder.raw.reservationId ?? null,
        discountAmount: selectedOrder.raw.discountAmount ?? 0,
        taxAmount: selectedOrder.raw.taxAmount ?? 0,
        serviceCharge: selectedOrder.raw.serviceCharge ?? 0,
        tableIds: selectedOrder.raw.tableIds,
        orderDetails: [
          ...(selectedOrder.raw.orderDetails ?? []).map((d) => ({
            dishId: d.dishId,
            quantity: d.quantity,
            note: d.note ?? undefined,
          })),
          ...cart.map((c) => ({
            dishId: c.item.id,
            quantity: c.quantity,
          })),
        ],
      };

      await orderService.updateOrder(selectedOrderIdForAdd, payload);

      message.success(t("staff.orders.messages.order_created"));
      setIsAddItemModalOpen(false);
      setCart([]);
      setSelectedOrderIdForAdd("");
      setOrdersRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Update order failed:", error);
      message.error(t("staff.orders.messages.order_create_failed"));
    }
  };

  const renderOrderCard = (order: Order) => {
    const pendingItems = order.items.filter(
      (i) => i.status === "pending" || i.status === "preparing",
    ).length;

    return (
      <div>
        <Card
          hoverable
          onClick={() => handleOrderClick(order)}
          style={{
            borderRadius: 12,
            border:
              mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid #E5E5E5",
            marginBottom: isMobile ? 12 : 16,
            cursor: "pointer",
            overflow: "hidden",
            background:
              mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
            boxShadow:
              mode === "dark"
                ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                : "0 2px 8px rgba(0, 0, 0, 0.08)",
            transition: "all 0.3s ease",
          }}
          styles={{ body: { padding: isMobile ? 14 : 20 } }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 8,
            }}>
            <div style={{ flex: 1, minWidth: isMobile ? "100%" : "auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 12,
                  marginBottom: isMobile ? 10 : 12,
                }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                    <Text
                      strong
                      style={{ fontSize: isMobile ? 15 : 17, fontWeight: 500 }}>
                      {t("staff.orders.order.table")} {order.tableName}
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      color:
                        mode === "dark"
                          ? "rgba(255, 255, 255, 0.5)"
                          : "rgba(0, 0, 0, 0.5)",
                      fontWeight: 400,
                    }}>
                    {order.reference} • {order.createdAt}
                  </Text>
                </div>
              </div>

              <div style={{ marginBottom: isMobile ? 10 : 12 }}>
                {order.items.slice(0, isMobile ? 2 : 3).map((item) => (
                  <Tag
                    key={item.id}
                    color={itemStatusConfig[item.status].color}
                    style={{
                      marginBottom: 4,
                      borderRadius: 8,
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 400,
                    }}>
                    {item.name} x{item.quantity}
                  </Tag>
                ))}
                {order.items.length > (isMobile ? 2 : 3) && (
                  <Tag
                    style={{
                      borderRadius: 8,
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 400,
                    }}>
                    +{order.items.length - (isMobile ? 2 : 3)}{" "}
                    {t("staff.orders.order.more_items")}
                  </Tag>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 8 : 16,
                  flexWrap: "wrap",
                }}>
                <Text
                  strong
                  style={{ color: "#FF380B", fontSize: isMobile ? 15 : 16 }}>
                  {order.total.toLocaleString("vi-VN")}đ
                </Text>
                {pendingItems > 0 && (
                  <Badge
                    count={
                      isMobile
                        ? `${pendingItems} ${t("staff.orders.order.not_done")}`
                        : `${pendingItems} ${t("staff.orders.order.items_not_done")}`
                    }
                    style={{
                      backgroundColor:
                        mode === "dark"
                          ? "rgba(255, 56, 11, 0.2)"
                          : "rgba(255, 56, 11, 0.1)",
                      color: "#FF380B",
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 500,
                      border: `1px solid ${mode === "dark" ? "rgba(255, 56, 11, 0.3)" : "rgba(255, 56, 11, 0.2)"}`,
                    }}
                  />
                )}
              </div>
            </div>

          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>

      {/* Search & Filter */}
      <Card
        style={{
          borderRadius: 12,
          border:
            mode === "dark"
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid #E5E5E5",
          marginBottom: isMobile ? 16 : 24,
          background: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
          boxShadow:
            mode === "dark"
              ? "0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
        styles={{ body: { padding: isMobile ? 16 : "20px 28px" } }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={18} lg={18} xl={18}>
            <Search
              placeholder={
                isMobile
                  ? t("staff.orders.search.placeholder")
                  : t("staff.orders.search.placeholder_full")
              }
              allowClear
              size={isMobile ? "middle" : "large"}
              style={{ width: "100%" }}
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={24} md={6} lg={6} xl={6}>
            <Button
              type="primary"
              size={isMobile ? "middle" : "large"}
              icon={<PlusOutlined />}
              onClick={() => setIsAddItemModalOpen(true)}
              block={isMobile || isTablet}
              style={{
                borderRadius: 12,
                height: isMobile ? 40 : 48,
                fontWeight: 600,
                background: "linear-gradient(135deg, #FF380B 0%, #FF6B3B 100%)",
                border: "none",
                width: "100%",
              }}>
              {t("staff.orders.modal.add_item")}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Order List */}
      <Card
        style={{
          borderRadius: 12,
          border:
            mode === "dark"
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid #E5E5E5",
          background: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
          boxShadow:
            mode === "dark"
              ? "0 2px 8px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.08)",
        }}
        styles={{ body: { padding: isMobile ? 16 : 24 } }}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id}>{renderOrderCard(order)}</div>
          ))
        ) : (
          <Empty
            description={t("staff.orders.empty")}
            style={{
              color: mode === "dark" ? undefined : "#4F4F4F",
            }}
            styles={{
              image: {
                opacity: mode === "dark" ? 0.65 : 0.4,
              },
            }}
          />
        )}
      </Card>

      {/* Order Detail Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>
              {t("staff.orders.modal.order_detail")} {selectedOrder?.reference}
            </span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={isMobile ? "95%" : 600}
        centered
        style={{
          backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
          border:
            mode === "dark"
              ? "1px solid rgba(255, 56, 11, 0.2)"
              : "1px solid #E5E7EB",
          borderRadius: 12,
        }}
        styles={{
          body: { padding: isMobile ? 20 : 28 },
          header: {
            backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
            borderBottom:
              mode === "dark"
                ? "1px solid rgba(255, 56, 11, 0.2)"
                : "1px solid #E5E7EB",
            borderRadius: "12px 12px 0 0",
            padding: "20px 28px",
            position: "relative",
            paddingRight: "56px",
          },
          footer: {
            borderRadius: "0 0 12px 12px",
          },
          mask: {
            background:
              mode === "dark" ? "rgba(0, 0, 0, 0.92)" : "rgba(0, 0, 0, 0.45)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            filter: "none",
          },
        }}>
        {selectedOrder && (
          <div>
            {/* Order Info */}
            <Card
              size="small"
              style={{
                borderRadius: 12,
                background:
                  mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                marginBottom: isMobile ? 16 : 20,
                border:
                  mode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid #E5E7EB",
                boxShadow:
                  mode === "dark"
                    ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                    : "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
              styles={{
                body: { padding: isMobile ? "18px 20px" : "24px 28px" },
              }}>
              <Row gutter={[16, 0]}>
                <Col xs={8}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: isMobile ? 11 : 12,
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}>
                    {t("staff.orders.order.table")}
                  </Text>
                  <Text
                    strong
                    style={{ fontSize: isMobile ? 15 : 17, display: "block" }}>
                    {selectedOrder.tableName}
                  </Text>
                </Col>
                <Col xs={8}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: isMobile ? 11 : 12,
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}>
                    {t("staff.orders.order.time")}
                  </Text>
                  <Text
                    strong
                    style={{ fontSize: isMobile ? 15 : 17, display: "block" }}>
                    {selectedOrder.createdAt}
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* Items List */}
            <div>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: isMobile ? "10px 0" : "14px 0",
                    borderBottom:
                      index < selectedOrder.items.length - 1
                        ? mode === "dark"
                          ? "1px solid var(--border)"
                          : "1px solid #E5E7EB"
                        : "none",
                  }}>
                  <div style={{ flex: 1 }}>
                    <Space size={isMobile ? 4 : 8}>
                      <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
                        {item.name}
                      </Text>
                      <Tag style={{ fontSize: isMobile ? 12 : 13 }}>
                        x{item.quantity}
                      </Tag>
                    </Space>
                    {/* price hidden in order details per request */}
                  </div>
                  <Select
                    value={item.status}
                    size="small"
                    style={{ width: isMobile ? 90 : 110 }}
                    onChange={(value) =>
                      handleUpdateItemStatus(selectedOrder.id, item.id, value)
                    }
                    options={[
                      { value: "pending", label: t("common.status.pending") },
                      {
                        value: "preparing",
                        label: t("common.status.preparing"),
                      },
                      { value: "ready", label: t("common.status.ready") },
                      { value: "served", label: t("common.status.served") },
                    ]}
                  />
                </div>
              ))}
            </div>

            <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

            {/* Total */}
            {/* <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
              <Text style={{ fontSize: isMobile ? 14 : 16 }}>
                {t("staff.orders.order.total")}
              </Text>
              <Text
                strong
                style={{ fontSize: isMobile ? 20 : 24, color: "#FF380B" }}>
                {selectedOrder.total.toLocaleString("vi-VN")}đ
              </Text>
            </div> */}

            {/* Actions */}
            <Row gutter={[8, 8]} style={{ marginTop: isMobile ? 16 : 24 }}>

              <Col xs={12} sm={6}>
                <Button
                  icon={<PlusOutlined />}
                  size={isMobile ? "middle" : "large"}
                  block
                  onClick={() => {
                    setSelectedOrderIdForAdd(selectedOrder.id);
                    setIsDetailModalOpen(false);
                    setIsAddItemModalOpen(true);
                  }}
                  style={{ borderRadius: 12 }}>
                  {t("staff.orders.modal.add_item")}
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size={isMobile ? "middle" : "large"}
                  block
                  style={{
                    borderRadius: 12,
                    background: "#52c41a",
                    border: "none",
                  }}>
                  {t("staff.orders.modal.send_to_kitchen")}
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Add Item To Existing Order Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined/>
            <span>{t("staff.orders.modal.add_item")}</span>
          </Space>
        }
        open={isAddItemModalOpen}
        onCancel={() => {
          setIsAddItemModalOpen(false);
          setCart([]);
          setSelectedOrderIdForAdd("");
        }}
        footer={null}
        width={isMobile ? "95%" : 900}
        centered
        style={{
          backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
          border:
            mode === "dark"
              ? "1px solid rgba(255, 56, 11, 0.2)"
              : "1px solid #E5E7EB",
          borderRadius: 12,
        }}
        styles={{
          header: {
            backgroundColor: mode === "dark" ? "#1A1A1A" : "#FFFFFF",
            borderBottom:
              mode === "dark"
                ? "1px solid rgba(255, 56, 11, 0.2)"
                : "1px solid #E5E7EB",
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
            background:
              mode === "dark" ? "rgba(0, 0, 0, 0.92)" : "rgba(0, 0, 0, 0.45)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
            filter: "none",
          },
        }}>
        <Row gutter={[16, 16]}>
          {/* Menu */}
          <Col xs={24} md={14}>
            <div style={{ marginBottom: 16 }}>
              <Select
                placeholder={t("staff.orders.modal.order_detail")}
                size={isMobile ? "middle" : "large"}
                style={{ width: "100%" }}
                value={selectedOrderIdForAdd || undefined}
                onChange={setSelectedOrderIdForAdd}
                options={orders.map((order) => ({
                  value: order.id,
                  label: `${order.reference} - ${t("staff.orders.order.table")} ${order.tableName}`,
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
                      style={{
                        borderRadius: isMobile ? 12 : 16,
                        overflow: "hidden",
                      }}
                      styles={{ body: { padding: isMobile ? 10 : 12 } }}
                      onClick={() => addToCart(item)}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: isMobile ? 8 : 12,
                        }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            strong
                            style={{
                              display: "block",
                              fontSize: isMobile ? 13 : 14,
                            }}>
                            {item.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: isMobile ? 12 : 14,
                            }}>
                            {item.price.toLocaleString("vi-VN")}đ
                          </Text>
                        </div>
                        <PlusOutlined
                          style={{
                            fontSize: isMobile ? 14 : 16,
                          }}
                        />
                      </div>
                    </Card>
                  </Col>
                ))}
            </Row>
          </Col>

          {/* Cart */}
          <Col xs={24} md={10}>
            <Card
              title={
                <Space size={isMobile ? 8 : 12}>
                  <ShoppingCartOutlined />
                  <span style={{ fontSize: isMobile ? 14 : 16 }}>
                    {t("staff.orders.modal.cart")} ({cart.length})
                  </span>
                </Space>
              }
              style={{
                borderRadius: 12,
                background:
                  mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
                border:
                  mode === "dark"
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid #E5E7EB",
                overflow: "hidden",
                boxShadow:
                  mode === "dark"
                    ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                    : "0 2px 8px rgba(0, 0, 0, 0.08)",
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
                          <div
                            style={{
                              fontSize: isMobile ? 13 : 14,
                              fontWeight: 500,
                            }}>
                            {c.item.name}
                          </div>
                          <div
                            style={{
                              fontSize: isMobile ? 12 : 14,
                              color:
                                mode === "dark"
                                  ? "var(--text-muted)"
                                  : "#4F4F4F",
                            }}>
                            {(c.item.price * c.quantity).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<MinusOutlined />}
                            onClick={() => updateCartQuantity(c.item.id, -1)}
                          />
                          <span
                            style={{
                              minWidth: 20,
                              textAlign: "center",
                              fontSize: isMobile ? 13 : 14,
                            }}>
                            {c.quantity}
                          </span>
                          <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => updateCartQuantity(c.item.id, 1)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Divider style={{ margin: isMobile ? "12px 0" : "16px 0" }} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: isMobile ? 12 : 16,
                    }}>
                    <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>
                      {t("staff.orders.order.total")}
                    </Text>
                    <Text
                      strong
                      style={{
                        fontSize: isMobile ? 16 : 18,
                        color: "#FF380B",
                      }}>
                      {cartTotal.toLocaleString("vi-VN")}đ
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    size={isMobile ? "middle" : "large"}
                    block
                    onClick={handleAddItemsToOrder}
                    style={{
                      borderRadius: 12,
                      height: isMobile ? 44 : 48,
                      fontWeight: 600,
                      background:
                        "linear-gradient(135deg, #FF380B 0%, #FF380B 100%)",
                      border: "none",
                    }}>
                    {t("staff.orders.modal.add_item")}
                  </Button>
                </>
              ) : (
                <Empty
                  description={t("staff.orders.modal.no_items")}
                  styles={{
                    image: {
                      opacity: mode === "dark" ? 0.65 : 0.4,
                    },
                  }}
                  style={{
                    color: mode === "dark" ? undefined : "#4F4F4F",
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Modal>

      <style jsx global>{`
        /* Modal border radius */
        .ant-modal-content {
          border-radius: 12px !important;
          overflow: hidden !important;
        }

        /* Modal close button positioning - inside header */
        .ant-modal-close {
          top: 16px !important;
          right: 20px !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 8px !important;
          background: ${mode === "dark"
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.04)"} !important;
          transition: all 0.2s ease !important;
        }
        .ant-modal-close:hover {
          background: ${mode === "dark"
            ? "rgba(255, 56, 11, 0.2)"
            : "rgba(255, 56, 11, 0.15)"} !important;
        }
        .ant-modal-close-x {
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
          color: ${mode === "dark"
            ? "rgba(255, 255, 255, 0.85)"
            : "rgba(0, 0, 0, 0.65)"} !important;
        }
        .ant-modal-close:hover .ant-modal-close-x {
          color: ${mode === "dark" ? "#fff" : "rgba(0, 0, 0, 0.85)"} !important;
        }
      `}</style>
    </div>
  );
}
