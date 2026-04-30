"use client";

import CancelDishConfirm from "@/components/admin/orders/CancelDishConfirm";
import AddOrderItem from "@/components/staff/orders/AddOrderItem";
import CardOrder from "@/components/staff/orders/CardOrder";
import CreateOrderModal from "@/components/staff/orders/CreateOrderModal";
import FilterOrder from "@/components/staff/orders/FilterOrder";
import OrderDetailsPopup from "@/components/staff/orders/OrderDetailsPopup";
import PaymentOrder from "@/components/staff/orders/PaymentOrder";
import { useTenant } from "@/lib/contexts/TenantContext";
import dishService, { ComboSummaryDto } from "@/lib/services/dishService";
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
import { TableItem, tableService } from "@/lib/services/tableService";
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
  comboId?: string | null;
  parentId?: string | null;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  status: OrderItemStatus;
  ids?: string[];
  /** Child items when this is a combo row */
  children?: OrderItem[];
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
  depositAmount?: number;
  serviceCharge?: number;
  serviceChargePercent?: number;
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
    // Chỉ gộp khi CÙNG tên món VÀ CÙNG status
    const nameKey = (item.name || item.dishId).toLowerCase().trim();
    const statusKey = item.status?.toLowerCase?.() ?? "";
    const key = `${nameKey}||${statusKey}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      if (!existing.ids) existing.ids = [existing.id];
      existing.ids.push(item.id);
    } else {
      aggregated.set(key, { ...item, ids: [item.id] });
    }
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
  const [comboItems, setComboItems] = useState<ComboSummaryDto[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
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
      // To: `${yyyy}-${mm}-${dd}T23:59:59Z`,
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

        // Map all raw details to OrderItem
        const allItems: OrderItem[] = (order.orderDetails ?? []).map(
          (detail, index) => {
            const statusValue = detail.status || "";
            const normalizedStatus = normalizeStatusValue(statusValue);
            return {
              id: detail.id || `${order.id || "order"}-${index}`,
              dishId: detail.dishId,
              comboId: detail.comboId ?? null,
              parentId: detail.parentId ?? null,
              name:
                detail.dishName || dishNameMap[detail.dishId] || detail.dishId,
              quantity: detail.quantity ?? 0,
              price: Number(detail.dishPrice ?? 0),
              note: detail.note || undefined,
              status: normalizedStatus,
            };
          },
        );

        // Separate combo parents from standalone dishes and combo children
        const comboParents = allItems.filter((i) => i.comboId && !i.parentId);
        const comboChildrenMap = new Map<string, OrderItem[]>();
        allItems
          .filter((i) => i.parentId)
          .forEach((child) => {
            const list = comboChildrenMap.get(child.parentId!) ?? [];
            list.push(child);
            comboChildrenMap.set(child.parentId!, list);
          });
        const standaloneItems = allItems.filter((i) => !i.comboId && !i.parentId);

        // Build structured list: combos with children, then standalone dishes
        const structuredItems: OrderItem[] = [
          ...comboParents.map((combo) => ({
            ...combo,
            children: comboChildrenMap.get(combo.id) ?? [],
          })),
          ...aggregateOrderItems(standaloneItems),
        ];

        const summaryItems = structuredItems;

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
          detailItems: summaryItems,
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
      const data = await orderService.getCurrentOrders(getTodayOrderQuery());
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
      const [statusData, orderStatusData, menuData, comboData, orderData, tableData] =
        await Promise.all([
          orderDetailStatusService.getAllStatuses(),
          orderStatusService.getAllStatuses(),
          menuService.getMenu(),
          dishService.getActiveCombos().catch(() => []),
          orderService.getCurrentOrders(getTodayOrderQuery()),
          tableService.getAllTables().catch(() => []),
        ]);

      const safeStatuses = statusData ?? [];
      const safeOrderStatuses = orderStatusData ?? [];
      const safeMenu = menuData ?? [];

      setOrderDetailStatuses(safeStatuses);
      setOrderStatuses(safeOrderStatuses);
      setMenuCategories(safeMenu);
      setComboItems(comboData ?? []);
      setTables(tableData ?? []);

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
  const [cart, setCart] = useState<{ item: DishItem; quantity: number; comboId?: string; comboDetails?: { dishName: string; quantity: number }[] }[]>([]);
  const [activeMenuCategory, setActiveMenuCategory] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
  const [isUpdatingDetailStatus, setIsUpdatingDetailStatus] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<{ orderId: string; detailId: string; dishName: string; statusValue: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] =
    useState<Order | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Create new order state (staff creates order without customerId)
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [createOrderTableId, setCreateOrderTableId] = useState<string>("");
  const [createOrderCart, setCreateOrderCart] = useState<{ item: DishItem; quantity: number; comboId?: string; comboDetails?: { dishName: string; quantity: number }[] }[]>([]);
  const [createOrderActiveCategory, setCreateOrderActiveCategory] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

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

    // Intercept cancel — show confirm popup
    if (matchedStatus.code?.toLowerCase() === "cancelled" || matchedStatus.name?.toLowerCase() === "cancelled") {
      const order = orders.find((o) => o.id === orderId);
      const item = order?.detailItems?.find((i) => i.id === detailId) ?? order?.items?.find((i: any) => i.id === detailId);
      setCancelConfirm({ orderId, detailId, dishName: (item as any)?.name ?? "", statusValue });
      return;
    }

    await _doUpdateDetailStatus(orderId, detailId, statusValue, normalizedValue, matchedStatus);
  };

  const _doUpdateDetailStatus = async (
    orderId: string,
    detailId: string,
    statusValue: string,
    normalizedValue: string,
    matchedStatus: OrderDetailStatus,
  ) => {
    const previousOrders = orders;

    // Find all target IDs for the grouped item
    let targetIds = [detailId];
    const orderToUpdate = previousOrders.find((o) => o.id === orderId);
    if (orderToUpdate) {
      const groupedItem =
        orderToUpdate.detailItems.find((i) => i.id === detailId) ??
        orderToUpdate.items.find((i: any) => i.id === detailId);
      if (groupedItem?.ids && groupedItem.ids.length > 0) {
        targetIds = groupedItem.ids;
      }
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          detailItems: order.detailItems.map((item) =>
            targetIds.includes(item.id) ? { ...item, status: normalizedValue } : item,
          ),
          items: order.items.map((item) =>
            targetIds.includes(item.id) ? { ...item, status: normalizedValue } : item,
          ),
        };
      }),
    );

    setIsUpdatingDetailStatus(true);
    try {
      await Promise.all(
        targetIds.map((id) =>
          orderService.updateOrderDetailStatus(
            orderId,
            id,
            Number(matchedStatus.id),
          )
        )
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

  const handleConfirmCancelStaff = async () => {
    if (!cancelConfirm) return;
    const { orderId, detailId, statusValue } = cancelConfirm;
    const normalizedValue = normalizeStatusValue(statusValue);
    const matchedStatus = orderDetailStatuses.find(
      (s) => s.id === normalizedValue || s.code?.toLowerCase() === normalizedValue.toLowerCase(),
    );
    if (!matchedStatus) return;
    setIsCancelling(true);
    await _doUpdateDetailStatus(orderId, detailId, statusValue, normalizedValue, matchedStatus);
    setIsCancelling(false);
    setCancelConfirm(null);
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

  // Handlers for the CreateOrderModal (separate cart, no customerId)
  const addToCreateOrderCart = (item: DishItem) => {
    setCreateOrderCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const addComboToCreateOrderCart = (combo: ComboSummaryDto) => {
    setCreateOrderCart((prev) => {
      const existing = prev.find((c) => c.comboId === combo.id);
      if (existing) {
        return prev.map((c) =>
          c.comboId === combo.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      const comboAsDish: DishItem = {
        id: combo.id,
        name: combo.name,
        description: combo.description || "",
        price: Number(combo.price ?? 0),
        unit: "combo",
        isVegetarian: false,
        isSpicy: false,
        isBestSeller: false,
        images: [],
        imageUrl: combo.imageUrl ?? null,
        categoryId: "combo",
        categoryName: "Combo",
      };
      return [
        ...prev,
        {
          item: comboAsDish,
          quantity: 1,
          comboId: combo.id,
          comboDetails: combo.details.map((d) => ({
            dishName: d.dishName || d.dishId,
            quantity: d.quantity > 0 ? d.quantity : 1,
          })),
        },
      ];
    });
    message.success(t("staff.orders.messages.combo_added", { defaultValue: "Combo added to order" }));
  };

  const updateCreateOrderCartQuantity = (itemId: string, delta: number) => {
    setCreateOrderCart((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const handleCreateNewOrder = async () => {
    if (!createOrderTableId || createOrderCart.length === 0) {
      message.error(
        t("staff.orders.messages.select_table_and_items", {
          defaultValue: "Vui lòng chọn bàn và ít nhất 1 món.",
        }),
      );
      return;
    }
    setIsCreatingOrder(true);
    try {
      const payload: OrderRequestDto = {
        tableId: createOrderTableId,
        // Không truyền customerId — staff tạo order trực tiếp
        orderDetails: createOrderCart.map((c) =>
          c.comboId
            ? { comboId: c.comboId, quantity: c.quantity, note: "" }
            : { dishId: c.item.id, quantity: c.quantity, note: "" },
        ),
      };
      await orderService.createOrder(payload);
      message.success(t("staff.orders.messages.order_created"));
      setIsCreateOrderModalOpen(false);
      setCreateOrderCart([]);
      setCreateOrderTableId("");
      refreshOrders();
    } catch (error) {
      console.error("Create order failed:", error);
      message.error(t("staff.orders.messages.order_create_failed"));
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const addComboToCart = (combo: ComboSummaryDto) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.comboId === combo.id);
      if (existing) {
        return prev.map((c) =>
          c.comboId === combo.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      const comboAsDish: DishItem = {
        id: combo.id,
        name: combo.name,
        description: combo.description || "",
        price: Number(combo.price ?? 0),
        unit: "combo",
        isVegetarian: false,
        isSpicy: false,
        isBestSeller: false,
        images: [],
        imageUrl: combo.imageUrl ?? null,
        categoryId: "combo",
        categoryName: "Combo",
      };
      return [
        ...prev,
        {
          item: comboAsDish,
          quantity: 1,
          comboId: combo.id,
          comboDetails: combo.details.map((d) => ({
            dishName: d.dishName || d.dishId,
            quantity: d.quantity > 0 ? d.quantity : 1,
          })),
        },
      ];
    });
    message.success(t("staff.orders.messages.combo_added"));
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
        t("staff.orders.messages.paid_order_locked"),
      );
      return;
    }

    // Ưu tiên tableId từ tableSessions đầu tiên, fallback về tableId đã resolve
    const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
    const resolvedTableId =
      targetOrder.tableSessions
        ?.map((s) => s.tableId)
        .find((id): id is string => !!id && id !== EMPTY_GUID) ??
      targetOrder.tableId;

    const customerId = targetOrder.raw?.customerId;

    try {
      const payload: OrderRequestDto = {
        tableId: resolvedTableId,
        ...(customerId && customerId !== EMPTY_GUID ? { customerId } : {}),
        orderDetails: cart.map((c) =>
          c.comboId
            ? { comboId: c.comboId, quantity: c.quantity, note: "" }
            : { dishId: c.item.id, quantity: c.quantity, note: "" },
        ),
      };

      await orderService.createOrder(payload);

      message.success(t("staff.orders.messages.order_created"));
      setIsAddItemModalOpen(false);
      setCart([]);
      setSelectedOrderIdForAdd("");
      refreshOrders();
    } catch (error) {
      console.error("Add items to order failed:", error);
      message.error(t("staff.orders.messages.order_create_failed"));
    }
  };

  const openPaymentModal = async (order: OrderForPaymentTrigger) => {
    const matchedOrder = orders.find((o) => o.id === order.id);
    const source = matchedOrder ?? order;

    // Open modal immediately with data we have
    setIsOrderDetailModalOpen(false);
    setSelectedOrderForDetail(null);
    const subTotalInitial = matchedOrder?.subTotal ?? source.total;
    setSelectedOrder({
      id: source.id,
      reference: source.reference,
      total: source.total,
      subTotal: subTotalInitial,
      customerId:
        matchedOrder?.customerId || source.raw?.customerId || undefined,
      depositAmount: 0,
      serviceCharge: 0,
      serviceChargePercent: 0,
      raw: { paymentStatusId: source.raw?.paymentStatusId },
    });
    setCashReceived(source.total);
    setFinalTotal(source.total);
    setPaymentMethod("cash");
    setIsPaymentModalOpen(true);

    // Fetch full order to get serviceCharge & reservation.depositAmount
    try {
      const res = await orderService.getOrderById(source.id) as any;
      // Unwrap API wrapper: { data: {...} } or { success, data: {...} } or raw object
      const orderData = res?.data ?? res;
      console.log("[PaymentModal] full order data:", orderData);

      const subTotalRaw: number = Number(orderData?.subTotal ?? subTotalInitial);

      // serviceCharge from API is a flat VND amount (not percent)
      const serviceChargeRaw: number = Number(orderData?.serviceCharge ?? 0);
      // Compute display percent from subTotal (round to nearest whole %)
      const serviceChargePercent: number =
        serviceChargeRaw > 0 && subTotalRaw > 0
          ? Math.round((serviceChargeRaw / subTotalRaw) * 100)
          : 0;

      const depositAmount: number = Number(
        orderData?.reservation?.depositAmount ?? 0,
      );

      console.log("[PaymentModal] serviceCharge:", serviceChargeRaw, "deposit:", depositAmount);

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              depositAmount,
              serviceCharge: serviceChargeRaw,
              serviceChargePercent,
            }
          : prev,
      );
    } catch (err) {
      console.error("[PaymentModal] failed to fetch order detail:", err);
    }
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
        onCreateOrder={() => {
          setCreateOrderCart([]);
          setCreateOrderTableId("");
          if (menuCategories.length > 0 && !createOrderActiveCategory) {
            setCreateOrderActiveCategory(menuCategories[0].categoryId);
          }
          setIsCreateOrderModalOpen(true);
        }}
        isMobile={isMobile}
        isTablet={isTablet}
        mode={mode as "light" | "dark"}
        t={t}
      />

      {/* Order List */}
      <div>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const preparingStatuses = orderDetailStatuses
              .filter((s) => s.code?.toLowerCase() === "preparing")
              .map((s) => s.code?.toLowerCase() || s.id);

            const filteredDetailItems = order.detailItems.filter((item) => {
              if (preparingStatuses.length === 0) return true;
              // For combo parents: keep if the combo itself or any child is preparing
              if (item.comboId && !item.parentId) {
                const comboStatus = normalizeStatusValue(item.status).toLowerCase();
                if (preparingStatuses.includes(comboStatus)) return true;
                return (item.children ?? []).some((child) =>
                  preparingStatuses.includes(normalizeStatusValue(child.status).toLowerCase())
                );
              }
              const nStatus = normalizeStatusValue(item.status).toLowerCase();
              return preparingStatuses.includes(nStatus);
            }).map((item) => {
              // Filter children of combos to only preparing ones
              if (item.comboId && !item.parentId && item.children) {
                const filteredChildren = preparingStatuses.length === 0
                  ? item.children
                  : item.children.filter((child) =>
                      preparingStatuses.includes(normalizeStatusValue(child.status).toLowerCase())
                    );
                return { ...item, children: filteredChildren };
              }
              return item;
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
        comboItems={comboItems}
        activeMenuCategory={activeMenuCategory}
        setActiveMenuCategory={setActiveMenuCategory}
        cart={cart}
        addToCart={addToCart}
        addComboToCart={addComboToCart}
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
              t("staff.orders.messages.paid_order_locked"),
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

      <CancelDishConfirm
        open={!!cancelConfirm}
        dishName={cancelConfirm?.dishName}
        loading={isCancelling}
        onConfirm={handleConfirmCancelStaff}
        onCancel={() => setCancelConfirm(null)}
      />

      {/* Modal tạo order mới cho staff — không truyền customerId */}
      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => {
          setIsCreateOrderModalOpen(false);
          setCreateOrderCart([]);
          setCreateOrderTableId("");
        }}
        onConfirm={handleCreateNewOrder}
        isCreating={isCreatingOrder}
        tables={tables}
        selectedTableId={createOrderTableId}
        setSelectedTableId={setCreateOrderTableId}
        menuCategories={menuCategories}
        comboItems={comboItems}
        activeMenuCategory={createOrderActiveCategory || (menuCategories[0]?.categoryId ?? "")}
        setActiveMenuCategory={setCreateOrderActiveCategory}
        cart={createOrderCart}
        addToCart={addToCreateOrderCart}
        addComboToCart={addComboToCreateOrderCart}
        updateCartQuantity={updateCreateOrderCartQuantity}
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
