"use client";

import axiosInstance from "@/lib/services/axiosInstance";
import {
    ComboSummaryDto,
    dishService,
    MenuCategory,
    MenuItem,
} from "@/lib/services/dishService";
import { formatVND } from "@/lib/utils/currency";
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

interface SelectedItem {
  /** dishId for dishes, comboId for combos */
  id: string;
  dishId?: string;
  comboId?: string;
  name: string;
  quantity: number;
  price: number;
  /** Sub-items to display for combos */
  details?: { dishName: string; quantity: number }[];
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
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMenu();
      setSelectedItems([]);
    }
  }, [isOpen]);

  const dishLookup = useMemo(() => {
    return categories.reduce<Record<string, MenuItem>>((acc, category) => {
      category.items.forEach((dish) => {
        if (dish.id) acc[dish.id] = dish;
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

  const handleAddItem = (dish: MenuItem) => {
    if (!dish.id) return;
    setSelectedItems((prev) => {
      const existing = prev.find((x) => x.id === dish.id);
      if (existing) {
        return prev.map((x) => x.id === dish.id ? { ...x, quantity: x.quantity + 1 } : x);
      }
      return [...prev, { id: dish.id!, dishId: dish.id!, name: dish.name || "", quantity: 1, price: dish.price ?? 0 }];
    });
  };

  const handleAddCombo = (combo: ComboSummaryDto) => {
    setSelectedItems((prev) => {
      const existing = prev.find((x) => x.id === combo.id);
      if (existing) {
        return prev.map((x) => x.id === combo.id ? { ...x, quantity: x.quantity + 1 } : x);
      }
      return [
        ...prev,
        {
          id: combo.id,
          comboId: combo.id,
          name: combo.name,
          quantity: 1,
          price: combo.price,
          details: combo.details.map((d) => ({
            dishName: d.dishName || dishLookup[d.dishId]?.name || d.dishId,
            quantity: d.quantity > 0 ? d.quantity : 1,
          })),
        },
      ];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems((prev) => prev.filter((x) => x.id !== id));
      return;
    }
    setSelectedItems((prev) => prev.map((x) => x.id === id ? { ...x, quantity } : x));
  };

  const submitAddDishes = async () => {
    if (selectedItems.length === 0) return;
    setAdding(true);
    try {
      const payload = {
        id: orderId,
        tableId,
        customerId,
        orderDetails: selectedItems.map((item) =>
          item.comboId
            ? { comboId: item.comboId, quantity: item.quantity, note: "" }
            : { dishId: item.dishId, quantity: item.quantity, note: "" },
        ),
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

  const totalCount = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex w-full max-w-4xl flex-col max-h-[85vh] rounded-xl shadow-xl"
        style={{ backgroundColor: "var(--card)" }}
      >
        {/* Header */}
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
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                {t("admin.order_detail.messages.loading")}
              </div>
            ) : categories.length > 0 || combos.length > 0 ? (
              <>
                {/* Combo section */}
                {combos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--primary)" }}>
                      Combo
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {combos.map((combo) => (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => handleAddCombo(combo)}
                          className="rounded-lg border p-3 text-left transition hover:-translate-y-1 hover:shadow-md"
                          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                          <div className="flex items-start gap-3">
                            {/* Combo image */}
                            {combo.imageUrl ? (
                              <img
                                src={combo.imageUrl}
                                alt={combo.name}
                                className="h-16 w-16 rounded-md object-cover flex-shrink-0"
                                style={{ border: "1px solid var(--border)" }}
                              />
                            ) : (
                              <div
                                className="h-16 w-16 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-semibold"
                                style={{ backgroundColor: "var(--border)", color: "var(--text-muted)" }}>
                                {t("admin.order_detail.messages.no_image")}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold" style={{ color: "var(--text)" }}>{combo.name}</p>
                                <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--primary)" }}>
                                  {formatVND(Number(combo.price || 0))}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-col gap-0.5">
                                {combo.details.map((d) => (
                                  <p key={d.id ?? d.dishId} className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    • {d.dishName || dishLookup[d.dishId]?.name || d.dishId} x{d.quantity > 0 ? d.quantity : 1}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular dish categories */}
                {categories.map((cat) => (
                  <div key={cat.categoryId} className="mb-6">
                    <h3 className="mb-3 text-lg font-bold" style={{ color: "var(--primary)" }}>{cat.categoryName}</h3>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                      {cat.items.map((dish) => (
                        <div
                          key={dish.id}
                          onClick={() => handleAddItem(dish)}
                          className="cursor-pointer rounded-lg border p-3 transition hover:-translate-y-1 hover:shadow-md"
                          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                          {dish.imageUrl ? (
                            <img src={dish.imageUrl} alt={dish.name} className="mb-2 h-24 w-full rounded-md object-cover" />
                          ) : (
                            <div className="mb-2 flex h-24 w-full items-center justify-center rounded-md text-xs font-semibold" style={{ backgroundColor: "var(--border)", color: "var(--text-muted)" }}>
                              {t("admin.order_detail.messages.no_image")}
                            </div>
                          )}
                          <h4 className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{dish.name}</h4>
                          <p className="text-sm font-medium mt-1" style={{ color: "var(--primary)" }}>
                            {formatVND(dish.price ?? 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>{t("admin.order_detail.messages.no_menu_items")}</p>
            )}
          </div>

          {/* Selected Items */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto" style={{ backgroundColor: "var(--surface)" }}>
            <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text)" }}>
              {t("admin.order_detail.sections.selected_items", { count: totalCount })}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedItems.map((item) => (
                <div key={item.id} className="rounded-lg border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                  {/* Main row */}
                  <div className="flex flex-col gap-1 p-3">
                    <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{item.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                        {formatVND(item.price * item.quantity)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="rounded p-1 w-6 h-6 flex items-center justify-center font-bold"
                          style={{ backgroundColor: "var(--border)", color: "var(--text)" }}>-</button>
                        <span className="text-sm w-4 text-center font-medium" style={{ color: "var(--text)" }}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="rounded p-1 w-6 h-6 flex items-center justify-center font-bold"
                          style={{ backgroundColor: "var(--border)", color: "var(--text)" }}>+</button>
                      </div>
                    </div>
                  </div>
                  {/* Combo children */}
                  {item.comboId && (item.details ?? []).length > 0 && (
                    <div className="px-3 pb-2 flex flex-col gap-0.5" style={{ borderTop: "1px dashed var(--border)", paddingTop: 6, background: "rgba(0,0,0,0.02)" }}>
                      {(item.details ?? []).map((d, i) => (
                        <p key={i} className="text-xs" style={{ color: "var(--text-muted)" }}>
                          • {d.dishName} x{d.quantity * item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={submitAddDishes}
              disabled={selectedItems.length === 0 || adding}
              className={`mt-4 w-full rounded-lg py-3 font-bold text-white transition ${selectedItems.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
              style={{ backgroundColor: "var(--primary)", color: "white" }}>
              {adding ? t("admin.order_detail.actions.processing") : t("admin.order_detail.actions.confirm_add_dish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
