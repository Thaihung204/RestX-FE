"use client";

import MenuCTA from "@/components/customer/MenuCTA";
import PointsCard from "@/components/customer/PointsCard";
import RestaurantHeader from "@/components/customer/RestaurantHeader";
import ServiceActions from "@/components/customer/ServiceActions";
import WelcomeCard from "@/components/customer/WelcomeCard";
import { Col, ConfigProvider, Row, Space, Typography, message, theme } from "antd";
import { useState } from "react";

const { Text } = Typography;

export default function CustomerHomePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [tableNumber] = useState("C1");

  const handleRequestBill = () => {
    messageApi.success("Yêu cầu hóa đơn đã được gửi đến nhân viên!");
  };

  const handleAskService = () => {
    messageApi.success("Nhân viên sẽ đến bàn của bạn ngay!");
  };

  const handleGiveFeedback = () => {
    messageApi.info("Chức năng đánh giá đang được phát triển!");
  };

  const handleViewMenu = () => {
    messageApi.info("Đang chuyển đến trang thực đơn...");
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#ff5722",
          fontFamily: "'Playfair Display', 'Inter', sans-serif", // Giả lập font chữ sang trọng
        },
        components: {
          Message: {
            contentBg: "#ffffff",
            colorText: "#1f1f1f",
            borderRadiusLG: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            fontSize: 13,
            contentPadding: "6px 12px",
          }
        }
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#050505",
          backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(255, 87, 34, 0.15), transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(255, 87, 34, 0.05), transparent 40%)
          `,
          paddingBottom: 40,
        }}
      >
        {contextHolder}

        {/* Hero Section */}
        <section style={{ position: "relative", marginBottom: -60, zIndex: 1 }}>
          <div
            style={{
              height: 380,
              background: "url(/images/customer/customer.png) no-repeat center center / cover",
              position: "relative",
            }}
          >
            {/* Gradient Overlay for Text Readability */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, #050505 100%)",
              }}
            />
          </div>

          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "0 16px",
              position: "absolute",
              bottom: 80, // Lifted up
              left: 0,
              right: 0,
            }}
          >
            <RestaurantHeader
              restaurantName="RestX Premium Dining"
              phone="1900 6868"
              hours="08:00 - 23:00"
            />
          </div>
        </section>

        {/* Main Content */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 2 }}>
          <Space orientation="vertical" size={24} style={{ width: "100%" }}>
            
            <WelcomeCard customerName="Nguyễn Văn A" tableNumber={tableNumber} />

            <MenuCTA onViewMenu={handleViewMenu} />
            
            <Row gutter={[20, 20]} align="stretch">
              <Col xs={24} lg={14}>
                <PointsCard
                  currentPoints={450}
                  pointsToNextReward={50}
                  totalPointsNeeded={500}
                />
              </Col>
              <Col xs={24} lg={10}>
                <ServiceActions
                  onRequestBill={handleRequestBill}
                  onAskService={handleAskService}
                  onGiveFeedback={handleGiveFeedback}
                />
              </Col>
            </Row>

          </Space>

          {/* Footer Branding */}
          <div style={{ textAlign: "center", marginTop: 48, opacity: 0.5 }}>
            <Text style={{ color: "#888", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              Powered by RestX Experience
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}