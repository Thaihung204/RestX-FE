import { GiftOutlined, StarOutlined } from '@ant-design/icons';
import { Card, Progress, Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

interface PointsCardProps {
  currentPoints: number;
  pointsToNextReward: number;
  totalPointsNeeded: number;
}

const PointsCard: React.FC<PointsCardProps> = ({
  currentPoints,
  pointsToNextReward,
  totalPointsNeeded,
}) => {
  const progress = (currentPoints / totalPointsNeeded) * 100;

  return (
    <Card
      style={{
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        background: 'linear-gradient(135deg, #FF7A00 0%, #E06000 100%)',
        overflow: 'hidden',
      }}
      styles={{
        body: { padding: 24 },
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}>
          <StarOutlined style={{ fontSize: 24, color: '#FFD700' }} />
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, display: 'block' }}>
            Điểm tích lũy
          </Text>
          <Title level={3} style={{ margin: 0, color: 'white', fontSize: 28, fontWeight: 700 }}>
            {currentPoints} điểm
          </Title>
        </div>
        <GiftOutlined style={{ fontSize: 32, color: 'rgba(255,255,255,0.3)' }} />
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.18)',
          padding: 16,
          borderRadius: 12,
          backdropFilter: 'blur(10px)',
        }}>
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: 'white', fontSize: 14 }}>
            Còn <strong>{pointsToNextReward} điểm</strong> nữa để nhận thưởng
          </Text>
        </div>
        <Progress
          percent={progress}
          strokeColor={{
            '0%': '#FFE082',
            '100%': '#FFB300',
          }}
          railColor="rgba(255,255,255,0.2)"
          showInfo={false}
          size={8}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>0 điểm</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {totalPointsNeeded} điểm
          </Text>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'rgba(255,215,0,0.18)',
          borderRadius: 8,
          border: '1px solid rgba(255,215,0,0.35)',
        }}>
        <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: 500 }}>
          Tích điểm mỗi lần thanh toán để đổi quà hấp dẫn
        </Text>
      </div>
    </Card>
  );
};

export default PointsCard;
