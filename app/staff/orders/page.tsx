"use client";

import AddOrderItem from "@/components/staff/orders/AddOrderItem";
import CardOrder from "@/components/staff/orders/CardOrder";
import FilterOrder from "@/components/staff/orders/FilterOrder";
import OrderDetailsPopup from "@/components/staff/orders/OrderDetailsPopup";
import PaymentOrder from "@/components/staff/orders/PaymentOrder";
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
import orderStatusService, {
    OrderStatus,
} from "@/lib/services/orderStatusService";
import paymentService from "@/lib/services/paymentService";
import type { DishItem, MenuCategory } from "@/lib/types/menu";
import { HubConnectionState } from "@microsoft/signalr";
import { App, Empty, Space } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../../theme/AntdProvider";

type OrderItemStatus = string;

type OrderStatusId = number;

type OrderStatusUi = string;

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
  customerId?: string;
  items: OrderItem[];
  detailItems: OrderItem[];
  createdAt: string;
  subTotal: number;
  total: number;
  notes?: string;
  orderStatusId: OrderStatusId;
  orderStatus: OrderStatusUi;
  raw?: OrderDto;
  tableSessions?: Array<{
    id?: string;
    tableId?: string;
    tableCode?: string;
  }>;
}

type PaymentOrder = {
  id: string;
  reference: string;
  subTotal: number;
  total: number;
  customerId?: string;
  raw?: {
    paymentStatusId?: number;
  };
};

type OrderForPaymentTrigger = {
  id: string;
  reference: string;
  total: number;
  raw?: {
    customerId?: string;
    paymentStatusId?: number;
  };
};

const mapOrderStatus = (
  statusId: number | null | undefined,
  statuses: OrderStatus[],
): OrderStatusUi => {
  const matched = statuses.find(
    (status) => Number(status.id) === Number(statusId),
  );
  return matched?.code?.toLowerCase() || "pending";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const inFlightRef = useRef(false);
  const lastRefreshRef = useRef<number | null>(null);
  const [orderDetailStatuses, setOrderDetailStatuses] = useState<
    OrderDetailStatus[]
  >([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const statusValueMapRef = useRef<Record<string, string>>({});
  const dishNameMapRef = useRef<Record<string, string>>({});
  const initializedRef = useRef(false);

  const getTodayOrderQuery = useCallback(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return {
      Status: 0,
      From: `${yyyy}-${mm}-${dd}T00:00:00Z`,
      To: `${yyyy}-${mm}-${dd}T23:59:59Z`,
    };
  }, []);

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
      const dishNameMap = dishNameMapRef.current;

      return data.map((order: OrderDto) => {
        const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
        const tableSessions = ((order as any).tableSessions ?? []) as Array<{
          id?: string;
          tableId?: string;
          tableCode?: string;
          table?: { code?: string };
        }>;

        const tableIdFromSession = tableSessions
          .map((s) => s?.tableId)
          .find((id): id is string => !!id && id !== EMPTY_GUID);
        const tableIdFromList = (order.tableIds ?? []).find(
          (id): id is string => !!id && id !== EMPTY_GUID,
        );
        const resolvedTableId =
          (order.tableId && order.tableId !== EMPTY_GUID
            ? order.tableId
            : undefined) ||
          tableIdFromSession ||
          tableIdFromList ||
          "unknown";

        const tableName =
          tableSessions
            .map((s) => s?.tableCode || s?.table?.code)
            .find((code): code is string => !!code) || resolvedTableId;

        const items: OrderItem[] = (order.orderDetails ?? []).map(
          (detail, index) => {
            const statusValue = detail.status || "";
            const normalizedStatus = normalizeStatusValue(statusValue);
            return {
              id: detail.id || `${order.id || "order"}-${index}`,
              dishId: detail.dishId,
              name:
                detail.dishName || dishNameMap[detail.dishId] || detail.dishId,
              quantity: detail.quantity ?? 0,
              price: Number(detail.dishPrice ?? 0),
              note: detail.note || undefined,
              status: normalizedStatus,
            };
          },
        );

        const summaryItems = aggregateOrderItems(items);

        const status = mapOrderStatus(order.orderStatusId, orderStatuses);

        return {
          id: order.id || "",
          reference:
            order.reference && order.reference.trim().length > 0
              ? order.reference
              : order.id || "",
          tableId: resolvedTableId,
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
          subTotal: Number(order.subTotal ?? order.totalAmount ?? 0),
          notes: undefined,
          orderStatusId: (order.orderStatusId ?? 0) as OrderStatusId,
          orderStatus: status,
          raw: order,
          tableSessions: tableSessions.map((session) => ({
            id: session.id,
            tableId: session.tableId,
            tableCode: session.tableCode || session.table?.code,
          })),
        };
      });
    },
    [normalizeStatusValue, orderStatuses],
  );

  const fetchOrders = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const data = await orderService.getAllOrders(getTodayOrderQuery());
      setOrders(mapOrders(data ?? []));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      inFlightRef.current = false;
    }
  }, [getTodayOrderQuery, mapOrders]);

  const refreshOrders = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (
        !force &&
        lastRefreshRef.current &&
        now - lastRefreshRef.current < 2000
      )
        return;
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
      const [statusData, orderStatusData, menuData, orderData] =
        await Promise.all([
          orderDetailStatusService.getAllStatuses(),
          orderStatusService.getAllStatuses(),
          menuService.getMenu(),
          orderService.getAllOrders(getTodayOrderQuery()),
        ]);

      const safeStatuses = statusData ?? [];
      const safeOrderStatuses = orderStatusData ?? [];
      const safeMenu = menuData ?? [];

      setOrderDetailStatuses(safeStatuses);
      setOrderStatuses(safeOrderStatuses);
      setMenuCategories(safeMenu);

      statusValueMapRef.current = buildStatusValueMap(safeStatuses);
      dishNameMapRef.current = buildDishNameMap(safeMenu);

      setOrders(mapOrders(orderData ?? []));
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      inFlightRef.current = false;
    }
  }, [buildDishNameMap, buildStatusValueMap, getTodayOrderQuery, mapOrders]);

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

  const [selectedOrderIdForAdd, setSelectedOrderIdForAdd] =
    useState<string>("");
  const [selectedTableId, setSelectedTableId] = useState<string>("all");
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [cart, setCart] = useState<{ item: DishItem; quantity: number }[]>([]);
  const [activeMenuCategory, setActiveMenuCategory] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [isUpdatingDetailStatus, setIsUpdatingDetailStatus] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] =
    useState<Order | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isOrderPaid = useCallback(
    (raw?: { paymentStatusId?: number; paymentStatus?: number } | null) => {
      return Number(raw?.paymentStatusId ?? raw?.paymentStatus ?? 0) === 1;
    },
    [],
  );

  useEffect(() => {
    if (!activeMenuCategory && menuCategories.length > 0) {
      setActiveMenuCategory(menuCategories[0].categoryId);
    }
  }, [menuCategories, activeMenuCategory]);

  useEffect(() => {
    const payosStatus = searchParams.get("payos");
    if (!payosStatus) return;

    if (payosStatus === "success") {
      message.success(t("staff.orders.payment.messages.payos_return_success"));
      refreshOrders(true);
    } else if (payosStatus === "cancel") {
      message.warning(t("staff.orders.payment.messages.payos_return_cancel"));
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("payos");
    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;

    router.replace(nextUrl);
  }, [searchParams, pathname, router, message, t, refreshOrders]);

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
        if (!isMounted) return;

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.joinTenantGroup(tenantId);
          if (!isMounted) return;

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
      orderSignalRService.leaveTenantGroup(tenantId).catch(() => {});
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
    if (selectedTableId === "all") return true;

    const tableCodes =
      order.tableSessions
        ?.map((session) => session.tableCode)
        .filter((code): code is string => !!code) ?? [];

    if (tableCodes.length > 0) {
      return tableCodes.includes(selectedTableId);
    }

    return order.tableName === selectedTableId;
  });

  useEffect(() => {
    if (!selectedOrderForDetail) return;
    const latestOrder = orders.find(
      (order) => order.id === selectedOrderForDetail.id,
    );
    if (latestOrder) {
      setSelectedOrderForDetail(latestOrder);
    }
  }, [orders, selectedOrderForDetail]);

  const addableOrders = orders.filter((order) => !isOrderPaid(order.raw));

  useEffect(() => {
    if (!selectedOrderIdForAdd) return;
    const isStillAddable = addableOrders.some(
      (order) => order.id === selectedOrderIdForAdd,
    );
    if (!isStillAddable) {
      setSelectedOrderIdForAdd("");
    }
  }, [addableOrders, selectedOrderIdForAdd]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    statusId: OrderStatusId,
  ) => {
    const previousOrders = orders;
    const nextStatus = mapOrderStatus(statusId, orderStatuses);

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
            item.id === detailId ? { ...item, status: normalizedValue } : item,
          ),
          items: order.items.map((item) =>
            item.id === detailId ? { ...item, status: normalizedValue } : item,
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

    if (isOrderPaid(targetOrder.raw)) {
      message.warning(
        t("staff.orders.messages.paid_order_locked", {
          defaultValue: "Order đã thanh toán, không thể thêm món.",
        }),
      );
      return;
    }

    try {
      const payload: OrderRequestDto = {
        tableId: targetOrder.tableId,
        customerId:
          targetOrder.raw.customerId || "00000000-0000-0000-0000-000000000000",
        orderDetails: cart.map((c) => ({
          dishId: c.item.id,
          quantity: c.quantity,
          note: "",
        })),
      };

      await orderService.createOrder(payload);

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

  const openPaymentModal = (order: OrderForPaymentTrigger) => {
    const matchedOrder = orders.find((o) => o.id === order.id);
    const source = matchedOrder ?? order;

    setIsOrderDetailModalOpen(false);
    setSelectedOrderForDetail(null);
    setSelectedOrder({
      id: source.id,
      reference: source.reference,
      total: source.total,
      subTotal: matchedOrder?.subTotal ?? source.total,
      customerId:
        matchedOrder?.customerId || source.raw?.customerId || undefined,
      raw: {
        paymentStatusId: source.raw?.paymentStatusId,
      },
    });
    setCashReceived(source.total);
    setFinalTotal(source.total);
    setPaymentMethod("cash");
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedOrder) return;

    setIsProcessingPayment(true);
    try {
      if (paymentMethod === "cash") {
        if (cashReceived < finalTotal) {
          message.error(t("staff.orders.payment.messages.cash_insufficient"));
          return;
        }

        await paymentService.payByCash(selectedOrder.id, cashReceived);
        message.success(t("staff.orders.payment.messages.cash_success"));
      } else {
        const response = await paymentService.createPaymentLink(
          selectedOrder.id,
        );
        if (response.checkoutUrl) {
          window.location.assign(response.checkoutUrl);
          return;
        }
        message.success(t("staff.orders.payment.messages.link_created"));
      }

      setIsPaymentModalOpen(false);
      setSelectedOrder(null);
      setFinalTotal(0);
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

  const orderStatusOptions = orderStatuses.map((status) => ({
    value: Number(status.id),
    label: status.name,
    className: "order-status-option",
  }));

  const tableFilterOptions = Array.from(
    new Set(
      orders.flatMap((order) => {
        const codes =
          order.tableSessions
            ?.map((session) => session.tableCode)
            .filter((code): code is string => !!code) ?? [];

        return codes.length > 0 ? codes : [order.tableName];
      }),
    ),
  ).map((tableCode) => ({
    value: tableCode,
    label: `${t("staff.orders.order.table")} ${tableCode}`,
  }));

  return (
    <div className="staff-orders-page">
      {/* Search & Filter */}
      <FilterOrder
        selectedTableId={selectedTableId}
        tableFilterOptions={tableFilterOptions}
        onChangeTable={setSelectedTableId}
        onAddItem={() => setIsAddItemModalOpen(true)}
        disableAddItem={addableOrders.length === 0}
        isMobile={isMobile}
        isTablet={isTablet}
        mode={mode as "light" | "dark"}
        t={t}
      />

      {/* Order List */}
      <div>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const defaultStatuses = orderDetailStatuses
              .filter((s) => s.isDefault)
              .map((s) => s.code?.toLowerCase() || s.id);

            const filteredDetailItems = order.detailItems.filter((item) => {
              if (defaultStatuses.length === 0) return true;
              const nStatus = normalizeStatusValue(item.status).toLowerCase();
              return defaultStatuses.includes(nStatus);
            });

            return (
              <CardOrder
                key={order.id}
                order={{ ...order, detailItems: filteredDetailItems }}
                isMobile={isMobile}
                mode={mode as "light" | "dark"}
                statusOptions={statusOptions}
                orderStatuses={orderStatuses}
                orderStatusOptions={orderStatusOptions}
                isUpdatingOrderStatus={isUpdatingOrderStatus}
                isUpdatingDetailStatus={isUpdatingDetailStatus}
                normalizeStatusValue={normalizeStatusValue}
                handleUpdateOrderStatus={handleUpdateOrderStatus}
                handleUpdateDetailStatus={handleUpdateDetailStatus}
                onViewDetails={(orderId) => {
                  const current = orders.find((o) => o.id === orderId);
                  if (current) {
                    setIsPaymentModalOpen(false);
                    setSelectedOrder(null);
                    setSelectedOrderForDetail(current);
                    setIsOrderDetailModalOpen(true);
                  }
                }}
                t={t}
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

      <AddOrderItem
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setCart([]);
          setSelectedOrderIdForAdd("");
        }}
        onConfirm={handleAddItemsToOrder}
        selectedOrderIdForAdd={selectedOrderIdForAdd}
        setSelectedOrderIdForAdd={setSelectedOrderIdForAdd}
        orders={addableOrders.map((order) => ({
          id: order.id,
          reference: order.reference,
          tableName: order.tableName,
          tableCodes:
            order.tableSessions
              ?.map((session) => session.tableCode)
              .filter((code): code is string => !!code) ?? [],
        }))}
        menuCategories={menuCategories}
        activeMenuCategory={activeMenuCategory}
        setActiveMenuCategory={setActiveMenuCategory}
        cart={cart}
        addToCart={addToCart}
        updateCartQuantity={updateCartQuantity}
        t={t}
      />

      <PaymentOrder
        isOpen={isPaymentModalOpen}
        selectedOrder={selectedOrder}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        paymentOptions={paymentOptions}
        isProcessingPayment={isProcessingPayment}
        onFinalTotalChange={setFinalTotal}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedOrder(null);
          setCashReceived(0);
          setFinalTotal(0);
        }}
        onConfirm={handlePayment}
        t={t}
      />

      <OrderDetailsPopup
        order={selectedOrderForDetail}
        isOpen={isOrderDetailModalOpen}
        onClose={() => {
          setIsOrderDetailModalOpen(false);
          setSelectedOrderForDetail(null);
        }}
        orderStatuses={orderStatuses}
        statusOptions={statusOptions}
        isUpdatingDetailStatus={isUpdatingDetailStatus}
        handleUpdateDetailStatus={handleUpdateDetailStatus}
        normalizeStatusValue={normalizeStatusValue}
        openPaymentModal={openPaymentModal}
        onOpenAddItemModal={(orderId) => {
          const currentOrder = orders.find((o) => o.id === orderId);
          if (currentOrder && isOrderPaid(currentOrder.raw)) {
            message.warning(
              t("staff.orders.messages.paid_order_locked", {
                defaultValue: "Order đã thanh toán, không thể thêm món.",
              }),
            );
            return;
          }

          setSelectedOrderIdForAdd(orderId);
          setIsOrderDetailModalOpen(false);
          setSelectedOrderForDetail(null);
          setIsAddItemModalOpen(true);
        }}
        isMobile={isMobile}
        mode={mode as "light" | "dark"}
        t={t}
      />

      <style jsx global>{`
        .order-detail-status-option,
        .order-status-option {
          padding: 2px 3px !important;
          border-bottom: 1px solid
            ${mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "#EDEDED"};
          display: flex;
          align-items: center;
        }
        .order-detail-status-option:last-child,
        .order-status-option:last-child {
          border-bottom: none;
        }
        .order-detail-status-option.ant-select-item-option-selected,
        .order-status-option.ant-select-item-option-selected {
          background: ${mode === "dark"
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.03)"};
        }
        .order-status-select .ant-select-selector,
        .order-detail-status-select .ant-select-selector {
          border-radius: 6px !important;
          min-height: 24px !important;
          height: 24px !important;
          padding: 0 8px !important;
          align-items: center;
        }
        .order-status-select .ant-select-selection-item,
        .order-detail-status-select .ant-select-selection-item {
          font-size: 12px !important;
          line-height: 22px !important;
        }
        @media (max-width: 575px) {
          .order-status-select .ant-select-selector,
          .order-detail-status-select .ant-select-selector {
            min-height: 22px !important;
            height: 22px !important;
            padding: 0 6px !important;
          }
          .order-status-select .ant-select-selection-item,
          .order-detail-status-select .ant-select-selection-item {
            font-size: 11px !important;
            line-height: 20px !important;
          }
        }

        @media (max-width: 992px) {
          .staff-orders-page .ant-typography,
          .staff-orders-page .ant-btn,
          .staff-orders-page .ant-input,
          .staff-orders-page .ant-input-number-input,
          .staff-orders-page .ant-select-selection-item,
          .staff-orders-page .ant-select-item-option-content,
          .staff-orders-page .ant-empty-description,
          .staff-orders-page p,
          .staff-orders-page span,
          .staff-orders-page label,
          .staff-orders-page button {
            font-size: calc(100% + 2px);
          }
        }
      `}</style>
    </div>
  );
}
