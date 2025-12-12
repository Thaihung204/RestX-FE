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
        borderRadius: 24,
        border: "none",
        overflow: "hidden",
        position: "relative",
        background: "#000",
        cursor: "pointer",
        marginTop: 16,
        boxShadow: "0 20px 50px -10px rgba(255, 87, 34, 0.25)",
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Background Image / Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%), url('/images/customer/menu-bg.jpg')", // Giả định có ảnh món ăn ngon làm nền
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "transform 0.5s ease",
        }}
      />
      
      {/* Content */}
      <div style={{ position: "relative", padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ maxWidth: "70%" }}>
            <div style={{ 
                display: "inline-block", 
                padding: "4px 12px", 
                background: "rgba(255, 87, 34, 0.2)", 
                border: "1px solid rgba(255, 87, 34, 0.4)",
                borderRadius: 20, 
                marginBottom: 12 
            }}>
                <Text style={{ color: "#ff8a65", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Season 2024</Text>
            </div>
            <Title level={2} style={{ color: "white", margin: 0, fontSize: 28, fontWeight: 700 }}>
                Khám phá Thực đơn
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8, display: "block", fontSize: 14 }}>
                Hơn 100+ món ăn tinh hoa được chế biến bởi các đầu bếp hàng đầu.
            </Text>
        </div>

        <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: "50%", 
            background: "#fff", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(255,255,255,0.3)"
        }}>
            <ArrowRightOutlined style={{ fontSize: 24, color: "#000" }} />
        </div>
      </div>
    </Card>
  );
};

export default MenuCTA;