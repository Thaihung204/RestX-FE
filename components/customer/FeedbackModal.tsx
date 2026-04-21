"use client";

import { CloseOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { Button, Modal, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
}

const RATING_LABELS = ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Tuyệt vời"];

export default function FeedbackModal({ open, onClose, onSubmit }: FeedbackModalProps) {
  const { t } = useTranslation("common");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, feedback);
    setRating(0);
    setFeedback("");
  };

  const handleClose = () => {
    setRating(0);
    setFeedback("");
    onClose();
  };

  const displayRating = hovered || rating;

  return (
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
        body: {
          background: "transparent",
          padding: 0,
        },
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
            Đánh giá trải nghiệm
          </Text>
          <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Chia sẻ cảm nhận của bạn về bữa ăn hôm nay
          </Text>
        </div>

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
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{ cursor: "pointer", fontSize: 36, lineHeight: 1 }}
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
            {displayRating ? RATING_LABELS[displayRating] : "Chọn số sao"}
          </Text>
        </div>

        {/* Feedback textarea */}
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
            Nhận xét
          </Text>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
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
            Bỏ qua
          </Button>
          <Button
            block
            type="primary"
            size="large"
            onClick={handleSubmit}
            style={{
              background: "var(--primary)",
              border: "none",
              height: 48,
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 10,
              boxShadow: "0 8px 20px var(--primary-glow)",
            }}
          >
            Gửi & Thanh toán
          </Button>
        </div>
      </div>
    </Modal>
  );
}
