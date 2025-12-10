import {
  CommentOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface ServiceActionsProps {
  onRequestBill?: () => void;
  onAskService?: () => void;
  onGiveFeedback?: () => void;
}

interface ActionButtonProps {
  icon: React.ReactElement<{ style?: React.CSSProperties }>;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  title,
  description,
  color,
  onClick,
}) => {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      styles={{
        body: { padding: 20, textAlign: 'center' },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          border: `2px solid ${color}20`,
        }}>
        {React.cloneElement(icon, {
          style: { fontSize: 32, color: color },
        })}
      </div>
      <Text
        strong
        style={{
          display: 'block',
          fontSize: 16,
          color: '#1F1F1F',
          marginBottom: 6,
        }}>
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: '#757575', display: 'block', lineHeight: 1.4 }}>
        {description}
      </Text>
    </Card>
  );
};

const ServiceActions: React.FC<ServiceActionsProps> = ({
  onRequestBill,
  onAskService,
  onGiveFeedback,
}) => {
  return (
    <div style={{ marginTop: 20 }}>
      <Typography.Title level={5} style={{ marginBottom: 16, color: '#1F1F1F', fontSize: 18 }}>
        Dịch vụ
      </Typography.Title>
      <Row gutter={[12, 12]}>
        <Col xs={24} sm={8}>
          <ActionButton
            icon={<FileTextOutlined />}
            title="Yêu cầu hóa đơn"
            description="Thanh toán và nhận hóa đơn nhanh chóng"
            color="#FF5722"
            onClick={onRequestBill}
          />
        </Col>
        <Col xs={24} sm={8}>
          <ActionButton
            icon={<CustomerServiceOutlined />}
            title="Gọi phục vụ"
            description="Nhân viên sẽ đến ngay"
            color="#2196F3"
            onClick={onAskService}
          />
        </Col>
        <Col xs={24} sm={8}>
          <ActionButton
            icon={<CommentOutlined />}
            title="Đánh giá"
            description="Chia sẻ trải nghiệm của bạn"
            color="#4CAF50"
            onClick={onGiveFeedback}
          />
        </Col>
      </Row>
    </div>
  );
};

export default ServiceActions;
