import { RightOutlined, SketchOutlined } from "@ant-design/icons";
import { Button, Card, Progress, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface PointsCardProps {
  currentPoints: number;
  pointsToNextReward: number;
  totalPointsNeeded: number;
}

const PointsCard: React.FC<PointsCardProps> = ({
  currentPoints,
  pointsToNextReward,
  totalPointsNeeded,
}) => {
  const { t } = useTranslation('common');
  const progress = (currentPoints / totalPointsNeeded) * 100;

  return (
    <Card
      variant="borderless"
      style={{
        height: "100%",
        borderRadius: 20,
        background: "var(--card)",
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
      }}
      styles={{
        body: {
          padding: 32,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}>
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          opacity: 0.03,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          position: "relative",
          zIndex: 1,
        }}>
        <div>
          <Text
            style={{
              color: "var(--text-muted)",
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
            {t('points_card.title')}
          </Text>
          <Title
            level={2}
            style={{
              color: "var(--text)",
              margin: "8px 0",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: -1,
            }}>
            {currentPoints}
            <span
              style={{
                fontSize: 16,
                fontWeight: 400,
                color: "var(--text-muted)",
                marginLeft: 8,
              }}>
              {t('points_card.points')}
            </span>
          </Title>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #D4AF37 0%, #FDD835 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)",
          }}>
          <SketchOutlined style={{ fontSize: 20, color: 'var(--text)' }} />
        </div>
      </div>

      <div style={{ marginTop: "auto", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
          <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>{t('points_card.gold_progress')}</Text>
          <Text style={{ color: "#FF380B", fontSize: 13 }}>
            {t('points_card.remaining_points', { count: pointsToNextReward })}
          </Text>
        </div>
        <Progress
          percent={progress}
          showInfo={false}
          strokeColor={{ "0%": "#D4AF37", "100%": "#ff5722" }}
          railColor="var(--border)"
          strokeLinecap="square"
          size={6}
        />

        <Button
          type="text"
          style={{
            marginTop: 20,
            padding: 0,
            color: "#D4AF37",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
          }}>
          {t('points_card.view_rewards')}{" "}
          <RightOutlined style={{ fontSize: 10, marginLeft: 4 }} />
        </Button>
      </div>
    </Card>
  );
};

export default PointsCard;
