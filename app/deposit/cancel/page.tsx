"use client";

import { Button, Card, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

export default function DepositCancelPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reservationId, setReservationId] = useState<string | null>(null);

  useEffect(() => {
    // PayOS returns query params: orderCode, status, cancel, code, id
    // We also support a custom `reservationId` param set when building the cancel URL
    const rid =
      searchParams.get("reservationId") ||
      searchParams.get("id") ||
      null;
    setReservationId(rid);
  }, [searchParams]);

  const handleBack = () => {
    if (reservationId) {
      router.push(`/your-reservation/${encodeURIComponent(reservationId)}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--light-surface)",
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 16,
          border: "1px solid var(--light-card)",
          background: "var(--light-card)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
        }}
        styles={{ body: { padding: 32 } }}
      >
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Icon */}
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
            }}
          >
            ✕
          </div>

          <Title level={3} style={{ margin: 0, color: "var(--primary)" }}>
            {t("deposit.cancel.title")}
          </Title>

          <Text style={{ color: "rgba(0,0,0,0.65)" }}>
            {t("deposit.cancel.message")}
          </Text>

          <Button
            type="primary"
            size="large"
            style={{ borderRadius: 10 }}
            onClick={handleBack}
          >
            {reservationId
              ? t("deposit.cancel.back_to_reservation")
              : t("deposit.cancel.back_home")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
