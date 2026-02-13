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
                    background: "linear-gradient(90deg, var(--gold) 0%, var(--gold-bright) 100%)",
                    color: "var(--text-on-warning)",
                    fontWeight: "bold",
                    boxShadow: "0 4px 10px var(--gold-glow)"
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
            color: "var(--text)",
            fontSize: "clamp(28px, 5vw, 42px)", // Responsive font size
            fontWeight: 800,
            letterSpacing: -1,
            textShadow: "0 2px 8px var(--modal-overlay)",
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
            background: "var(--surface)",
            backdropFilter: "blur(12px)",
            padding: "8px 24px",
            borderRadius: 50,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PhoneFilled style={{ color: "var(--warning)" }} />
            <Text style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>{phone}</Text>
            </div>
            <div style={{ width: 1, height: 16, background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClockCircleFilled style={{ color: "var(--warning)" }} />
            <Text style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>{hours}</Text>
            </div>
        </div>
    </div>
  );
};

export default RestaurantHeader;