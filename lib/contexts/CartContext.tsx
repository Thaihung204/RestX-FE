"use client";

import type { CartItem } from "@/lib/types/menu";
import orderService, { OrderRequestDto } from "@/lib/services/orderService";
import { message } from "antd";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface CartContextType {
  // Cart state
  cartItems: CartItem[];
  orderedItems: CartItem[];
  cartModalOpen: boolean;
  activeCartTab: string;

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
  clearCart: () => void;

  // Order actions
  confirmOrder: () => void;
  requestPayment: () => void;

  // Modal actions
  openCartModal: () => void;
  closeCartModal: () => void;
  setActiveCartTab: (tab: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [activeCartTab, setActiveCartTab] = useState<string>("1");
  const [orderTableId, setOrderTableId] = useState<string | undefined>();
  const [orderCustomerId, setOrderCustomerId] = useState<string | undefined>();

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

  const totalOrderAmount = useMemo(
    () =>
      orderedItems.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      ),
    [orderedItems],
  );

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
      setCartItems((prev) => {
        const existingItem = prev.find((cartItem) => cartItem.id === item.id);

        if (existingItem) {
          return prev.map((cartItem) =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          );
        } else {
          return [...prev, { ...item, quantity: 1 }];
        }
      });
      messageApi.success(`Đã thêm ${item.name} vào giỏ hàng`);
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

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Order actions
  const confirmOrder = useCallback(async () => {
    if (cartItems.length === 0) {
      messageApi.warning("Giỏ hàng đang trống!");
      return;
    }

    if (!orderTableId) {
      messageApi.error("Không tìm thấy thông tin bàn. Vui lòng quét lại QR.");
      return;
    }

    try {
      const orderDetails = cartItems.map((cartItem) => ({
        dishId: cartItem.id,
        quantity: cartItem.quantity,
      }));

      const payload: OrderRequestDto = {
        tableId: orderTableId,
        customerId:
          orderCustomerId ?? "00000000-0000-0000-0000-000000000000",
        orderDetails,
      };

      await orderService.createOrder(payload);

      setOrderedItems((prevOrdered) => {
        const newOrdered = [...prevOrdered];

        cartItems.forEach((cartItem) => {
          const existingIndex = newOrdered.findIndex(
            (item) => item.id === cartItem.id,
          );

          if (existingIndex > -1) {
            newOrdered[existingIndex] = {
              ...newOrdered[existingIndex],
              quantity:
                newOrdered[existingIndex].quantity + cartItem.quantity,
            };
          } else {
            newOrdered.push({ ...cartItem });
          }
        });

        return newOrdered;
      });

      setCartItems([]);
      setActiveCartTab("2");
      messageApi.success(
        "Đặt món thành công! Yêu cầu đã được gửi đến nhân viên.",
      );
    } catch (error) {
      console.error("Create order failed:", error);
      messageApi.error("Đặt món thất bại. Vui lòng thử lại.");
    }
  }, [cartItems, messageApi, orderTableId, orderCustomerId]);

  const requestPayment = useCallback(() => {
    if (orderedItems.length === 0) {
      messageApi.warning("Chưa có món nào được đặt!");
      return;
    }
    messageApi.success("Yêu cầu thanh toán đã được gửi đến nhân viên!");
    setCartModalOpen(false);
  }, [orderedItems, messageApi]);

  // Modal actions
  const openCartModal = useCallback(() => {
    setCartModalOpen(true);
  }, []);

  const closeCartModal = useCallback(() => {
    setCartModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      orderedItems,
      cartModalOpen,
      activeCartTab,
      orderTableId,
      orderCustomerId,
      setOrderContext,
      cartItemCount,
      totalCartAmount,
      totalOrderAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      confirmOrder,
      requestPayment,
      openCartModal,
      closeCartModal,
      setActiveCartTab,
    }),
    [
      cartItems,
      orderedItems,
      cartModalOpen,
      activeCartTab,
      orderTableId,
      orderCustomerId,
      cartItemCount,
      totalCartAmount,
      totalOrderAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      confirmOrder,
      requestPayment,
      openCartModal,
      closeCartModal,
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
