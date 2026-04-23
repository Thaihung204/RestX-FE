"use client";

import feedbackService from "@/lib/services/feedbackService";
import { CloseOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { Button, Modal, Typography, message as antMessage } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface FeedbackModalProps {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeedbackModal({ open, orderId, onClose, onSuccess }: FeedbackModalProps) {
  const { t } = useTranslation("common");
  const [messageApi, contextHolder] = antMessage.useMessage();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const RATING_LABELS = [
    "",
    t("customer_page.feedback_modal.rating_1"),
    t("customer_page.feedback_modal.rating_2"),
    t("customer_page.feedback_modal.rating_3"),
    t("customer_page.feedback_modal.rating_4"),
    t("customer_page.feedback_modal.rating_5"),
  ];

  const reset = () => {
    setRating(0);
    setHovered(0);
    setComment("");
  };

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!orderId || rating === 0 || isSubmitting) return;

    const normalizedComment = comment.trim() || null;

    setIsSubmitting(true);
    try {
      await feedbackService.createFeedback(orderId, { rating, comment: normalizedComment });
      messageApi.success(t("customer_page.feedback_modal.success"));
      reset();
      onSuccess();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data || "";
      if (typeof serverMsg === "string" && serverMsg.includes("This order already has feedback")) {
        messageApi.warning(t("customer_page.feedback_modal.already_feedback"));
        reset();
        onSuccess(); // Close and consider it a success/done state
      } else {
        messageApi.error(t("customer_page.feedback_modal.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hovered || rating;
  const canSubmit = rating > 0 && !!orderId && !isSubmitting;
  const noOrder = !orderId;

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        zIndex={2700}
        onCancel={handleClose}
        footer={null}
        closeIcon={null}
        centered
        width="100%"
        style={{ maxWidth: 420, padding: 0 }}
        styles={{
          mask: {
            backdropFilter: "blur(12px)",
            background: "var(--modal-overlay)",
          },
          body: { background: "transparent", padding: 0 },
        }}
      >
        <div
          style={{
            position: "relative",
            background: "var(--card)",
            borderRadius: 20,
            padding: "24px 20px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Decorative blur */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 120,
              height: 120,
              background: "var(--primary)",
              filter: "blur(80px)",
              opacity: 0.12,
              pointerEvents: "none",
            }}
          />

          {/* Close button */}
          <div
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "1px solid var(--border)",
              zIndex: 10,
            }}
          >
            <CloseOutlined style={{ color: "var(--text-muted)", fontSize: 13 }} />
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Text
              style={{
                color: "var(--text)",
                fontSize: 18,
                fontWeight: 700,
                display: "block",
                marginBottom: 4,
              }}
            >
              {t("customer_page.feedback_modal.title")}
            </Text>
            <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {t("customer_page.feedback_modal.subtitle")}
            </Text>
          </div>

          {/* No order warning */}
          {noOrder && (
            <div
              style={{
                background: "rgba(255,77,79,0.08)",
                border: "1px solid rgba(255,77,79,0.25)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <Text style={{ color: "#ff4d4f", fontSize: 13 }}>
                {t("customer_page.feedback_modal.no_order")}
              </Text>
            </div>
          )}

          {/* Star Rating */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  onClick={() => !noOrder && setRating(star)}
                  onMouseEnter={() => !noOrder && setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  style={{
                    cursor: noOrder ? "not-allowed" : "pointer",
                    fontSize: 36,
                    lineHeight: 1,
                    opacity: noOrder ? 0.4 : 1,
                  }}
                >
                  {star <= displayRating ? (
                    <StarFilled style={{ color: "#faad14" }} />
                  ) : (
                    <StarOutlined style={{ color: "var(--border)" }} />
                  )}
                </div>
              ))}
            </div>
            <Text
              style={{
                color: displayRating ? "#faad14" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: 600,
                minHeight: 20,
                display: "block",
                transition: "color 0.2s",
              }}
            >
              {displayRating
                ? RATING_LABELS[displayRating]
                : t("customer_page.feedback_modal.select_star")}
            </Text>
          </div>

          {/* Comment textarea */}
          <div style={{ marginBottom: 20, marginTop: 16 }}>
            <Text
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                display: "block",
                marginBottom: 8,
              }}
            >
              {t("customer_page.feedback_modal.comment_label")}
            </Text>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={noOrder}
              placeholder={t("customer_page.feedback_modal.comment_placeholder")}
              rows={4}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "var(--text)",
                fontSize: 14,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
                opacity: noOrder ? 0.5 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              block
              size="large"
              onClick={handleClose}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                height: 48,
                fontWeight: 600,
                borderRadius: 10,
              }}
            >
              {t("customer_page.feedback_modal.skip")}
            </Button>
            <Button
              block
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!canSubmit}
              style={{
                background: "var(--primary)",
                border: "none",
                height: 48,
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 10,
                boxShadow: canSubmit ? "0 8px 20px var(--primary-glow)" : "none",
              }}
            >
              {isSubmitting
                ? t("customer_page.feedback_modal.submitting")
                : t("customer_page.feedback_modal.submit")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
