'use client';

import React from 'react';
import { Typography, Row, Col, Card } from 'antd';

const { Title, Text } = Typography;

interface Category {
  id: string;
  title: string;
  description: string;
  image: string;
}

const categories: Category[] = [
  {
    id: 'beef',
    title: 'Món bò',
    description: 'Các món bò được chế biến tinh tế với hương vị đặc biệt nhất',
    image: '/images/restaurant/beef.png',
  },
  {
    id: 'chicken',
    title: 'Món gà',
    description: 'Các món gà được chế biến tinh tế với hương vị đặc biệt nhất',
    image: '/images/restaurant/chicken.png',
  },
  {
    id: 'pork',
    title: 'Món heo',
    description: 'Các món heo được chế biến tinh tế với hương vị đặc biệt nhất',
    image: '/images/restaurant/pork.png',
  },
  {
    id: 'fish',
    title: 'Món cá',
    description: 'Các món cá được chế biến tinh tế với hương vị đặc biệt nhất',
    image: '/images/restaurant/fish.png',
  },
];

const FeaturedCategories: React.FC = () => {
  return (
    <section
      id="featured"
      style={{
        background: '#1a1a1a',
        padding: '80px 24px',
      }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Section Title */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <div
              style={{
                width: 40,
                height: 2,
                background: 'linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)',
              }}
            />
            <Title
              level={2}
              style={{
                color: 'white',
                fontSize: 48,
                fontWeight: 400,
                fontFamily: 'serif',
                margin: 0,
              }}>
              Danh mục nổi bật
            </Title>
            <div
              style={{
                width: 40,
                height: 2,
                background: 'linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)',
              }}
            />
          </div>
        </div>

        {/* Category Cards */}
        <Row gutter={[24, 24]}>
          {categories.map((category) => (
            <Col xs={24} sm={12} lg={6} key={category.id}>
              <Card
                hoverable
                style={{
                  background: '#2a2a2a',
                  border: '1px solid rgba(255, 138, 61, 0.2)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  height: '100%',
                }}
                styles={{
                  body: { padding: 0 },
                }}>
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    position: 'relative',
                    marginBottom: 16,
                    overflow: 'hidden',
                  }}>
                  <img
                    src={category.image}
                    alt={category.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                    }}
                  />
                </div>
                <div style={{ padding: '0 16px 20px' }}>
                  <Title
                    level={4}
                    style={{
                      color: 'white',
                      fontSize: 20,
                      marginBottom: 8,
                      fontWeight: 600,
                    }}>
                    {category.title}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>
                    {category.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Pagination Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'rgba(255, 138, 61, 0.3)',
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;

