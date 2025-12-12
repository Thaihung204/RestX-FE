'use client';

import React from 'react';
import { Typography, Row, Col, Button } from 'antd';

const { Title, Paragraph, Text } = Typography;

const AboutSection: React.FC = () => {
  const foodImages = [
    '/images/restaurant/dish1.png',
    '/images/restaurant/dish2.png',
    '/images/restaurant/dish3.png',
    '/images/restaurant/dish4.png',
    '/images/restaurant/dish5.png',
    '/images/restaurant/dish6.png',
  ];

  return (
    <section
      id="about"
      style={{
        background: '#1a1a1a',
        padding: '80px 24px',
      }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Row gutter={[48, 48]} align="middle">
          {/* Text Content */}
          <Col xs={24} lg={12}>
            <Title
              level={2}
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 400,
                fontFamily: 'serif',
                marginBottom: 16,
              }}>
              Về Chúng Tôi
            </Title>
            <Title
              level={3}
              style={{
                color: 'white',
                fontSize: 36,
                fontWeight: 400,
                fontFamily: 'serif',
                marginBottom: 24,
              }}>
              RestX Restaurant
            </Title>
            <Paragraph
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 16,
                lineHeight: 1.8,
                marginBottom: 24,
              }}>
              Tại RestX Restaurant, chúng tôi đặt khách hàng lên hàng đầu. Với đội ngũ nhân viên tận tâm và
              những công thức nấu ăn độc đáo, chúng tôi cam kết mang đến trải nghiệm ẩm thực tuyệt vời nhất.
              Mỗi món ăn được chế biến cẩn thận với nguyên liệu tươi ngon nhất, tạo nên hương vị đặc biệt
              không thể tìm thấy ở đâu khác. Chúng tôi xin chân thành cảm ơn sự ủng hộ của quý khách.
            </Paragraph>
            <Button
              type="link"
              style={{
                color: 'white',
                padding: 0,
                fontSize: 16,
                textDecoration: 'underline',
                height: 'auto',
              }}>
              Xem Thêm
            </Button>
          </Col>

          {/* Image Grid */}
          <Col xs={24} lg={12}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}>
              {foodImages.map((src, index) => (
                <div
                  key={index}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'rgba(255, 138, 61, 0.1)',
                    border: '2px solid rgba(255, 138, 61, 0.2)',
                    position: 'relative',
                  }}>
                  <img
                    src={src}
                    alt={`Món ăn ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default AboutSection;

