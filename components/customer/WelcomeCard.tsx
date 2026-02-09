import { CrownFilled } from "@ant-design/icons";
import { Card, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface WelcomeCardProps {
  customerName?: string;
  tableNumber: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({
  customerName,
  tableNumber,
}) => {
  const { t } = useTranslation();

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 24,
        background: "linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%)",
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        overflow: "hidden",
      }}
      styles={{ body: { padding: "24px 32px" } }}>
      {/* Decorative Glow */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: "rgba(255, 87, 34, 0.15)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <div>
          <Text
            style={{
              color: "#888",
              fontSize: 13,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
            {t("customer_page.welcome_card.greeting")}
          </Text>
          <Title
            level={3}
            style={{
              color: "#fff",
              margin: "4px 0 0",
              fontSize: 26,
              fontWeight: 700,
            }}>
            {customerName || t("customer_page.welcome_card.default_name")}
          </Title>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
            <CrownFilled style={{ color: "#D4AF37" }} />
            <Text style={{ color: "#D4AF37", fontSize: 13 }}>
              {t("customer_page.welcome_card.gold_member")}
            </Text>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              background: "rgba(255, 87, 34, 0.1)",
              border: "1px solid rgba(255, 87, 34, 0.3)",
              borderRadius: 16,
              padding: "10px 20px",
              backdropFilter: "blur(4px)",
            }}>
            <Text
              style={{
                display: "block",
                color: "#FF380B",
                fontSize: 12,
                marginBottom: 2,
              }}>
              {t("customer_page.welcome_card.table_label")}
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 1,
              }}>
              {tableNumber}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;
