"use client";

import MenuCTA from "@/components/customer/MenuCTA";
import PointsCard from "@/components/customer/PointsCard";
import RestaurantHeader from "@/components/customer/RestaurantHeader";
import ServiceActions from "@/components/customer/ServiceActions";
import WelcomeCard from "@/components/customer/WelcomeCard";
import { Col, Row, Space, Typography, message } from "antd";
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e8eef3 100%)",
      }}>
      {contextHolder}
      <RestaurantHeader
        restaurantName="RestX Dining"
        phone="1800 6868"
        hours="08:00 - 23:00"
      />

      <div
        style={{
          padding: "0 16px 32px",
          maxWidth: 1200,
          margin: "0 auto",
        }}>
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <WelcomeCard customerName="Quý khách" tableNumber={tableNumber} />

          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} md={14}>
              <PointsCard
                currentPoints={450}
                pointsToNextReward={50}
                totalPointsNeeded={500}
              />
            </Col>
            <Col xs={24} md={10}>
              <ServiceActions
                onRequestBill={handleRequestBill}
                onAskService={handleAskService}
                onGiveFeedback={handleGiveFeedback}
              />
            </Col>
          </Row>

          <MenuCTA onViewMenu={handleViewMenu} />
        </Space>

        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid #e0e0e0",
          }}>
          <Text style={{ color: "#9e9e9e", fontSize: 13 }}>
            Trải nghiệm gọi món số hóa cùng RestX
          </Text>
        </div>
      </div>
    </div>
  );
}
