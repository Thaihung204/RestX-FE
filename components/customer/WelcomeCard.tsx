import { CrownFilled } from "@ant-design/icons";
import { Card, Grid, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface WelcomeCardProps {
  customerName?: string;
  tableNumber: string;
  rank?: string;
  onClick?: () => void;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({
  customerName,
  tableNumber,
  rank,
  onClick,
}) => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isSmallPhone = !screens.sm;

  return (
    <Card
      variant="borderless"
      onClick={onClick}
      hoverable={Boolean(onClick)}
      style={{
        borderRadius: 20,
        background: "var(--card)",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
      }}
      styles={{ body: { padding: isSmallPhone ? "18px 16px" : "24px 32px" } }}>
      {/* Decorative Glow */}
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: "var(--decoration-glow)",
          filter: "blur(60px)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isSmallPhone ? "flex-start" : "center",
          gap: isSmallPhone ? 12 : 16,
          flexWrap: isSmallPhone ? "wrap" : "nowrap",
        }}>
        <div>
          <Text
            style={{
              color: "var(--text-muted)",
              fontSize: isSmallPhone ? 12 : 13,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
            {t("customer_page.welcome_card.greeting")}
          </Text>
          <Title
            level={3}
            style={{
              color: "var(--text)",
              margin: "4px 0 0",
              fontSize: isSmallPhone ? 21 : 26,
              lineHeight: isSmallPhone ? 1.2 : 1.15,
              fontWeight: 700,
            }}>
            {customerName}
          </Title>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
            <CrownFilled style={{ color: "var(--gold)" }} />
            <Text style={{ color: "var(--gold)", fontSize: isSmallPhone ? 12 : 13 }}>
              {rank
                ? t(
                  `customer_page.welcome_card.rank_${rank.toLowerCase()}`,
                  rank,
                )
                : t("customer_page.welcome_card.gold_member")}
            </Text>
          </div>
        </div>

        <div style={{ textAlign: isSmallPhone ? "left" : "right", width: isSmallPhone ? "100%" : "auto" }}>
          <div
            style={{
              background: "var(--primary-soft)",
              border: "1px solid var(--primary-border)",
              borderRadius: 16,
              padding: isSmallPhone ? "9px 14px" : "10px 20px",
              backdropFilter: "blur(4px)",
            }}>
            <Text
              style={{
                display: "block",
                color: "var(--primary)",
                fontSize: 12,
                marginBottom: 2,
              }}>
              {t("customer_page.welcome_card.table_label")}
            </Text>
            <Text
              style={{
                color: "var(--text)",
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
