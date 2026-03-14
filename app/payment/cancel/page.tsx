"use client";

import { Button, Card, Typography } from "antd";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function PaymentCancelPage() {
  const { t } = useTranslation();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--light-surface)",
        padding: 24,
      }}>
      <Card
        style={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 16,
          border: "1px solid var(--light-card)",
          background: "var(--light-card)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
        }}
        styles={{ body: { padding: 32 } }}>
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              margin: "0 auto",
            }}>
            ✕
          </div>
          <Title level={3} style={{ margin: 0, color: "var(--primary)" }}>
            {t("payment.cancel.title")}
          </Title>
          <Text style={{ color: "rgba(0,0,0,0.65)" }}>
            {t("payment.cancel.message")}
          </Text>
          <Link href="/staff/orders">
            <Button type="primary" size="large" style={{ borderRadius: 10 }}>
              {t("payment.cancel.back")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
