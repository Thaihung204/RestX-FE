'use client';

import { Typography } from 'antd';

import React from 'react';

import { useTranslation } from 'react-i18next';

const { Title } = Typography;

import { MenuCategory } from '@/lib/services/dishService';
import { Col, Row, Card } from 'antd';

interface MenuSectionProps {
  menu: MenuCategory[];
}

const MenuSection: React.FC<MenuSectionProps> = ({ menu = [] }) => {

  const { t } = useTranslation();

  return (
    <section
      id="menu"
      style={{
        background: 'var(--bg-base)',
        padding: '80px 24px',
      }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Section Title */}
        <div style={{ textAlign: 'center' }}>
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
                color: 'var(--text)',
                fontSize: 48,
                fontWeight: 400,
                fontFamily: 'serif',
                margin: 0,
              }}>
              {t('restaurant.menu_section.title')}
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

        {/* Menu content */}
        <div style={{ marginTop: 48 }}>
          {menu.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                {t('restaurant.menu_section.not_updated')}
              </p>
            </div>
          ) : (
            menu.map(category => (
              <div key={category.categoryId} style={{ marginBottom: 48 }}>
                <Title level={3} style={{ color: 'var(--text)', marginBottom: 24, textAlign: 'center' }}>
                  {category.categoryName}
                </Title>
                <Row gutter={[24, 24]}>
                  {category.items.map(dish => (
                    <Col xs={24} sm={12} lg={8} key={dish.id}>
                      <Card
                        hoverable
                        cover={<img alt={dish.name} src={dish.imageUrl || '/images/placeholder-food.png'} style={{ height: 200, objectFit: 'cover' }} />}
                        style={{ background: 'var(--bg-paper)', borderColor: 'var(--border)' }}
                      >
                        <Card.Meta
                          title={<span style={{ color: 'var(--text)' }}>{dish.name}</span>}
                          description={
                            <div>
                              <p style={{ color: 'var(--text-muted)', marginBottom: 8, minHeight: 40 }}>{dish.description}</p>
                              <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 18 }}>
                                {dish.price.toLocaleString()} {dish.unit}
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default MenuSection;

