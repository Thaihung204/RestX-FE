'use client';

import { Typography } from 'antd';

import React from 'react';

import { useTranslation } from 'react-i18next';

const { Title } = Typography;

import { DishResponseDto } from '@/lib/services/dishService';
import { Col, Row } from 'antd';

export interface MenuSectionCategory {
  categoryId: string;
  categoryName: string;
  items: DishResponseDto[];
}

interface MenuSectionProps {
  menu: MenuSectionCategory[];
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
              <div key={category.categoryId} style={{ marginBottom: 64 }}>
                {/* Category Title */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  marginBottom: 32
                }}>
                  <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, transparent, var(--border))' }} />
                  <Title level={3} style={{
                    color: 'var(--text)',
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 600,
                    fontFamily: 'serif',
                  }}>
                    {category.categoryName}
                  </Title>
                  <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg, var(--border), transparent)' }} />
                </div>

                {/* Dish Grid */}
                <Row gutter={[24, 24]}>
                  {category.items.map(dish => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={dish.id}>
                      <div
                        style={{
                          background: 'var(--card)',
                          borderRadius: 16,
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-8px)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        {/* Dish Image */}
                        <div style={{
                          position: 'relative',
                          height: 180,
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
                        }}>
                          <img
                            src={
                              dish.mainImageUrl ||
                              dish.imageUrl ||
                              (dish.images && dish.images.length > 0 ? dish.images[0].imageUrl : null) ||
                              '/images/logo/restx-removebg-preview.png'
                            }
                            alt={dish.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.5s ease',
                            }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/logo/restx-removebg-preview.png';
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                          />
                          {/* Price Badge */}
                          <div style={{
                            position: 'absolute',
                            bottom: 12,
                            right: 12,
                            background: 'linear-gradient(135deg, #FF6B3B 0%, #CC2D08 100%)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontWeight: 700,
                            fontSize: 14,
                            boxShadow: '0 4px 12px rgba(255, 56, 11, 0.4)',
                          }}>
                            {dish.price?.toLocaleString()}đ
                          </div>
                        </div>

                        {/* Dish Info */}
                        <div style={{ padding: 16 }}>
                          <h4 style={{
                            color: 'var(--text)',
                            margin: '0 0 8px 0',
                            fontSize: 16,
                            fontWeight: 600,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {dish.name}
                          </h4>
                          <p style={{
                            color: 'var(--text-muted)',
                            margin: 0,
                            fontSize: 13,
                            lineHeight: 1.5,
                            height: 40,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {dish.description || 'Món ăn hấp dẫn từ đầu bếp'}
                          </p>
                        </div>
                      </div>
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

