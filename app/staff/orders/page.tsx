"use client";

import AddItem from "@/components/staff/orders/AddItem";
import CardTable from "@/components/staff/orders/CardTable";
import OrderDetail from "@/components/staff/orders/OrderDetail";
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
import paymentService from "@/lib/services/paymentService";
import { tableService } from "@/lib/services/tableService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import {
  PlusOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { HubConnectionState } from "@microsoft/signalr";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Typography
} from "antd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const inFlightRef = useRef(false);
  const lastRefreshRef = useRef<number | null>(null);
  const [orderDetailStatuses, setOrderDetailStatuses] = useState<OrderDetailStatus[]>([]);
  const statusValueMapRef = useRef<Record<string, string>>({});
  const tableNameMapRef = useRef<Record<string, string>>({});
  const dishNameMapRef = useRef<Record<string, string>>({});
  const initializedRef = useRef(false);

  const buildStatusValueMap = useCallback((statuses: OrderDetailStatus[]) => {
    return statuses.reduce<Record<string, string>>((acc, status) => {
      const codeKey = status.code?.toLowerCase();
      const nameKey = status.name?.toLowerCase();
      const value = codeKey || status.id;
      if (codeKey) acc[codeKey] = value;
      if (nameKey) acc[nameKey] = value;
      acc[status.id] = value;
      return acc;
    }, {});
  }, []);

  const buildTableNameMap = useCallback((rows: { id: string; name: string }[]) => {
    return rows.reduce<Record<string, string>>((acc, row) => {
      acc[row.id] = row.name;
      return acc;
    }, {});
  }, []);

  const buildDishNameMap = useCallback((categories: MenuCategory[]) => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      category.items?.forEach((item) => {
        acc[item.id] = item.name;
      });
      return acc;
    }, {});
  }, []);

  const normalizeStatusValue = useCallback((status: OrderItemStatus) => {
    const key = status?.toLowerCase?.() ?? String(status ?? "");
    const map = statusValueMapRef.current;
    return map[key] || map[status] || status;
  }, []);

  const mapOrders = useCallback(
    (data: OrderDto[]) => {
      const tableNameMap = tableNameMapRef.current;
      const dishNameMap = dishNameMapRef.current;

      return data.map((order: OrderDto) => {
        const tableName = tableNameMap[order.tableId] || order.tableId;

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
    },
    [normalizeStatusValue],
  );

  const fetchOrders = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await orderService.getAllOrders();
      setOrders(mapOrders(data ?? []));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      inFlightRef.current = false;
    }
  }, [mapOrders]);

  const refreshOrders = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (!force && lastRefreshRef.current && now - lastRefreshRef.current < 2000) return;
      lastRefreshRef.current = now;
      await fetchOrders();
    },
    [fetchOrders],
  );

  const loadInitialData = useCallback(async () => {
    if (inFlightRef.current || initializedRef.current) return;
    inFlightRef.current = true;
    initializedRef.current = true;
    try {
      const [statusData, tableData, menuData, orderData] = await Promise.all([
        orderDetailStatusService.getAllStatuses(),
        tableService.getAllTables(),
        menuService.getMenu(),
        orderService.getAllOrders(),
      ]);

      const safeStatuses = statusData ?? [];
      const safeMenu = menuData ?? [];
      const mappedTables = (tableData ?? []).map((row) => ({
        id: row.id,
        name: `${row.code}`,
      }));

      setOrderDetailStatuses(safeStatuses);
      setTables(mappedTables);
      setMenuCategories(safeMenu);

      statusValueMapRef.current = buildStatusValueMap(safeStatuses);
      tableNameMapRef.current = buildTableNameMap(mappedTables);
      dishNameMapRef.current = buildDishNameMap(safeMenu);

      setOrders(mapOrders(orderData ?? []));
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      inFlightRef.current = false;
    }
  }, [buildDishNameMap, buildStatusValueMap, buildTableNameMap, mapOrders]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


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

  const orderStatusStyleMap: Record<
    OrderStatusUi,
    { bg: string; border: string; }
  > = {
    pending: {
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
    confirmed: {
      bg: "#EFF6FF",
      border: "#BFDBFE",
    },
    serving: {
      bg: "#FAF5FF",
      border: "#E9D5FF",
    },
    completed: {
      bg: "#F0FDF4",
      border: "#BBF7D0",
    },
    cancelled: {
      bg: "#FEF2F2",
      border: "#FECACA",
    }
  };

  const [selectedOrderIdForAdd, setSelectedOrderIdForAdd] = useState<string>("");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cart, setCart] = useState<{ item: DishItem; quantity: number }[]>([]);
  const [activeMenuCategory, setActiveMenuCategory] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [isUpdatingDetailStatus, setIsUpdatingDetailStatus] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (!activeMenuCategory && menuCategories.length > 0) {
      setActiveMenuCategory(menuCategories[0].categoryId);
    }
  }, [menuCategories, activeMenuCategory]);

  useEffect(() => {
    if (!tenant?.id) return;

    const tenantId = tenant.id;
    let isMounted = true;

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOrderChange = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId = payload?.tenantId || payload?.order?.tenantId;
      if (changedTenantId && changedTenantId !== tenantId) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isMounted) return;
        refreshOrders();
      }, 300);
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
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((event) =>
        orderSignalRService.off(event, handleOrderChange),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => {});
    };
  }, [tenant?.id, refreshOrders]);

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

  const tableCodeMap = useMemo(() => {
    return tables.reduce<Record<string, string>>((acc, table) => {
      acc[table.id] = table.name;
      return acc;
    }, {});
  }, [tables]);

  const groupedOrders = useMemo(() => {
    return filteredOrders.reduce<Record<string, Order[]>>((acc, order) => {
      const key = order.tableId || "unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {});
  }, [filteredOrders]);

  useEffect(() => {
    if (!selectedOrderForDetail) return;
    const latestOrder = orders.find((order) => order.id === selectedOrderForDetail.id);
    if (latestOrder) {
      setSelectedOrderForDetail(latestOrder);
    }
  }, [orders, selectedOrderForDetail]);

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

    const targetOrder = orders.find((o) => o.id === selectedOrderIdForAdd);
    if (!targetOrder?.raw) {
      message.error(t("staff.orders.messages.order_create_failed"));
      return;
    }

    try {
      const payload: OrderRequestDto = {
        tableId: targetOrder.raw.tableId,
        customerId:
          targetOrder.raw.customerId ||
          "00000000-0000-0000-0000-000000000000",
        orderStatusId: targetOrder.raw.orderStatusId,
        paymentStatusId: targetOrder.raw.paymentStatusId,
        reservationId: targetOrder.raw.reservationId ?? null,
        discountAmount: targetOrder.raw.discountAmount ?? 0,
        taxAmount: targetOrder.raw.taxAmount ?? 0,
        serviceCharge: targetOrder.raw.serviceCharge ?? 0,
        tableIds: targetOrder.raw.tableIds,
        orderDetails: [
          ...(targetOrder.raw.orderDetails ?? []).map((d) => ({
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
      refreshOrders();
    } catch (error) {
      console.error("Update order failed:", error);
      message.error(t("staff.orders.messages.order_create_failed"));
    }
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setCashReceived(order.total);
    setPaymentMethod("cash");
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    setIsProcessingPayment(true);
    try {
      if (paymentMethod === "cash") {
        if (cashReceived < selectedOrder.total) {
          message.error(t("staff.orders.payment.messages.cash_insufficient"));
          return;
        }

        await paymentService.payByCash(selectedOrder.id, cashReceived);
        message.success(t("staff.orders.payment.messages.cash_success"));
      } else {
        const response = await paymentService.createPaymentLink(selectedOrder.id);
        if (response.checkoutUrl) {
          window.open(response.checkoutUrl, "_blank", "noopener,noreferrer");
        }
        message.success(t("staff.orders.payment.messages.link_created"));
      }

      setIsPaymentModalOpen(false);
      setSelectedOrder(null);
      refreshOrders();
    } catch (error) {
      console.error("Payment failed:", error);
      message.error(t("staff.orders.payment.messages.payment_failed"));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const paymentOptions: Array<{ id: "cash" | "bank"; label: string }> = [
    { id: "cash", label: t("staff.orders.payment.methods.cash") },
    { id: "bank", label: t("staff.orders.payment.methods.bank") },
  ];

  const orderStatusOptions = [
    { value: 0, label: t("staff.orders.status.pending"), className: "order-status-option" },
    { value: 1, label: t("staff.orders.status.confirmed"), className: "order-status-option" },
    { value: 2, label: t("staff.orders.status.serving"), className: "order-status-option" },
    { value: 3, label: t("staff.orders.status.completed"), className: "order-status-option" },
    { value: 4, label: t("staff.orders.status.cancelled"), className: "order-status-option" },
  ];

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
      <div style={{ marginTop: isMobile ? 8 : 12 }}>
        {Object.keys(groupedOrders).length > 0 ? (
          Object.entries(groupedOrders).map(([tableId, tableOrders]) => {
            const tableCode = tableCodeMap[tableId] || tableOrders[0]?.tableName || tableId;
            return (
              <CardTable
                key={tableId}
                tableCode={tableCode}
                tableOrders={tableOrders}
                mode={mode}
                isMobile={isMobile}
                isUpdatingOrderStatus={isUpdatingOrderStatus}
                orderStatusOptions={orderStatusOptions}
                orderStatusStyleMap={orderStatusStyleMap}
                tableLabel={t("staff.orders.order.table")}
                onOpenDetail={(order) => {
                  setSelectedOrderForDetail(order);
                  setIsOrderDetailModalOpen(true);
                }}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            );
          })
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
      </div>


      {/* Order Detail Modal */}
      <OrderDetail
        selectedOrderForDetail={selectedOrderForDetail}
        isOrderDetailModalOpen={isOrderDetailModalOpen}
        isMobile={isMobile}
        mode={mode}
        isUpdatingOrderStatus={isUpdatingOrderStatus}
        isUpdatingDetailStatus={isUpdatingDetailStatus}
        normalizeStatusValue={normalizeStatusValue}
        statusOptions={statusOptions}
        orderStatusOptions={orderStatusOptions}
        totalLabel={t("staff.orders.payment.modal.total_label")}
        emptyLabel={t("staff.orders.empty")}
        // addItemLabel={t("staff.orders.modal.add_item")}
        paymentLabel="Thanh toán"
        statusLabel="Status"
        onClose={() => {
          setIsOrderDetailModalOpen(false);
          setSelectedOrderForDetail(null);
        }}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdateDetailStatus={handleUpdateDetailStatus}
        onOpenPayment={(order) => {
          setIsOrderDetailModalOpen(false);
          openPaymentModal(order);
        }}
        onAddItem={(orderId) => {
          setIsOrderDetailModalOpen(false);
          setSelectedOrderIdForAdd(orderId);
          setIsAddItemModalOpen(true);
        }}
      />

      {/* Payment Modal */}
      <Modal
        title={
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {t("staff.orders.payment.modal.title")}
          </span>
        }
        open={isPaymentModalOpen}
        onCancel={() => {
          setIsPaymentModalOpen(false);
          setSelectedOrder(null);
          setCashReceived(0);
        }}
        footer={null}
        centered
        width={480}
        styles={{ body: { padding: "20px 24px 32px" } }}>
        {selectedOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                padding: 16,
                background: "var(--primary-5, #f0f7ff)",
                borderRadius: 12,
                border: "1px solid var(--primary-20, #bae7ff)",
              }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}>
                <div>
                  <Text type="secondary">
                    {t("staff.orders.payment.modal.order_label")}
                  </Text>
                  <Text strong style={{ display: "block", fontSize: 16 }}>
                    {selectedOrder.reference}
                  </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text type="secondary">
                    {t("staff.orders.payment.modal.total_label")}
                  </Text>
                  <Text
                    strong
                    style={{ display: "block", fontSize: 20, color: "var(--primary)" }}>
                    {selectedOrder.total.toLocaleString("vi-VN")}đ
                  </Text>
                </div>
              </div>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                {t("staff.orders.payment.modal.method_label")}
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}>
                {paymentOptions.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      padding: 12,
                      textAlign: "center",
                      borderRadius: 10,
                      cursor: "pointer",
                      border:
                        paymentMethod === method.id
                          ? "2px solid var(--primary)"
                          : "1px solid #E5E7EB",
                      background: paymentMethod === method.id ? "#fff" : "#FAFAFA",
                      transition: "all 0.2s",
                    }}>
                    <Text strong>{method.label}</Text>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div>
                <Text strong>{t("staff.orders.payment.modal.cash_label")}</Text>
                <InputNumber
                  autoFocus
                  value={cashReceived}
                  onChange={(value) => setCashReceived(value || 0)}
                  min={0}
                  size="large"
                  style={{ width: "100%", marginTop: 8, fontSize: 18, fontWeight: 600 }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value?.replace(/,/g, "") || 0)}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}>
                  {[ 50000, 100000, 200000, 500000].map((amount) => (
                    <Button
                      key={amount}
                      size="small"
                      onClick={() => setCashReceived(amount)}
                      style={{ borderRadius: 6 }}>
                      {amount.toLocaleString("vi-VN")}
                    </Button>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 20,
                    padding: 12,
                    borderRadius: 8,
                    background:
                      cashReceived >= selectedOrder.total ? "#F6FFED" : "#FFF1F0",
                    textAlign: "center",
                  }}>
                  {cashReceived < selectedOrder.total ? (
                    <Text type="danger" strong style={{ fontSize: 16 }}>
                      {t("staff.orders.payment.modal.missing_label")}: {(
                        selectedOrder.total - cashReceived
                      ).toLocaleString("vi-VN")}đ
                    </Text>
                  ) : (
                    <div>
                      <div style={{ color: "#52C41A", fontSize: 14 }}>
                        {t("staff.orders.payment.modal.change_label")}
                      </div>
                      <div
                        style={{ color: "#52C41A", fontSize: 24, fontWeight: 700 }}>
                        {(cashReceived - selectedOrder.total).toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              type="primary"
              size="large"
              loading={isProcessingPayment}
              onClick={handlePayment}
              disabled={paymentMethod === "cash" && cashReceived < selectedOrder.total}
              style={{
                width: "100%",
                height: 50,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                marginTop: 8,
                boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
              }}>
              {t("staff.orders.payment.actions.confirm")}
            </Button>
          </div>
        )}
      </Modal>

      {/* Add Item To Existing Order Modal */}
      <AddItem
        isOpen={isAddItemModalOpen}
        isMobile={isMobile}
        mode={mode}
        selectedOrderIdForAdd={selectedOrderIdForAdd}
        setSelectedOrderIdForAdd={setSelectedOrderIdForAdd}
        menuCategories={menuCategories}
        activeMenuCategory={activeMenuCategory}
        setActiveMenuCategory={setActiveMenuCategory}
        cart={cart}
        cartTotal={cartTotal}
        orders={orders.map((order) => ({
          id: order.id,
          reference: order.reference,
          tableName: order.tableName,
        }))}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setCart([]);
          setSelectedOrderIdForAdd("");
        }}
        onAddToCart={addToCart}
        onUpdateCartQuantity={updateCartQuantity}
        onSubmit={handleAddItemsToOrder}
        labels={{
          title: t("staff.orders.modal.add_item"),
          orderPlaceholder: "",
          table: t("staff.orders.order.table"),
          cart: t("staff.orders.modal.cart"),
          total: t("staff.orders.order.total"),
          noItems: t("staff.orders.modal.no_items"),
          addItem: t("staff.orders.modal.add_item"),
        }}
      />

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
