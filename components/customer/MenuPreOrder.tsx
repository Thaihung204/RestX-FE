"use client";

import dishService, {
  MenuCategory,
  MenuItem,
} from "@/lib/services/dishService";
import { formatVND } from "@/lib/utils/currency";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export interface PreOrderSelectionItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  imageUrl?: string;
}

interface MenuPreOrderProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (items: PreOrderSelectionItem[]) => Promise<void> | void;
}

export default function MenuPreOrder({
  open,
  submitting = false,
  onClose,
  onConfirm,
}: MenuPreOrderProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<PreOrderSelectionItem[]>(
    [],
  );

  // Mobile cart drawer state
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Details modal state
  const [foodDetailModalOpen, setFoodDetailModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<MenuItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    let active = true;
    const loadMenu = async () => {
      setLoading(true);
      try {
        const menu = await dishService.getMenu();
        if (active) {
          setCategories(menu || []);
          setSelectedItems([]);
          setSearch("");
          setShowMobileCart(false);
        }
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMenu();
    return () => {
      active = false;
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;

    return categories
      .map((category) => ({
        ...category,
        items: (category.items || []).filter((item) =>
          (item.name || "").toLowerCase().includes(keyword),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, search]);

  const totalSelectedItems = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems],
  );

  const totalAmount = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  const addDish = (dish: MenuItem) => {
    if (!dish.id) return;

    setSelectedItems((prev) => {
      const existed = prev.find((item) => item.dishId === dish.id);
      if (existed) {
        return prev.map((item) =>
          item.dishId === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...prev,
        {
          dishId: dish.id,
          name: dish.name || dish.id,
          price: Number(dish.price || 0),
          quantity: 1,
          note: "",
          imageUrl: dish.imageUrl,
        },
      ];
    });
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems((prev) => {
        const next = prev.filter((item) => item.dishId !== dishId);
        if (next.length === 0) setShowMobileCart(false);
        return next;
      });
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) =>
        item.dishId === dishId ? { ...item, quantity } : item,
      ),
    );
  };

  const updateNote = (dishId: string, note: string) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.dishId === dishId ? { ...item, note } : item)),
    );
  };

  const handleConfirm = async () => {
    if (selectedItems.length === 0 || submitting) return;
    await onConfirm(selectedItems);
  };

  if (!open || !mounted) return null;

  return createPortal(
    // Full screen overlay
    <div className="fixed inset-0 z-[5000] bg-[var(--bg-base)] flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 sm:h-20 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-8 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface)] hover:brightness-95 transition-colors text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-base sm:text-xl font-black text-[var(--text)]">
              {t("reservation_detail.order.popup_title")}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] hidden sm:block">
              {t("reservation_detail.order.popup_desc")}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("reservation_detail.order.search_menu")}
              className="w-full pl-11 pr-4 py-2.5 rounded-full text-sm bg-[var(--bg-base)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden p-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("reservation_detail.order.search_menu")}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm bg-[var(--bg-base)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-all"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative bg-[var(--bg-base)]">
        {/* MENU SECTION */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-32 lg:pb-8 relative">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
              <div className="w-10 h-10 border-4 border-t-transparent border-[var(--primary)] rounded-full animate-spin"></div>
              <p className="font-semibold">{t("reservation_detail.loading")}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
              <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="font-semibold">
                {t("reservation_detail.order.no_menu_items")}
              </p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-10">
              {filteredCategories.map((category) => (
                <div key={category.categoryId}>
                  <h3 className="text-lg sm:text-xl font-black mb-3 sm:mb-4 flex items-center gap-2 text-[var(--text)]">
                    <span className="w-2 h-5 sm:h-6 rounded-full bg-[var(--primary)] block"></span>
                    {category.categoryName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(category.items || []).map((dish) => {
                      const quantityInCart =
                        selectedItems.find((i) => i.dishId === dish.id)
                          ?.quantity || 0;

                      return (
                        <div
                          key={dish.id}
                          className="bg-[var(--card)] rounded-xl border border-[var(--border)] hover:shadow-sm transition-all cursor-pointer p-[10px] sm:p-3 relative"
                          onClick={() => {
                            setSelectedFood(dish);
                            setFoodDetailModalOpen(true);
                          }}>
                          <div className="flex flex-row items-center gap-2 sm:gap-3">
                            {/* Image Section */}
                            <div className="relative w-[72px] h-[72px] sm:w-[85px] sm:h-[85px] shrink-0">
                              {dish.isBestSeller && (
                                <div className="absolute top-0 left-0 bg-[#FFC107] text-[#000] px-[6px] py-[2px] text-[10px] font-bold rounded-br-lg z-10">
                                  {t("reservation_detail.order.best_seller")}
                                </div>
                              )}
                              {dish.imageUrl ? (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.name}
                                  className="w-full h-full object-cover rounded-xl border border-[var(--stroke-subtle)]"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--surface-subtle)] rounded-xl border border-[var(--stroke-subtle)]">
                                  <img
                                    src="/images/dishStatus/spicy.png"
                                    alt="No image"
                                    className="w-4 h-4 object-contain opacity-50"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 min-w-0 flex flex-col">
                              <span className="font-semibold text-[var(--text)] text-[15px] sm:text-[16px] leading-tight truncate mb-1">
                                {dish.name}
                              </span>
                              <span className="font-bold text-[var(--primary)] text-[15px] sm:text-[16px] block">
                                {formatVND(Number(dish.price || 0))}
                              </span>

                              {/* Tags */}
                              <div className="flex gap-1 mt-1.5 items-center">
                                {dish.isSpicy && (
                                  <img
                                    src="/images/dishStatus/spicy.png"
                                    alt="Spicy"
                                    className="w-3 h-3 object-contain"
                                  />
                                )}
                                {dish.isVegetarian && (
                                  <img
                                    src="/images/dishStatus/vegetable.png"
                                    alt="Vegan"
                                    className="w-3 h-3 object-contain"
                                  />
                                )}
                                {dish.isBestSeller && (
                                  <svg
                                    className="w-3 h-3 text-[var(--warning)]"
                                    fill="currentColor"
                                    viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Quick Add / Quantity Controls */}
                            <div className="shrink-0">
                              {quantityInCart > 0 ? (
                                <div
                                  className="flex items-center gap-1 bg-[var(--card)] py-1 px-1.5"
                                  onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        dish.id,
                                        quantityInCart - 1,
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center text-[var(--text)] border border-[var(--border)] rounded transition-colors">
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2.5}
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M20 12H4"
                                      />
                                    </svg>
                                  </button>
                                  <span className="w-5 text-center text-sm font-semibold text-[var(--text)]">
                                    {quantityInCart}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        dish.id,
                                        quantityInCart + 1,
                                      )
                                    }
                                    className="w-8 h-8 flex items-center justify-center text-[var(--text)] border border-[var(--border)] rounded transition-colors">
                                    <svg
                                      className="w-3.5 h-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth={2.5}
                                      viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4v16m8-8H4"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addDish(dish);
                                  }}
                                  className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:brightness-110 transition-colors shadow-sm">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                    viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Food Detail Modal */}
        {foodDetailModalOpen && selectedFood && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setFoodDetailModalOpen(false)}
            />
            <div className="relative bg-[var(--card)] rounded-[20px] w-full max-w-[400px] border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={() => setFoodDetailModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] backdrop-blur-[4px] shadow-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <div className="w-full aspect-[4/3] rounded-[16px] overflow-hidden mb-5 border border-[var(--border)] shadow-md relative">
                  {selectedFood.imageUrl ? (
                    <img
                      src={selectedFood.imageUrl}
                      alt={selectedFood.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface)] flex items-center justify-center">
                      <img
                        src="/images/dishStatus/spicy.png"
                        alt="No image"
                        className="w-6 h-6 opacity-50"
                      />
                    </div>
                  )}
                  {selectedFood.isBestSeller && (
                    <div className="absolute top-[10px] left-[10px] bg-[var(--warning)] text-[var(--text-on-warning)] px-3 py-1.5 rounded-[20px] text-[11px] font-bold flex items-center gap-1 shadow-sm backdrop-blur-[4px]">
                      <svg
                        className="w-[10px] h-[10px]"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {t("reservation_detail.order.best_seller")}
                    </div>
                  )}
                </div>

                <h3 className="text-[18px] sm:text-[24px] font-bold text-[var(--text)] mb-2 sm:mb-3 tracking-[0.5px]">
                  {selectedFood.name}
                </h3>

                {(selectedFood.isBestSeller ||
                  selectedFood.isSpicy ||
                  selectedFood.isVegetarian) && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {selectedFood.isBestSeller && (
                      <span className="bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-border)] px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-[5px]">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {t("reservation_detail.order.best_seller")}
                      </span>
                    )}
                    {selectedFood.isSpicy && (
                      <span className="bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-[5px]">
                        <img
                          src="/images/dishStatus/spicy.png"
                          alt="Spicy"
                          className="w-4 h-4 object-contain"
                        />
                        {t("reservation_detail.order.spicy")}
                      </span>
                    )}
                    {selectedFood.isVegetarian && (
                      <span className="bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-[5px]">
                        <img
                          src="/images/dishStatus/vegetable.png"
                          alt="Vegan"
                          className="w-4 h-4 object-contain"
                        />
                        {t("reservation_detail.order.vegan")}
                      </span>
                    )}
                  </div>
                )}

                {/* Description Box */}
                <div className="bg-[var(--surface)] p-4 rounded-[12px] border border-[var(--border)] mb-6">
                  <p className="text-[14px] text-[var(--text-muted)] leading-[1.7]">
                    {selectedFood.description ||
                      t("reservation_detail.order.no_description")}
                  </p>
                </div>

                {/* Action Bar (Price + Add) */}
                <div className="bg-[var(--surface)] backdrop-blur-[10px] p-[16px_20px] rounded-[12px] border border-[var(--border)] flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-[1px] block mb-[2px]">
                      {t("reservation_detail.order.price_label")}
                    </span>
                    <div className="text-[18px] sm:text-[20px] font-bold text-[var(--text)]">
                      {Number(selectedFood.price || 0)}{" "}
                      <span className="text-[14px] text-[var(--primary)]">
                        đ
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const qty =
                      selectedItems.find((i) => i.dishId === selectedFood.id)
                        ?.quantity || 0;
                    if (qty > 0) {
                      return (
                        <div className="flex items-center justify-center min-w-[118px]">
                          <button
                            onClick={() =>
                              updateQuantity(selectedFood.id, qty - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-[var(--text)] border border-[var(--border)] rounded transition-colors">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="w-5 text-center text-[14px] font-semibold text-[var(--text)] mx-2">
                            {qty}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(selectedFood.id, qty + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-[var(--text)] border border-[var(--border)] rounded transition-colors">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => {
                          addDish(selectedFood);
                          setFoodDetailModalOpen(false);
                        }}
                        className="h-[36px] px-4 rounded-[6px] bg-[var(--primary)] text-white font-normal text-[14px] transition-all flex items-center justify-center gap-2">
                        <svg
                          className="w-[14px] h-[14px]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        {t("reservation_detail.order.add_to_cart")}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CART OVERLAY FOR MOBILE */}
        {showMobileCart && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowMobileCart(false)}
          />
        )}

        {/* CART SECTION (Sliding Drawer on Mobile / Fixed column on Desktop) */}
        <div
          className={`
                        fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] lg:static lg:w-[400px] xl:w-[480px]
                        bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shadow-2xl lg:shadow-none
                        transform transition-transform duration-300 ease-out
                        ${showMobileCart ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
                    `}>
          {/* Cart Header */}
          <div className="h-16 sm:h-20 border-b border-[var(--border)] px-4 sm:px-6 flex items-center gap-4 shrink-0 bg-[var(--card)]">
            <button
              onClick={() => setShowMobileCart(false)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2 text-[var(--text)]">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {t("reservation_detail.order.cart")}
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--primary-soft)] text-[var(--primary)]">
                {totalSelectedItems}
              </span>
            </h3>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[var(--surface)]">
            {selectedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)] border-dashed">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--text)]">
                    {t("reservation_detail.order.empty_cart")}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {t("reservation_detail.order.empty_cart_desc")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedItems.map((item) => (
                  <div
                    key={item.dishId}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex gap-4 shadow-sm relative group transition-shadow hover:shadow-md">
                    {/* Optional Item Image in Cart */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-base)] shrink-0 hidden sm:block border border-[var(--border)]">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] opacity-50">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-[var(--text)] text-sm leading-snug pr-6">
                          {item.name}
                        </h5>
                        <button
                          onClick={() => updateQuantity(item.dishId, 0)}
                          className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--danger)] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Xoá món">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-black text-[var(--primary)] text-sm">
                          {formatVND(item.price * item.quantity)}
                        </span>

                        <div className="flex items-center bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden h-8">
                          <button
                            onClick={() =>
                              updateQuantity(item.dishId, item.quantity - 1)
                            }
                            className="w-8 h-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card)] hover:text-[var(--danger)] transition-colors">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[var(--text)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.dishId, item.quantity + 1)
                            }
                            className="w-8 h-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--card)] hover:text-[var(--primary)] transition-colors">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 relative">
                        <div className="absolute top-2 left-2.5 text-[var(--text-muted)]">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                            />
                          </svg>
                        </div>
                        <input
                          value={item.note || ""}
                          onChange={(e) =>
                            updateNote(item.dishId, e.target.value)
                          }
                          placeholder={t(
                            "reservation_detail.order.note_placeholder",
                          )}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg-base)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-colors placeholder:text-xs text-[var(--text)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 sm:p-6 bg-[var(--card)] border-t border-[var(--border)] shrink-0 z-10 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--text-muted)] font-semibold text-sm uppercase tracking-wider">
                {t("reservation_detail.order.total")}
              </span>
              <span className="text-xl sm:text-2xl font-black text-[var(--primary)]">
                {formatVND(totalAmount)}
              </span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0 || submitting}
              className={`
                                w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all
                                ${
                                  selectedItems.length === 0
                                    ? "bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
                                    : "bg-[var(--primary)] text-[var(--on-primary)] hover:brightness-110 hover:-translate-y-0.5 shadow-xl shadow-[var(--primary)]/30 active:scale-[0.98]"
                                }
                            `}>
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[var(--on-primary)]/30 border-t-[var(--on-primary)] rounded-full animate-spin"></div>
                  {t("reservation_detail.order.creating_pre_order")}
                </>
              ) : (
                <>
                  <span>{t("reservation_detail.order.confirm_pre_order")}</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE FLOATING CART BUTTON */}
        {!showMobileCart && totalSelectedItems > 0 && (
          <div className="absolute bottom-6 left-4 right-4 lg:hidden z-30 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <button
              onClick={() => setShowMobileCart(true)}
              className="w-full bg-[var(--primary)] text-[var(--on-primary)] rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-[var(--primary)]/40 hover:-translate-y-1 transition-transform active:scale-[0.98]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-[var(--on-primary)] text-[var(--primary)] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                    {totalSelectedItems}
                  </span>
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">
                  {t("reservation_detail.order.view_cart")}
                </span>
              </div>
              <span className="font-black text-base sm:text-lg bg-black/10 px-3 py-1 rounded-xl">
                {formatVND(totalAmount)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
