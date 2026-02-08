'use client';

import { Button, Col, Row, Typography } from 'antd';
import React from 'react';


import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

import { TenantConfig } from '@/lib/services/tenantService';
import { useTenant } from '@/lib/contexts/TenantContext'; // Ensure this path is correct

interface AboutSectionProps {
  tenant: TenantConfig | null;
}

const AboutSection: React.FC<AboutSectionProps> = ({ tenant: propTenant }) => {
  const { tenant: contextTenant } = useTenant();
  const tenant = propTenant || contextTenant;

  const { t } = useTranslation();
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
        background: 'var(--bg-base)',
        padding: '80px 24px',
      }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Row gutter={[48, 48]} align="middle">
          {/* Text Content */}
          <Col xs={24} lg={12}>
            <Title
              level={2}
              style={{
                color: 'var(--text)',
                fontSize: 48,
                fontWeight: 400,
                fontFamily: 'serif',
                marginBottom: 16,
              }}>
              {t('restaurant.about.title')}
            </Title>
            <Title
              level={3}
              style={{
                color: 'var(--text)',
                fontSize: 36,
                fontWeight: 400,
                fontFamily: 'serif',
                marginBottom: 24,
              }}>
              {tenant?.name || t('restaurant.about.restaurant_name')}
            </Title>
            <Paragraph
              style={{
                color: 'var(--text-muted)',
                fontSize: 16,
                lineHeight: 1.8,
                marginBottom: 24,
              }}>
              {tenant?.aboutUs || t('restaurant.about.description')}
            </Paragraph>
            <Button
              type="link"
              style={{
                color: 'var(--text)',
                padding: 0,
                fontSize: 16,
                textDecoration: 'underline',
                height: 'auto',
              }}>
              {t('restaurant.about.see_more')}
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

