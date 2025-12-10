import { ClockCircleOutlined, PhoneOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import React from "react";
const { Title, Text } = Typography;

interface RestaurantHeaderProps {
  restaurantName: string;
  phone: string;
  hours: string;
  logoPath?: string;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  restaurantName,
  phone,
  hours,
  logoPath = "/images/customer/logo.png",
}) => {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)",
        padding: "26px 16px",
        borderRadius: "0 0 24px 24px",
        boxShadow: "0 10px 30px rgba(210, 74, 0, 0.32)",
        marginBottom: 22,
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}>
          {/* Placeholder for restaurant logo */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 16,
              background: "linear-gradient(135deg, #FFE7D2 0%, #F4CFA8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: "bold",
              color: "#C0530E",
            }}>
            R
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Title
            level={3}
            style={{
              margin: 0,
              color: "white",
              fontSize: 24,
              fontWeight: 700,
            }}>
            {restaurantName}
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>
            Trải nghiệm thống nhất cho mọi nhà hàng đối tác RestX
          </Text>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          background: "rgba(255,255,255,0.15)",
          padding: "12px 16px",
          borderRadius: 12,
          backdropFilter: "blur(10px)",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <PhoneOutlined style={{ color: "white", fontSize: 16 }} />
          <Text style={{ color: "white", fontSize: 13 }}>{phone}</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <ClockCircleOutlined style={{ color: "white", fontSize: 16 }} />
          <Text style={{ color: "white", fontSize: 13 }}>{hours}</Text>
        </div>
      </div>
    </div>
  );
};

export default RestaurantHeader;
