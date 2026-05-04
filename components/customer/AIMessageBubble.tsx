import { useCart } from "@/lib/contexts/CartContext";
import {
  AIComboSuggestion,
  AIMessage,
  AIOrderDraft,
  AIOrderDraftItem,
  AISuggestionItem,
} from "@/lib/types/ai";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SuggestionModal from "./SuggestionModal";

const { Text } = Typography;

interface AIMessageBubbleProps {
  msg: AIMessage;
  popupBg: string;
  robotAlt: string;
  formatVND: (amount: number) => string;
  editedDraftItems?: AIOrderDraftItem[];
  onDraftItemsChange: (messageId: string, items: AIOrderDraftItem[]) => void;
  onConfirmOrder: (messageId: string, draft: AIOrderDraft) => void;
  onAddSuggestionToCart: (item: AISuggestionItem) => void;
  onAddComboToCart: (combo: AIComboSuggestion) => void;
  isLoading: boolean;
  isConfirming: boolean;
}

const AssistantIcon = ({
  size,
  robotAlt,
}: {
  size: number;
  robotAlt: string;
}) => (
  <span
    aria-label={robotAlt}
    role="img"
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      backgroundColor: "var(--text)",
      WebkitMaskImage: 'url("/images/ai/assistant.png")',
      maskImage: 'url("/images/ai/assistant.png")',
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
      display: "inline-block",
    }}
  />
);

export default function AIMessageBubble({
  msg,
  popupBg,
  robotAlt,
  formatVND,
  editedDraftItems,
  onDraftItemsChange,
  onConfirmOrder,
  onAddSuggestionToCart,
  onAddComboToCart,
  isLoading,
  isConfirming,
}: AIMessageBubbleProps) {
  const { t } = useTranslation("common");
  const { cartItems, updateQuantity } = useCart();
  const draftItems = editedDraftItems ?? msg.orderDraft?.items ?? [];
  const shouldShowSuggestionScrollbar = (msg.suggestions?.length ?? 0) > 2;
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AISuggestionItem | null>(null);

  const updateDraftItemQuantity = (dishId: string, nextQuantity: number) => {
    const sourceItems = editedDraftItems ?? msg.orderDraft?.items ?? [];

    const updated = sourceItems.map((item) =>
      item.dishId === dishId
        ? { ...item, quantity: Math.max(0, nextQuantity) }
        : item,
    );

    onDraftItemsChange(msg.id, updated);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: msg.role === "user" ? "row-reverse" : "row",
        gap: 12,
        alignItems: "flex-start",
      }}>
      {msg.role === "assistant" ? (
        <AssistantIcon size={34} robotAlt={robotAlt} />
      ) : null}

      <div
        style={{
          maxWidth: "calc(100vw - 72px)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius:
              msg.role === "user" ? "18px 2px 18px 18px" : "2px 18px 18px 18px",
            background:
              msg.role === "user" ? "var(--primary)" : "var(--surface)",
            color: msg.role === "user" ? "var(--text-inverse)" : "var(--text)",
            boxShadow: "var(--shadow-sm)",
            fontSize: 15,
            lineHeight: "1.5",
            border: "1px solid var(--border)",
          }}>
          {msg.content}
        </div>

        {!!msg.suggestions?.length && (
          <>
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: shouldShowSuggestionScrollbar ? "scroll" : "auto",
                paddingBottom: 8,
                marginTop: 4,
                width: "calc(100vw - 80px)",
                scrollbarWidth: shouldShowSuggestionScrollbar ? "thin" : "none",
                msOverflowStyle: shouldShowSuggestionScrollbar
                  ? "auto"
                  : "none",
              }}
              className={
                shouldShowSuggestionScrollbar ? undefined : "hide-scrollbar"
              }>
              {msg.suggestions.map((item) => {
                const quantityRaw = Number(item.quantity ?? 1);
                const quantity =
                  Number.isFinite(quantityRaw) && quantityRaw > 0
                    ? Math.floor(quantityRaw)
                    : 1;
                const basePriceRaw = Number(item.price ?? 0);
                const basePrice =
                  Number.isFinite(basePriceRaw) && basePriceRaw > 0
                    ? basePriceRaw
                    : 0;
                const totalPriceRaw = Number(
                  item.totalPrice ?? basePrice * quantity,
                );
                const totalPrice = Number.isFinite(totalPriceRaw)
                  ? totalPriceRaw
                  : 0;

                return (
                  <div
                    key={item.dishId}
                    onClick={() => setSelectedSuggestion(item)}
                    style={{
                      width: 160,
                      minWidth: 160,
                      flexShrink: 0,
                      background: popupBg,
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                    }}>
                    {/* Image */}
                    <div
                      style={{
                        height: 100,
                        background: "var(--surface-subtle)",
                        flexShrink: 0,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.dishName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <img
                          src="/images/dishStatus/spicy.png"
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "contain",
                            opacity: 0.25,
                          }}
                        />
                      )}
                    </div>

                    {/* Body */}
                    <div
                      style={{
                        padding: "8px 10px 10px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                      }}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          color: "var(--text)",
                          fontSize: 13,
                          lineHeight: 1.3,
                          marginBottom: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {item.dishName}
                      </Text>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          marginTop: 4,
                        }}>
                        <Text
                          style={{
                            color: "var(--text-muted)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                          x{quantity}
                        </Text>
                        <Text
                          style={{
                            color: "var(--danger, #ff4d4f)",
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                          {formatVND(totalPrice)}
                        </Text>
                      </div>

                      {/* Reason — 2 lines max */}
                      {item.reason && (
                        <Text
                          style={
                            {
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              color: "var(--text-muted)",
                              fontSize: 11,
                              lineHeight: 1.4,
                              marginTop: 4,
                            } as React.CSSProperties
                          }>
                          {item.reason}
                        </Text>
                      )}

                      {/* Add / Qty controls */}
                      {(() => {
                        const cartItem = cartItems.find((c) => c.id === item.dishId);
                        if (cartItem) {
                          return (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                marginTop: "auto",
                                paddingTop: 8,
                              }}
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<MinusOutlined style={{ fontSize: 10 }} />}
                                onClick={() => updateQuantity(item.dishId, cartItem.quantity - 1)}
                                disabled={isLoading || isConfirming}
                                style={{
                                  color: "var(--text)",
                                  border: "1px solid var(--border)",
                                  width: 28, height: 28,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  padding: 0,
                                }}
                              />
                              <Text style={{ color: "var(--text)", fontSize: 13, fontWeight: 700, width: 20, textAlign: "center" }}>
                                {cartItem.quantity}
                              </Text>
                              <Button
                                type="text"
                                size="small"
                                icon={<PlusOutlined style={{ fontSize: 10 }} />}
                                onClick={(e) => { e.stopPropagation(); onAddSuggestionToCart(item); }}
                                disabled={isLoading || isConfirming}
                                style={{
                                  color: "var(--text)",
                                  border: "1px solid var(--border)",
                                  width: 28, height: 28,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  padding: 0,
                                }}
                              />
                            </div>
                          );
                        }
                        return (
                          <Button
                            type="primary"
                            size="small"
                            block
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddSuggestionToCart(item);
                            }}
                            disabled={isLoading || isConfirming}
                            style={{ marginTop: "auto", paddingTop: 8, fontSize: 11 }}
                          >
                            {t("menu_page.detail_modal.add_to_cart")}
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>

            <SuggestionModal
              item={selectedSuggestion}
              open={!!selectedSuggestion}
              onClose={() => setSelectedSuggestion(null)}
              onAddToCart={onAddSuggestionToCart}
              isLoading={isLoading || isConfirming}
            />
          </>
        )}

        {/* ── Combo suggestions ── */}
        {!!msg.combos?.length && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {msg.combos.map((combo, comboIdx) => {
              // Normalize: API may return comboName or name, totalPrice or price
              const raw = combo as any;
              const name: string = raw.comboName || raw.name || "";
              const imageUrl: string | null = raw.imageUrl || raw.image || null;
              const totalPrice: number = Number(raw.totalPrice ?? raw.price ?? 0);
              const reason: string = raw.reason || "";
              const items: any[] = raw.items || [];

              return (
              <div
                key={raw.comboId || comboIdx}
                style={{
                  background: popupBg,
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* Combo header */}
                <div style={{ display: "flex", gap: 10, padding: "10px 12px 8px" }}>
                  {/* Combo image */}
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <img
                        src="/images/dishStatus/spicy.png"
                        alt=""
                        style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.2 }}
                      />
                    )}
                  </div>

                  {/* Combo info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                      <Text
                        strong
                        style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.3, display: "block" }}
                      >
                        {name}
                      </Text>
                      <Text
                        style={{
                          color: "var(--danger, #ff4d4f)",
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {formatVND(totalPrice)}
                      </Text>
                    </div>

                    {reason && (
                      <Text
                        style={
                          {
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            color: "var(--text-muted)",
                            fontSize: 11,
                            lineHeight: 1.4,
                            marginTop: 3,
                          } as React.CSSProperties
                        }
                      >
                        {reason}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Combo items list */}
                {items.length > 0 && (
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      padding: "6px 12px 8px",
                      background: "var(--surface)",
                    }}
                  >
                    <Text
                      style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}
                    >
                      {t("customer_page.ai_popup.combo.includes", { defaultValue: "Bao gồm:" })}
                    </Text>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {items.map((item: any, idx: number) => {
                        const dishName: string = item.dishName || item.name || "";
                        const qty: number = Number(item.quantity ?? 1);
                        const itemTotal: number = Number(item.price ?? item.totalPrice ?? 0);
                        return (
                          <div
                            key={`${item.dishId || idx}`}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                              <span
                                style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 4,
                                  background: "var(--primary-soft)",
                                  color: "var(--primary)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {qty}x
                              </span>
                              <Text
                                style={{
                                  color: "var(--text)",
                                  fontSize: 12,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {dishName}
                              </Text>
                            </div>
                            <Text style={{ color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>
                              {formatVND(itemTotal)}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add combo to cart button */}
                <div style={{ padding: "8px 12px" }}>
                  {(() => {
                    const raw = combo as any;
                    const comboId: string = raw.comboId || raw.id || "";
                    const cartItem = cartItems.find((c) => c.id === comboId);
                    if (cartItem) {
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Button
                            type="text"
                            size="small"
                            icon={<MinusOutlined style={{ fontSize: 11 }} />}
                            onClick={() => updateQuantity(comboId, cartItem.quantity - 1)}
                            disabled={isLoading || isConfirming}
                            style={{
                              color: "var(--text)",
                              border: "1px solid var(--border)",
                              width: 32, height: 32,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          />
                          <Text style={{ color: "var(--text)", fontSize: 14, fontWeight: 700, width: 24, textAlign: "center" }}>
                            {cartItem.quantity}
                          </Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined style={{ fontSize: 11 }} />}
                            onClick={() => onAddComboToCart(combo)}
                            disabled={isLoading || isConfirming}
                            style={{
                              color: "var(--text)",
                              border: "1px solid var(--border)",
                              width: 32, height: 32,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <Button
                        type="primary"
                        size="small"
                        block
                        onClick={() => onAddComboToCart(combo)}
                        disabled={isLoading || isConfirming}
                        style={{ fontSize: 12 }}
                      >
                        {t("customer_page.ai_popup.combo.add_to_cart", { defaultValue: "Thêm combo vào giỏ" })}
                      </Button>
                    );
                  })()}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {!!msg.orderDraft?.items?.length && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 10,
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 8,
              }}>
              <Text strong style={{ margin: 0 }}>
                {t("customer_page.ai_popup.order_draft.title")}
              </Text>

              <Button
                type="primary"
                size="small"
                onClick={() => onConfirmOrder(msg.id, msg.orderDraft!)}
                loading={isConfirming}
                disabled={isLoading || isConfirming || draftItems.length === 0}>
                {t("customer_page.ai_popup.order_draft.confirm")}
              </Button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 7,
                overflowX: "auto",
                paddingBottom: 8,
              }}>
              {draftItems.map((item) => (
                <div
                  key={item.dishId}
                  style={{
                    minWidth: "min(260px, calc(100vw - 145px))",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "var(--card)",
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}>
                  {/* <div
                    style={{
                      position: "relative",
                      width: 72,
                      height: 72,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "#1a2336",
                      flexShrink: 0,
                    }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.dishName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#9bb0d3",
                          fontSize: 11,
                        }}>
                        No image
                      </div>
                    )}
                  </div> */}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "var(--text)",
                        fontSize: 12,
                        lineHeight: 1.15,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                      {item.dishName}
                    </Text>

                    <Text
                      style={{
                        display: "block",
                        color: "var(--primary)",
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        marginTop: 1,
                      }}>
                      {formatVND(item.price)}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 6px",
                    }}>
                    {item.quantity > 0 ? (
                      <>
                        <Button
                          type="text"
                          size="small"
                          icon={
                            <MinusOutlined
                              style={{ color: "var(--text)", fontSize: 10 }}
                            />
                          }
                          onClick={() =>
                            updateDraftItemQuantity(
                              item.dishId,
                              item.quantity - 1,
                            )
                          }
                          disabled={isLoading || isConfirming}
                          style={{
                            border: "1px solid var(--border)",
                            width: 25,
                            height: 25,
                            borderRadius: 7,
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            lineHeight: 1,
                          }}
                        />

                        <Text
                          strong
                          style={{
                            minWidth: 14,
                            textAlign: "center",
                            color: "var(--text)",
                            fontSize: 12,
                          }}>
                          {item.quantity}
                        </Text>

                        <Button
                          type="text"
                          size="small"
                          icon={
                            <PlusOutlined
                              style={{ color: "var(--text)", fontSize: 10 }}
                            />
                          }
                          onClick={() =>
                            updateDraftItemQuantity(
                              item.dishId,
                              item.quantity + 1,
                            )
                          }
                          disabled={isLoading || isConfirming}
                          style={{
                            border: "1px solid var(--border)",
                            width: 25,
                            height: 25,
                            borderRadius: 7,
                            background: "var(--surface)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            lineHeight: 1,
                          }}
                        />
                      </>
                    ) : (
                      <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined style={{ fontSize: 12 }} />}
                        onClick={() => updateDraftItemQuantity(item.dishId, 1)}
                        disabled={isLoading || isConfirming}
                        style={{
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                          width: 25,
                          minWidth: 25,
                          height: 25,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
