"use client";

import { AISuggestionItem } from "@/lib/types/ai";
import { formatVND } from "@/lib/utils/currency";
import {
  CloseOutlined,
  ShoppingCartOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Button, Modal, Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface SuggestionModalProps {
  item: AISuggestionItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: AISuggestionItem) => void;
  isLoading?: boolean;
}

export default function SuggestionModal({
  item,
  open,
  onClose,
  onAddToCart,
  isLoading,
}: SuggestionModalProps) {
  const { t } = useTranslation("common");

  if (!item) return null;

  const quantityRaw = Number(item.quantity ?? 1);
  const quantity =
    Number.isFinite(quantityRaw) && quantityRaw > 0
      ? Math.floor(quantityRaw)
      : 1;
  const basePriceRaw = Number(item.price ?? 0);
  const basePrice =
    Number.isFinite(basePriceRaw) && basePriceRaw > 0 ? basePriceRaw : 0;
  const totalPriceRaw = Number(item.totalPrice ?? basePrice * quantity);
  const totalPrice = Number.isFinite(totalPriceRaw) ? totalPriceRaw : 0;
  const resolvedBasePrice =
    basePrice > 0 ? basePrice : quantity > 0 ? totalPrice / quantity : 0;

  return (
    <Modal
      open={open}
      zIndex={2700}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      centered
      width="100%"
      style={{ maxWidth: 460, padding: 0 }}
      styles={{
        mask: {
          backdropFilter: "blur(12px)",
          background: "var(--modal-overlay)",
        },
        wrapper: { background: "transparent" },
        body: { background: "transparent", padding: 0 },
      }}>
      <div
        style={{
          position: "relative",
          background: "var(--card)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}>
        {/* Decorative blur */}
        <div
          style={{
            position: "absolute",
            top: -50,
            left: -50,
            width: 150,
            height: 150,
            background: "var(--primary)",
            filter: "blur(90px)",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        />

        {/* Close button */}
        <div
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
            border: "1px solid var(--border)",
          }}>
          <CloseOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />
        </div>

        {/* Image */}
        <div
          style={{
            width: "100%",
            height: 200,
            background: "var(--surface-subtle)",
            overflow: "hidden",
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
                opacity: 0.3,
              }}>
              <ShoppingCartOutlined
                style={{ fontSize: 48, color: "var(--text-muted)" }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "18px 18px 20px" }}>
          {/* Category tag */}
          {item.category && (
            <div style={{ marginBottom: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "var(--primary-soft)",
                  border: "1px solid var(--primary-border)",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}>
                <TagOutlined style={{ fontSize: 10 }} />
                {item.category}
              </span>
            </div>
          )}

          {/* Name */}
          <Text
            style={{
              display: "block",
              color: "var(--text)",
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: 6,
            }}>
            {item.dishName}
          </Text>

          {/* Price row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 14,
            }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "8px 10px",
              }}>
              <Text
                style={{
                  display: "block",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}>
                {t(
                  "customer_page.ai_popup.suggestion_modal.original_price",
                  "Giá gốc",
                )}
              </Text>
              <Text
                style={{ color: "var(--text)", fontSize: 14, fontWeight: 700 }}>
                {formatVND(resolvedBasePrice)}
              </Text>
            </div>

            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "8px 10px",
              }}>
              <Text
                style={{
                  display: "block",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}>
                {t(
                  "customer_page.ai_popup.suggestion_modal.quantity",
                  "Số lượng",
                )}
              </Text>
              <Text
                style={{ color: "var(--text)", fontSize: 14, fontWeight: 700 }}>
                {quantity}
              </Text>
            </div>

            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "8px 10px",
              }}>
              <Text
                style={{
                  display: "block",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}>
                {t(
                  "customer_page.ai_popup.suggestion_modal.total_price",
                  "Thành tiền",
                )}
              </Text>
              <Text
                style={{
                  color: "var(--danger, #ff4d4f)",
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                {formatVND(totalPrice)}
              </Text>
            </div>
          </div>

          {/* Reason */}
          {item.reason && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 18,
              }}>
              <Text
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  display: "block",
                  marginBottom: 4,
                }}>
                {t(
                  "customer_page.ai_popup.suggestion_modal.ai_reason",
                  "Gợi ý từ AI",
                )}
              </Text>
              <Text
                style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.6 }}>
                {item.reason}
              </Text>
            </div>
          )}

          {/* Add to cart button */}
          <Button
            type="primary"
            size="large"
            block
            icon={<ShoppingCartOutlined />}
            onClick={() => {
              onAddToCart(item);
              onClose();
            }}
            disabled={isLoading}
            style={{
              background: "var(--primary)",
              border: "none",
              height: 48,
              fontWeight: 700,
              fontSize: 15,
              boxShadow: "0 10px 25px var(--primary-glow)",
            }}>
            {t("menu_page.detail_modal.add_to_cart")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
