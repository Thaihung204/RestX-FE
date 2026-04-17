"use client";

import axiosInstance from "@/lib/services/axiosInstance";
import {
  ComboSummaryDto,
  dishService,
  MenuCategory,
  MenuItem,
} from "@/lib/services/dishService";
import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface MenuSelectionModalProps {
  orderId: string;
  tableId: string;
  customerId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MenuSelectionModal({
  orderId,
  tableId,
  customerId,
  isOpen,
  onClose,
  onSuccess,
}: MenuSelectionModalProps) {
  const { t } = useTranslation("common");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [combos, setCombos] = useState<ComboSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Mảng lưu món được chọn: { dishId, name, quantity, price }
  const [selectedItems, setSelectedItems] = useState<{
    dishId: string;
    name?: string;
    quantity: number;
    price: number;
  }[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMenu();
      setSelectedItems([]);
    }
  }, [isOpen]);

  const dishLookup = useMemo(() => {
    return categories.reduce<Record<string, MenuItem>>((acc, category) => {
      category.items.forEach((dish) => {
        if (dish.id) {
          acc[dish.id] = dish;
        }
      });
      return acc;
    }, {});
  }, [categories]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const [menuData, comboData] = await Promise.all([
        dishService.getMenu(),
        dishService.getActiveCombos().catch(() => []),
      ]);

      setCategories(menuData);
      setCombos(comboData);
    } catch (err) {
      console.error("Failed to load menu", err);
    } finally {
      setLoading(false);
    }
  };

  const addSelection = (
    dishId: string,
    name: string,
    price: number,
    quantityDelta: number,
  ) => {
    if (!dishId || quantityDelta <= 0) return;

    setSelectedItems((prev) => {
      const existing = prev.find((x) => x.dishId === dishId);
      if (existing) {
        return prev.map((x) =>
          x.dishId === dishId
            ? { ...x, quantity: x.quantity + quantityDelta }
            : x,
        );
      }

      return [
        ...prev,
        {
          dishId,
          name,
          quantity: quantityDelta,
          price,
        },
      ];
    });
  };

  const handleAddItem = (dish: MenuItem) => {
    if (!dish.id) return;
    addSelection(dish.id, dish.name || "", dish.price ?? 0, 1);
  };

  const handleAddCombo = (combo: ComboSummaryDto) => {
    if (!combo?.details?.length) {
      return;
    }

    combo.details.forEach((detail) => {
      if (!detail.dishId) {
        return;
      }

      const matchedDish = dishLookup[detail.dishId];
      const quantity = detail.quantity > 0 ? detail.quantity : 1;
      const dishName = detail.dishName || matchedDish?.name || detail.dishId;
      const dishPrice = detail.dishPrice ?? matchedDish?.price ?? 0;

      addSelection(detail.dishId, dishName, dishPrice, quantity);
    });
  };

  const handleUpdateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems((prev) => prev.filter((x) => x.dishId !== dishId));
      return;
    }
    setSelectedItems((prev) =>
      prev.map((x) => (x.dishId === dishId ? { ...x, quantity } : x))
    );
  };

  const submitAddDishes = async () => {
    if (selectedItems.length === 0) return;
    setAdding(true);
    try {
      // Backend POST /api/orders (CheckSessionBeforeOrder calls UpsertOrder)
      // UpsertOrder reads the existing order.Id and appends the new items since it does not delete anything.
      const payload = {
        id: orderId,
        tableId: tableId,
        customerId: customerId,
        orderDetails: selectedItems.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          note: "",
        })),
      };

      await axiosInstance.post("/orders", payload);
      message.success(t("admin.order_detail.messages.add_dish_success"));
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to add dishes to order", err);
      message.error(t("admin.order_detail.messages.update_error"));
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex w-full max-w-4xl flex-col max-h-[85vh] rounded-xl shadow-xl"
        style={{ backgroundColor: "var(--card)" }}
      >
        <div className="flex items-center justify-between border-b p-4 px-6" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>{t("admin.order_detail.actions.add_dish")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close", { defaultValue: "Close" })}
            className="rounded-full p-2 transition-colors"
            style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Menu Items */}
          <div className="flex-[2] overflow-y-auto border-r p-6" style={{ borderColor: "var(--border)" }}>
            {loading ? (
              <div className="animate-pulse flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--primary)" }}></div> {t("admin.order_detail.messages.loading")}
              </div>
            ) : categories.length > 0 || combos.length > 0 ? (
              <>
                {categories.map((cat) => (
                  <div key={cat.categoryId} className="mb-6">
                    <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--primary)" }}>{cat.categoryName}</h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {cat.items.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => handleAddItem(dish)}
                          className="cursor-pointer rounded-lg border p-3 transition hover:-translate-y-1 hover:shadow-md"
                          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                        >
                          {dish.imageUrl ? (
                            <img src={dish.imageUrl} alt={dish.name} className="mb-2 h-24 w-full rounded-md object-cover" />
                          ) : (
                            <div className="mb-2 flex h-24 w-full items-center justify-center rounded-md text-xs font-semibold" style={{ backgroundColor: "var(--border)", color: "var(--text-muted)" }}>
                              {t("admin.order_detail.messages.no_image")}
                            </div>
                          )}
                          <h4 className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{dish.name}</h4>
                          <p className="text-sm font-medium mt-1" style={{ color: "var(--primary)" }}>
                            {(dish.price ?? 0).toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {combos.length > 0 && (
                  <div className="mb-2">
                    <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--primary)" }}>
                      {t("dashboard.menu.combo.title", {
                        defaultValue: "Combo Management",
                      })}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {combos.map((combo) => (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => handleAddCombo(combo)}
                          className="rounded-lg border p-3 text-left transition hover:-translate-y-1 hover:shadow-md"
                          style={{
                            borderColor: "var(--border)",
                            backgroundColor: "var(--surface)",
                          }}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold" style={{ color: "var(--text)" }}>
                                {combo.name}
                              </p>
                              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {(combo.details || [])
                                  .map((detail) => {
                                    const quantity = detail.quantity > 0 ? detail.quantity : 1;
                                    const dishName = detail.dishName || dishLookup[detail.dishId]?.name || detail.dishId;
                                    return `${dishName} x${quantity}`;
                                  })
                                  .join(" · ")}
                              </p>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                              {Number(combo.price || 0).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>{t("admin.order_detail.messages.no_menu_items")}</p>
            )}
          </div>

          {/* Selected Items */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto" style={{ backgroundColor: "var(--surface)" }}>
            <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>{t("admin.order_detail.sections.selected_items", { count: selectedItems.reduce((acc, curr) => acc + curr.quantity, 0) })}</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedItems.map((item) => (
                <div key={item.dishId} className="flex flex-col gap-1 rounded-lg border p-3 shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                  <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{item.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateQuantity(item.dishId, item.quantity - 1)} className="rounded p-1 w-6 h-6 flex items-center justify-center font-bold" style={{ backgroundColor: "var(--border)", color: "var(--text)" }}>-</button>
                        <span className="text-sm w-4 text-center font-medium" style={{ color: "var(--text)" }}>{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.dishId, item.quantity + 1)} className="rounded p-1 w-6 h-6 flex items-center justify-center font-bold" style={{ backgroundColor: "var(--border)", color: "var(--text)" }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={submitAddDishes}
              disabled={selectedItems.length === 0 || adding}
              className={`mt-4 w-full rounded-lg py-3 font-bold text-white transition ${selectedItems.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
              style={{ backgroundColor: "var(--primary)", color: "white" }}
            >
              {adding ? t("admin.order_detail.actions.processing") : t("admin.order_detail.actions.confirm_add_dish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
