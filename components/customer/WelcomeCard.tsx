import React from 'react';
import { Card, Typography, Badge } from 'antd';

const { Title, Text } = Typography;

interface WelcomeCardProps {
  customerName?: string;
  tableNumber: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ customerName, tableNumber }) => {
  return (
    <Card
      style={{
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
        overflow: 'hidden',
      }}
      styles={{
        body: { padding: 24 },
      }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #FF7A00 0%, #E06000 100%)',
            borderRadius: 16,
            padding: '8px 20px',
            marginBottom: 16,
            boxShadow: '0 4px 16px rgba(255, 122, 0, 0.3)',
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
            Bàn {tableNumber}
          </Text>
        </div>

        <Title level={4} style={{ margin: '16px 0 8px', color: '#1F1F1F', fontSize: 22 }}>
          Xin chào {customerName || 'Quý khách'}!
        </Title>

        <Text style={{ color: '#757575', fontSize: 15, display: 'block' }}>
          Chúc bạn có bữa ăn ngon miệng
        </Text>

        <div
          style={{
            marginTop: 20,
            padding: '16px',
            background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
            borderRadius: 12,
            border: '2px dashed #FF7A00',
          }}>
          <Text style={{ color: '#E65100', fontSize: 14, fontWeight: 500 }}>
            Quét mã QR trên bàn để xem thực đơn
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;
