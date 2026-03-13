"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import menuService from "@/lib/services/menuService";
import orderDetailStatusService, {
  OrderDetailStatus,
} from "@/lib/services/orderDetailStatusService";
import orderService, {
  OrderDto,
  OrderRequestDto,
} from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import { tableService } from "@/lib/services/tableService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import {
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { HubConnectionState } from "@microsoft/signalr";
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
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../../theme/AntdProvider";

const { Text } = Typography;
const { Search } = Input;

type OrderItemStatus = string;

type OrderStatusId = 0 | 1 | 2 | 3 | 4;

type OrderStatusUi =
  | "pending"
  | "confirmed"
  | "serving"
  | "completed"
  | "cancelled";

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
  detailItems: OrderItem[];
  createdAt: string;
  total: number;
  notes?: string;
  orderStatusId: OrderStatusId;
  orderStatus: OrderStatusUi;
  raw?: OrderDto;
}

const mapOrderStatus = (statusId?: number | null): OrderStatusUi => {
  switch (statusId) {
    case 1:
      return "confirmed";
    case 2:
      return "serving";
    case 3:
      return "completed";
    case 4:
      return "cancelled";
    case 0:
    default:
      return "pending";
  }
};

const aggregateOrderItems = (items: OrderItem[]): OrderItem[] => {
  const aggregated = new Map<string, OrderItem>();

  items.forEach((item) => {
    const existing = aggregated.get(item.dishId);
    if (existing) {
      aggregated.set(item.dishId, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
      return;
    }

    aggregated.set(item.dishId, { ...item });
  });

  return Array.from(aggregated.values());
};

// Status configs will be created inside the component to use translations

export default function OrderManagement() {
  const { message } = App.useApp();
  const { mode } = useThemeMode();
  const { t } = useTranslation();
  const { tenant } = useTenant();
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

  const fetchOrders = useCallback(async () => {
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

        const items: OrderItem[] = (order.orderDetails ?? []).map(
          (detail, index) => {
            const statusValue = detail.status || "";
            const normalizedStatus = normalizeStatusValue(statusValue);
            return {
              id: detail.id || `${order.id || "order"}-${index}`,
              dishId: detail.dishId,
              name: dishNameMap[detail.dishId] || detail.dishId,
              quantity: detail.quantity ?? 0,
              price: 0,
              note: detail.note || undefined,
              status: normalizedStatus,
            };
          },
        );

        const summaryItems = aggregateOrderItems(items);

        const status = mapOrderStatus(order.orderStatusId);

        return {
          id: order.id || "",
          reference:
            order.reference && order.reference.trim().length > 0
              ? order.reference
              : order.id || "",
          tableId: order.tableId,
          tableName,
          items: summaryItems,
          detailItems: items,
          createdAt: order.completedAt
            ? new Date(order.completedAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          total: Number(order.totalAmount || 0),
          notes: undefined,
          orderStatusId: (order.orderStatusId ?? 0) as OrderStatusId,
          orderStatus: status,
          raw: order,
        };
      });

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, [tables]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, ordersRefreshKey]);

  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [orderDetailStatuses, setOrderDetailStatuses] = useState<OrderDetailStatus[]>([]);

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

  useEffect(() => {
    const fetchOrderDetailStatuses = async () => {
      try {
        const data = await orderDetailStatusService.getAllStatuses();
        setOrderDetailStatuses(data ?? []);
      } catch (error) {
        console.error("Failed to fetch order detail statuses:", error);
        setOrderDetailStatuses([]);
      }
    };

    fetchOrderDetailStatuses();
  }, []);

  const statusNameMap = orderDetailStatuses.reduce<Record<string, string>>(
    (acc, status) => {
      const codeKey = status.code?.toLowerCase();
      const nameKey = status.name?.toLowerCase();
      if (codeKey) acc[codeKey] = status.name;
      if (nameKey) acc[nameKey] = status.name;
      acc[status.id] = status.name;
      return acc;
    },
    {},
  );

  const statusValueMap = orderDetailStatuses.reduce<Record<string, string>>(
    (acc, status) => {
      const codeKey = status.code?.toLowerCase();
      const nameKey = status.name?.toLowerCase();
      const value = codeKey || status.id;
      if (codeKey) acc[codeKey] = value;
      if (nameKey) acc[nameKey] = value;
      acc[status.id] = value;
      return acc;
    },
    {},
  );

  const normalizeStatusValue = (status: OrderItemStatus) => {
    const key = status?.toLowerCase?.() ?? String(status ?? "");
    return statusValueMap[key] || statusValueMap[status] || status;
  };

  const getStatusLabel = (status: OrderItemStatus) => {
    const key = status?.toLowerCase?.() ?? String(status ?? "");
    return statusNameMap[key] || statusNameMap[status] || status;
  };

  const statusOptions = orderDetailStatuses.map((status) => ({
    value: status.code?.toLowerCase() || status.id,
    label: (
      <Space size={8}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: status.color || "#8c8c8c",
            display: "inline-block",
          }}
        />
        <span style={{ color: status.color || "inherit" }}>{status.name}</span>
      </Space>
    ),
    className: "order-detail-status-option",
  }));

  const [selectedOrderIdForAdd, setSelectedOrderIdForAdd] = useState<string>("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState<{ item: DishItem; quantity: number }[]>([]);
  const [activeMenuCategory, setActiveMenuCategory] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [isUpdatingDetailStatus, setIsUpdatingDetailStatus] = useState(false);

  useEffect(() => {
    if (!activeMenuCategory && menuCategories.length > 0) {
      setActiveMenuCategory(menuCategories[0].categoryId);
    }
  }, [menuCategories, activeMenuCategory]);

  useEffect(() => {
    if (!tenant?.id) return;

    const tenantId = tenant.id;
    let isMounted = true;

    const handleOrderChange = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId = payload?.tenantId || payload?.order?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;
      fetchOrders();
    };

    const events = ["orders.created", "orders.updated", "orders.deleted"];

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenantId);
          events.forEach((event) =>
            orderSignalRService.on(event, handleOrderChange),
          );
        }
      } catch (error) {
        console.error("SignalR: Setup failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      events.forEach((event) =>
        orderSignalRService.off(event, handleOrderChange),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => {});
    };
  }, [tenant?.id, fetchOrders]);

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



  const handleUpdateOrderStatus = async (
    orderId: string,
    statusId: OrderStatusId,
  ) => {
    const previousOrders = orders;
    const nextStatus = mapOrderStatus(statusId);

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, orderStatusId: statusId, orderStatus: nextStatus }
          : order,
      ),
    );

    setIsUpdatingOrderStatus(true);
    try {
      await orderService.updateOrderStatus(orderId, statusId);
      message.success(t("staff.orders.messages.order_status_updated"));
    } catch (error) {
      console.error("Failed to update order status:", error);
      setOrders(previousOrders);
      message.error(t("staff.orders.messages.order_status_update_failed"));
    } finally {
      setIsUpdatingOrderStatus(false);
    }
  };

  const handleUpdateDetailStatus = async (
    orderId: string,
    detailId: string,
    statusValue: string,
  ) => {
    const previousOrders = orders;
    const normalizedValue = normalizeStatusValue(statusValue);
    const matchedStatus = orderDetailStatuses.find(
      (status) =>
        status.id === normalizedValue ||
        status.code?.toLowerCase() === normalizedValue.toLowerCase(),
    );

    if (!matchedStatus) {
      message.error(t("staff.orders.messages.order_status_update_failed"));
      return;
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          detailItems: order.detailItems.map((item) =>
            item.id === detailId
              ? { ...item, status: normalizedValue }
              : item,
          ),
          items: order.items.map((item) =>
            item.id === detailId
              ? { ...item, status: normalizedValue }
              : item,
          ),
        };
      }),
    );

    setIsUpdatingDetailStatus(true);
    try {
      await orderService.updateOrderDetailStatus(
        orderId,
        detailId,
        Number(matchedStatus.id),
      );
      message.success(t("staff.orders.messages.status_updated"));
    } catch (error) {
      console.error("Failed to update order detail status:", error);
      setOrders(previousOrders);
      message.error(t("staff.orders.messages.order_status_update_failed"));
    } finally {
      setIsUpdatingDetailStatus(false);
    }
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
    const pendingItems = order.items.filter((i) => {
      const statusKey = (i.status || "").toLowerCase();
      const statusLabel = getStatusLabel(statusKey);
      const normalized = statusLabel.toLowerCase();
      return normalized === "pending" || normalized === "preparing";
    }).length;

    return (
      <div>
        <Card
          style={{
            borderRadius: 12,
            border:
              mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid #E5E5E5",
            marginBottom: isMobile ? 12 : 16,
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
                      gap: 8,
                      flexWrap: "wrap",
                    }}>
                    <Text
                      strong
                      style={{ fontSize: isMobile ? 15 : 17, fontWeight: 500 }}>
                      {t("staff.orders.order.table")} {order.tableName}
                    </Text>
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onMouseDown={(event) => event.stopPropagation()}>
                      <Select
                        value={order.orderStatusId}
                        size="small"
                        style={{ minWidth: 130 }}
                        className="order-status-select"
                        onChange={(value) =>
                          handleUpdateOrderStatus(
                            order.id,
                            value as OrderStatusId,
                          )
                        }
                        disabled={isUpdatingOrderStatus}
                        options={[
                          {
                            value: 0,
                            label: t("staff.orders.status.pending"),
                            className: "order-status-option",
                          },
                          {
                            value: 1,
                            label: t("staff.orders.status.confirmed"),
                            className: "order-status-option",
                          },
                          {
                            value: 2,
                            label: t("staff.orders.status.serving"),
                            className: "order-status-option",
                          },
                          {
                            value: 3,
                            label: t("staff.orders.status.completed"),
                            className: "order-status-option",
                          },
                          {
                            value: 4,
                            label: t("staff.orders.status.cancelled"),
                            className: "order-status-option",
                          },
                        ]}
                      />
                    </div>
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

              <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                {order.detailItems.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {order.detailItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: isMobile ? "6px 0" : "8px 0",
                          borderBottom:
                            mode === "dark"
                              ? "1px dashed rgba(255, 255, 255, 0.08)"
                              : "1px dashed #EDEDED",
                        }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{
                              fontSize: isMobile ? 13 : 14,
                              fontWeight: 500,
                              display: "block",
                            }}>
                            {item.name}
                          </Text>
                          {item.note && (
                            <Text
                              style={{
                                fontSize: isMobile ? 11 : 12,
                                color:
                                  mode === "dark"
                                    ? "rgba(255, 255, 255, 0.45)"
                                    : "rgba(0, 0, 0, 0.45)",
                                display: "block",
                              }}>
                              {item.note}
                            </Text>
                          )}
                        </div>
                        <Space size={8} style={{ alignItems: "center" }}>
                          <Tag
                            style={{
                              margin: 0,
                              borderRadius: 8,
                              fontSize: isMobile ? 12 : 13,
                            }}>
                            x{item.quantity}
                          </Tag>
                          <Select
                            value={normalizeStatusValue(item.status)}
                            size="small"
                            style={{ minWidth: isMobile ? 110 : 130 }}
                            onChange={(value) =>
                              handleUpdateDetailStatus(
                                order.id,
                                item.id,
                                String(value),
                              )
                            }
                            disabled={isUpdatingDetailStatus}
                            options={statusOptions}
                          />
                        </Space>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text
                    style={{
                      fontSize: isMobile ? 12 : 13,
                      color:
                        mode === "dark"
                          ? "rgba(255, 255, 255, 0.5)"
                          : "rgba(0, 0, 0, 0.45)",
                    }}>
                    {t("staff.orders.empty")}
                  </Text>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: isMobile ? 8 : 16,
                  flexWrap: "wrap",
                }}>
                <Text
                  strong
                  style={{ color: "var(--primary)", fontSize: isMobile ? 15 : 16 }}>
                  {order.total.toLocaleString("vi-VN")}đ
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => {
                      setSelectedOrderIdForAdd(order.id);
                      setIsAddItemModalOpen(true);
                    }}
                    style={{
                      borderRadius: 6,
                      minWidth: isMobile ? 110 : 130,
                      height: 24,
                      padding: "0 8px",
                    }}>
                    {t("staff.orders.modal.add_item")}
                  </Button>
                </div>
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
                background: "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
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
                        color: "var(--primary)",
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
                        "linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)",
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
        .order-detail-status-option,
        .order-status-option {
          padding: 2px 3px !important;
          border-bottom: 1px solid ${mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "#EDEDED"};
          display: flex;
          align-items: center;
        }
        .order-detail-status-option:last-child,
        .order-status-option:last-child {
          border-bottom: none;
        }
        .order-detail-status-option.ant-select-item-option-selected,
        .order-status-option.ant-select-item-option-selected {
          background: ${mode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.03)"};
        }
        .order-status-select .ant-select-selector {
          border-radius: 6px !important;
        }
      `}</style>
    </div>
  );
}
