import { ClockCircleFilled, PhoneFilled, StarFilled } from "@ant-design/icons";
import { Typography, Tag } from "antd";
import React from "react";

const { Title, Text } = Typography;

interface RestaurantHeaderProps {
  restaurantName: string;
  phone: string;
  hours: string;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurantName,
  phone,
  hours,
}) => {
  return (
    <div style={{ textAlign: "center" }}>
        {/* Badge */}
        <div style={{ marginBottom: 12 }}>
            <Tag 
                color="gold" 
                style={{ 
                    padding: "4px 12px", 
                    borderRadius: 20, 
                    border: "none", 
                    background: "linear-gradient(90deg, #D4AF37 0%, #FDD835 100%)",
                    color: "#000",
                    fontWeight: "bold",
                    boxShadow: "0 4px 10px rgba(212, 175, 55, 0.4)"
                }}
            >
                <StarFilled style={{ marginRight: 6 }} /> Michelin Selected
            </Tag>
        </div>

        {/* Name */}
        <Title
            level={1}
            style={{
            margin: "0 0 12px",
            color: "#fff",
            fontSize: "clamp(28px, 5vw, 42px)", // Responsive font size
            fontWeight: 800,
            letterSpacing: -1,
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
            fontFamily: "'Playfair Display', serif", // Suggest adding this font to layout
            }}
        >
            {restaurantName}
        </Title>

        {/* Meta Info Pill */}
        <div
            style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 24,
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
            padding: "8px 24px",
            borderRadius: 50,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PhoneFilled style={{ color: "#ff8f00" }} />
            <Text style={{ color: "#e0e0e0", fontSize: 13, fontWeight: 500 }}>{phone}</Text>
            </div>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClockCircleFilled style={{ color: "#ff8f00" }} />
            <Text style={{ color: "#e0e0e0", fontSize: 13, fontWeight: 500 }}>{hours}</Text>
            </div>
        </div>
    </div>
  );
};

export default RestaurantHeader;