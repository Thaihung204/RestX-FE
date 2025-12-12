import {
  BellOutlined,
  FileTextOutlined,
  SmileOutlined
} from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface ServiceActionsProps {
onRequestBill?: () => void;
onAskService?: () => void;
onGiveFeedback?: () => void;
}

interface ActionButtonProps {
icon: React.ReactElement;
title: string;
onClick?: () => void;
isActive?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
icon,
title,
onClick,
isActive = false,
}) => {
return (
  <div
    onClick={onClick}
    className="action-btn"
    style={{
      background: isActive 
          ? "linear-gradient(135deg, #ff5722 0%, #d84315 100%)" 
          : "rgba(255, 255, 255, 0.05)",
      borderRadius: 20,
      padding: "24px 16px",
      cursor: "pointer",
      textAlign: "center",
      transition: "all 0.3s ease",
      border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12
    }}
    // Lưu ý: Hover effects nên xử lý bằng CSS class hoặc CSS-in-JS library, 
    // ở đây dùng style inline cơ bản.
  >
    <div style={{ 
        fontSize: 28, 
        color: isActive ? "#fff" : "#ff7043",
        filter: isActive ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none"
    }}>
      {icon}
    </div>
    <Text style={{ 
        color: isActive ? "#fff" : "#ccc", 
        fontSize: 13, 
        fontWeight: 600,
        lineHeight: 1.4
    }}>
      {title}
    </Text>
  </div>
);
};

const ServiceActions: React.FC<ServiceActionsProps> = ({
onRequestBill,
onAskService,
onGiveFeedback,
}) => {
return (
  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
    <Row gutter={[16, 16]} style={{ flex: 1 }}>
      <Col span={12}>
        <ActionButton
          icon={<BellOutlined />}
          title="Gọi phục vụ"
          onClick={onAskService}
          isActive={true} // Highlight nút quan trọng nhất
        />
      </Col>
      <Col span={12}>
        <ActionButton
          icon={<FileTextOutlined />}
          title="Tính tiền"
          onClick={onRequestBill}
        />
      </Col>
      <Col span={24}>
          <div 
              onClick={onGiveFeedback}
              style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.2)",
                  borderRadius: 16,
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  cursor: "pointer",
                  height: "100%"
              }}
          >
              <SmileOutlined style={{ color: "#888", fontSize: 20 }} />
              <Text style={{ color: "#888", fontSize: 13 }}>Góp ý dịch vụ</Text>
          </div>
      </Col>
    </Row>
  </div>
);
};

export default ServiceActions;