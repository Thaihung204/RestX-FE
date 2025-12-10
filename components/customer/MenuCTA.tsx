import { ArrowRightOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

interface MenuCTAProps {
  onViewMenu?: () => void;
}

const MenuCTA: React.FC<MenuCTAProps> = ({ onViewMenu }) => {
  return (
    <Card
      style={{
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        background: 'linear-gradient(135deg, #FF7A00 0%, #E06000 100%)',
        overflow: 'hidden',
        marginTop: 20,
      }}
      styles={{
        body: { padding: 0 },
      }}>
      <div style={{ position: 'relative', padding: 24 }}>
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 20,
            }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}>
              <ShoppingOutlined style={{ fontSize: 28, color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ margin: 0, color: 'white', fontSize: 20 }}>
                Khám phá thực đơn
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                Hơn 100 món ăn đặc sắc
              </Text>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.15)',
              padding: 16,
              borderRadius: 12,
              marginBottom: 20,
              backdropFilter: 'blur(10px)',
            }}>
            <Text style={{ color: 'white', fontSize: 14, display: 'block', marginBottom: 8 }}>
              Xem thực đơn, đặt món và theo dõi đơn hàng của bạn
            </Text>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Món chính', 'Khai vị', 'Đồ uống', 'Tráng miệng'].map((tag) => (
                <div
                  key={tag}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    color: 'white',
                  }}>
                  {tag}
                </div>
              ))}
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={onViewMenu}
            icon={<ArrowRightOutlined />}
            iconPlacement="end"
            style={{
              width: '100%',
              height: 48,
              borderRadius: 12,
              background: 'white',
              border: 'none',
              color: '#FF7A00',
              fontSize: 16,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}>
            Xem thực đơn ngay
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MenuCTA;
