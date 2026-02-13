import { ArrowRightOutlined } from "@ant-design/icons";
import { Button, Card, Typography } from "antd";
import React from "react";

const { Title, Text } = Typography;

interface MenuCTAProps {
  onViewMenu?: () => void;
}

const MenuCTA: React.FC<MenuCTAProps> = ({ onViewMenu }) => {
  return (
    <Card
      hoverable
      onClick={onViewMenu}
      style={{
        borderRadius: 20,
        border: "1px solid var(--border)",
        overflow: "hidden",
        position: "relative",
        background: "var(--card)",
        cursor: "pointer",
        marginTop: 16,
        boxShadow: "var(--shadow-lg)",
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Background Image / Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, var(--card) 0%, var(--surface) 50%, transparent 100%), url('/images/customer/menu-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "transform 0.5s ease",
          opacity: 0.95,
        }}
      />
      
      {/* Content */}
      <div style={{ position: "relative", padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ maxWidth: "70%" }}>
            <div style={{ 
                display: "inline-block", 
                padding: "4px 12px", 
                background: "var(--primary-soft)", 
                border: "1px solid var(--primary-border)",
                borderRadius: 20, 
                marginBottom: 12 
            }}>
                <Text style={{ color: "var(--primary)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Season 2024</Text>
            </div>
            <Title level={2} style={{ color: "var(--text)", margin: 0, fontSize: 28, fontWeight: 700 }}>
                Khám phá Thực đơn
            </Title>
            <Text style={{ color: "var(--text-muted)", marginTop: 8, display: "block", fontSize: 14 }}>
                Hơn 100+ món ăn tinh hoa được chế biến bởi các đầu bếp hàng đầu.
            </Text>
        </div>

        <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: "50%", 
            background: "var(--primary)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "var(--shadow-md)"
        }}>
            <ArrowRightOutlined style={{ fontSize: 24, color: "var(--text-inverse)" }} />
        </div>
      </div>
    </Card>
  );
};

export default MenuCTA;