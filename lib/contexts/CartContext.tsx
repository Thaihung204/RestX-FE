"use client";

import type { CartItem } from "@/lib/types/menu";
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
  const confirmOrder = useCallback(() => {
    if (cartItems.length === 0) {
      messageApi.warning("Giỏ hàng đang trống!");
      return;
    }

    setOrderedItems((prevOrdered) => {
      const newOrdered = [...prevOrdered];

      cartItems.forEach((cartItem) => {
        const existingIndex = newOrdered.findIndex(
          (item) => item.id === cartItem.id,
        );

        if (existingIndex > -1) {
          newOrdered[existingIndex] = {
            ...newOrdered[existingIndex],
            quantity: newOrdered[existingIndex].quantity + cartItem.quantity,
          };
        } else {
          newOrdered.push({ ...cartItem });
        }
      });

      return newOrdered;
    });

    setCartItems([]);
    setActiveCartTab("2");
    messageApi.success("Yêu cầu gọi món đã được gửi đến nhân viên!");
  }, [cartItems, messageApi]);

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
