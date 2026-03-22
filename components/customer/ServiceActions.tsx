import {
  BellOutlined,
  FileTextOutlined,
  SmileOutlined
} from "@ant-design/icons";
import { Col, Row, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";

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
          ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)"
          : "var(--surface)",
        borderRadius: 20,
        padding: "24px 16px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.3s ease",
        border: isActive ? "none" : "1px solid var(--border)",
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
        color: isActive ? "var(--text-inverse)" : "var(--primary)",
        filter: isActive ? "drop-shadow(0 2px 4px var(--modal-overlay))" : "none"
      }}>
        {icon}
      </div>
      <Text style={{
        color: isActive ? "var(--text)" : "var(--text-muted)",
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
  const { t } = useTranslation();
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Row gutter={[16, 16]} style={{ flex: 1 }}>
        <Col span={12}>
          <ActionButton
            icon={<BellOutlined />}
            title={t('customer_actions.call_service')}
            onClick={onAskService}
            isActive={true} // Highlight nút quan trọng nhất
          />
        </Col>
        <Col span={12}>
          <ActionButton
            icon={<FileTextOutlined />}
            title={t('customer_actions.request_bill')}
            onClick={onRequestBill}
          />
        </Col>
        <Col span={24}>
          <div
            onClick={onGiveFeedback}
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border)",
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
            <SmileOutlined style={{ color: "var(--text-muted)", fontSize: 20 }} />
            <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>{t('customer_actions.give_feedback')}</Text>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ServiceActions;