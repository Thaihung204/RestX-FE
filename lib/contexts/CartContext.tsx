"use client";

import menuService from "@/lib/services/menuService";
import orderService, { OrderRequestDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import type { CartItem } from "@/lib/types/menu";
import { HubConnectionState } from "@microsoft/signalr";
import { message } from "antd";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useTenant } from "./TenantContext";

interface CartContextType {
  // Cart state
  cartItems: CartItem[];
  orderedItems: CartItem[];
  cartModalOpen: boolean;
  activeCartTab: string;
  isSubmittingOrder: boolean;

  // Order context
  orderTableId?: string;
  orderCustomerId?: string;
  setOrderContext: (context: { tableId: string; customerId?: string }) => void;

  // Computed values
  cartItemCount: number;
  totalCartAmount: number;
  totalOrderAmount: number;

  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNote: (itemId: string, note: string) => void;
  clearCart: () => void;

  // Order actions
  confirmOrder: () => void;
  requestPayment: () => void;
  fetchOrderedItems: () => Promise<void>;

  // Modal actions
  openCartModal: () => void;
  closeCartModal: () => void;
  setActiveCartTab: (tab: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const [messageApi, contextHolder] = message.useMessage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [orderedSubTotal, setOrderedSubTotal] = useState<number>(0);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [activeCartTab, setActiveCartTabState] = useState<string>("1");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderTableId, setOrderTableId] = useState<string | undefined>();
  const [orderCustomerId, setOrderCustomerId] = useState<string | undefined>();
  const loadedOrderTableIdRef = useRef<string | undefined>(undefined);

  // Computed values
  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const totalCartAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const totalOrderAmount = orderedSubTotal;

  // Order context
  const setOrderContext = useCallback(
    (context: { tableId: string; customerId?: string }) => {
      setOrderTableId(context.tableId);
      if (context.customerId) {
        setOrderCustomerId(context.customerId);
      }
    },
    [],
  );

  // Cart actions
  const addToCart = useCallback(
    (item: CartItem) => {
      const rawQuantity = Number(item.quantity ?? 1);
      const quantityToAdd =
        Number.isFinite(rawQuantity) && rawQuantity > 0
          ? Math.floor(rawQuantity)
          : 1;

      setCartItems((prev) => {
        const existingItem = prev.find((cartItem) => cartItem.id === item.id);

        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
              : cartItem,
          );
        } else {
          return [...prev, { ...item, quantity: quantityToAdd }];
        }
      });
      messageApi.success(
        quantityToAdd > 1
          ? `Đã thêm ${quantityToAdd} món ${item.name} vào giỏ hàng`
          : `Đã thêm ${item.name} vào giỏ hàng`,
      );
    },
    [messageApi],
  );

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
    );
  }, []);

  const updateNote = useCallback((itemId: string, note: string) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, note } : item)),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const fetchOrderedItems = useCallback(async () => {
    if (!orderTableId) return;

    try {
      const [orders, menuData] = await Promise.all([
        orderService.getOrdersByTable(orderTableId),
        menuService.getMenu(),
      ]);

      const dishLookup = new Map<
        string,
        {
          name: string;
          price: string;
          categoryId: string;
          categoryName: string;
          image?: string;
        }
      >();

      menuData.forEach((category) => {
        category.items?.forEach((dish) => {
          dishLookup.set(dish.id, {
            name: dish.name,
            price: dish.price?.toString() || "0",
            categoryId: dish.categoryId || category.categoryId || "",
            categoryName: dish.categoryName || category.categoryName || "",
            image: dish.imageUrl ?? undefined,
          });
        });
      });

      const aggregatedByDishAndStatus = new Map<string, CartItem>();

      orders.forEach((order) => {
        order.orderDetails?.forEach((detail) => {
          const dish = dishLookup.get(detail.dishId);
          const quantity = detail.quantity || 0;
          if (quantity <= 0) return;

          const status = detail.status?.trim() || "Pending";
          // We include note in the aggregation key so that items with different notes don't get merged incorrectly.
          // Or we can just merge notes. Let's merge notes.
          const aggregationKey = `${detail.dishId}__${status.toLowerCase()}`;
          const existing = aggregatedByDishAndStatus.get(aggregationKey);
          const fallbackPrice =
            typeof detail.dishPrice === "number"
              ? detail.dishPrice.toString()
              : "0";

          if (existing) {
            let combinedNote = existing.note || "";
            if (detail.note) {
              combinedNote = combinedNote ? `${combinedNote}; ${detail.note}` : detail.note;
            }

            aggregatedByDishAndStatus.set(aggregationKey, {
              ...existing,
              quantity: existing.quantity + quantity,
              note: combinedNote || undefined,
            });
            return;
          }

          aggregatedByDishAndStatus.set(aggregationKey, {
            id: detail.dishId,
            name:
              dish?.name ||
              detail.dishName ||
              `Dish ${detail.dishId.slice(0, 8)}`,
            price: dish?.price || fallbackPrice,
            quantity,
            note: detail.note || undefined,
            category: "food",
            categoryId: dish?.categoryId || "",
            categoryName: dish?.categoryName,
            image: dish?.image,
            status,
          });
        });
      });

      setOrderedItems(Array.from(aggregatedByDishAndStatus.values()));

      // Sum subTotal from all orders (from response, not FE-calculated)
      const responseSubTotal = orders.reduce(
        (sum, order) => sum + (order.subTotal ?? 0),
        0,
      );
      setOrderedSubTotal(responseSubTotal);
    } catch (error) {
      console.error("Fetch ordered items failed:", error);
    }
  }, [orderTableId]);

  // Order actions
  const confirmOrder = useCallback(async () => {
    if (isSubmittingOrder) {
      return;
    }

    if (cartItems.length === 0) {
      messageApi.warning("Giỏ hàng đang trống!");
      return;
    }

    if (!orderTableId) {
      messageApi.error("Không tìm thấy thông tin bàn. Vui lòng quét lại QR.");
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const orderDetails = cartItems.map((cartItem) => ({
        dishId: cartItem.id,
        quantity: cartItem.quantity,
        note: cartItem.note,
      }));

      const payload: OrderRequestDto = {
        tableId: orderTableId,
        customerId: orderCustomerId,
        orderDetails,
      };

      await orderService.createOrder(payload);

      setCartItems([]);
      messageApi.success(
        "Đặt món thành công! Yêu cầu đã được gửi đến nhân viên.",
      );
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data;
      console.error("Create order failed:", serverMsg, error);
      messageApi.error(
        typeof serverMsg === "string" && serverMsg.length < 200
          ? `Đặt món thất bại: ${serverMsg}`
          : "Đặt món thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  }, [cartItems, isSubmittingOrder, messageApi, orderTableId, orderCustomerId]);

  const requestPayment = useCallback(() => {
    if (orderedItems.length === 0) {
      messageApi.warning("Chưa có món nào được đặt!");
      return;
    }
    messageApi.success("Yêu cầu thanh toán đã được gửi đến nhân viên!");
    setCartModalOpen(false);
  }, [orderedItems, messageApi]);

  useEffect(() => {
    if (!orderTableId) return;
    if (loadedOrderTableIdRef.current === orderTableId) return;

    loadedOrderTableIdRef.current = orderTableId;
    fetchOrderedItems();
  }, [orderTableId, fetchOrderedItems]);

  useEffect(() => {
    if (!orderTableId || !tenant?.id) return;

    const tenantId = tenant.id;
    let isMounted = true;
    const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

    // Supports multiple payload shapes:
    // - { id, order: {...} }
    // - { id, result: {...} }
    // - { ...order }
    const handleOrderChange = (payload: any) => {
      const orderPayload = payload?.order || payload?.result || payload;
      const changedTableId = orderPayload?.tableId as string | undefined;
      const changedTableIds = orderPayload?.tableIds as string[] | undefined;
      const changedTableSessions = orderPayload?.tableSessions as
        | Array<{ tableId?: string | null }>
        | undefined;

      const matchesDirectTable =
        !!changedTableId &&
        changedTableId !== EMPTY_GUID &&
        changedTableId === orderTableId;

      const matchesTableIds =
        Array.isArray(changedTableIds) &&
        changedTableIds.includes(orderTableId);

      const matchesTableSessions =
        Array.isArray(changedTableSessions) &&
        changedTableSessions.some(
          (session) => session?.tableId === orderTableId,
        );

      // Some events (e.g. delete) may not contain table info; refresh defensively.
      const hasNoTableHints =
        !changedTableId &&
        (!Array.isArray(changedTableIds) || changedTableIds.length === 0) &&
        (!Array.isArray(changedTableSessions) ||
          changedTableSessions.length === 0);

      if (
        !matchesDirectTable &&
        !matchesTableIds &&
        !matchesTableSessions &&
        !hasNoTableHints
      ) {
        return;
      }

      if (!isMounted) return;
      fetchOrderedItems();
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
          console.log(
            "SignalR: Listening to order events for tenant:",
            tenantId,
          );
        }
      } catch (error) {
        console.error("SignalR: Setup failed", error);
      }
    };

    setupSignalR();

    // Clean up
    return () => {
      isMounted = false;
      events.forEach((event) =>
        orderSignalRService.off(event, handleOrderChange),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => {});
    };
  }, [orderTableId, tenant?.id, fetchOrderedItems]);

  const setActiveCartTab = useCallback((tab: string) => {
    setActiveCartTabState(tab);
  }, []);

  // Modal actions
  const openCartModal = useCallback(() => {
    setActiveCartTabState(cartItems.length > 0 ? "1" : "2");
    setCartModalOpen(true);
  }, [cartItems]);

  const closeCartModal = useCallback(() => {
    setCartModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      orderedItems,
      cartModalOpen,
      activeCartTab,
      isSubmittingOrder,
      orderTableId,
      orderCustomerId,
      setOrderContext,
      cartItemCount,
      totalCartAmount,
      totalOrderAmount: orderedSubTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateNote,
      clearCart,
      confirmOrder,
      requestPayment,
      fetchOrderedItems,
      openCartModal,
      closeCartModal,
      setActiveCartTab,
    }),
    [
      cartItems,
      orderedItems,
      cartModalOpen,
      activeCartTab,
      isSubmittingOrder,
      orderTableId,
      orderCustomerId,
      cartItemCount,
      totalCartAmount,
      orderedSubTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateNote,
      clearCart,
      confirmOrder,
      requestPayment,
      fetchOrderedItems,
      openCartModal,
      closeCartModal,
      setActiveCartTab,
      setOrderContext,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {contextHolder}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
