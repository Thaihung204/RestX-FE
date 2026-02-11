'use client';

import React from 'react';
import { Typography, Row, Col, Space } from 'antd';
import { ReadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DishResponseDto } from '@/lib/services/dishService';

const { Title, Paragraph, Text } = Typography;

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

  // Split menu into two columns for large screens
  const mid = Math.ceil(menu.length / 2);
  const leftCol = menu.slice(0, mid);
  const rightCol = menu.slice(mid);

  // If no menu, return null or empty state
  if (!menu.length) return null;

  /* Custom scrollbar styles */
  const scrollbarStyles = `
    .hide-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .hide-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .hide-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(255, 56, 11, 0.2);
      border-radius: 20px;
    }
    .hide-scrollbar:hover::-webkit-scrollbar-thumb {
      background-color: rgba(255, 56, 11, 0.5);
    }
  `;

  return (
    <>
      <style jsx global>{scrollbarStyles}</style>
      <section id="menu" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden', padding: '16px' }}>
        <div style={{ flexShrink: 0, textAlign: 'center', marginBottom: 24, paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ height: 1, width: 48, background: 'rgba(255, 56, 11, 0.4)' }}></div>
            <span style={{
              color: 'var(--primary)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: 14
            }}>
              {t('landing.menu.subtitle')}
            </span>
            <div style={{ height: 1, width: 48, background: 'rgba(255, 56, 11, 0.4)' }}></div>
          </div>

          <Title level={2} style={{ fontFamily: 'var(--font-display), serif', fontSize: 'clamp(2rem, 4vw, 3rem)', margin: 0 }}>
            {t('landing.menu.title')}
          </Title>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 16px', maxWidth: 1280, width: '100%', margin: '0 auto' }} className="hide-scrollbar">
          <Row gutter={[48, 32]}>
            <Col xs={24} lg={12}>
              {leftCol.map(item => (
                <div key={item.categoryId} style={{ marginBottom: 32 }}>
                  <Title level={3} style={{
                    fontFamily: 'var(--font-display), serif',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    marginBottom: 24,
                    paddingBottom: 12,
                    borderBottom: '1px solid rgba(255, 56, 11, 0.1)',
                    fontSize: 24
                  }}>
                    {item.categoryName}
                  </Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {item.items.map(dish => (
                      <div key={dish.id} className="group" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          flexShrink: 0,
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          <img
                            src={dish.imageUrl || dish.mainImageUrl || (dish.images && dish.images[0]?.imageUrl) || "https://placehold.co/100x100"}
                            alt={dish.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                          />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                            <h4 style={{ fontSize: 18, fontWeight: 'bold', margin: 0, color: 'var(--text)' }}>
                              {dish.name}
                            </h4>
                            <span style={{ flexGrow: 1, borderBottom: '2px dotted var(--border)', margin: '0 8px' }}></span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 16 }}>
                              {dish.price?.toLocaleString()}đ
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {dish.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Col>
            <Col xs={24} lg={12}>
              {rightCol.map(item => (
                <div key={item.categoryId} style={{ marginBottom: 32 }}>
                  <Title level={3} style={{
                    fontFamily: 'var(--font-display), serif',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    marginBottom: 24,
                    paddingBottom: 12,
                    borderBottom: '1px solid rgba(255, 56, 11, 0.1)',
                    fontSize: 24
                  }}>
                    {item.categoryName}
                  </Title>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {item.items.map(dish => (
                      <div key={dish.id} className="group" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          flexShrink: 0,
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                          <img
                            src={dish.imageUrl || dish.mainImageUrl || (dish.images && dish.images[0]?.imageUrl) || "https://placehold.co/100x100"}
                            alt={dish.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                          />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                            <h4 style={{ fontSize: 18, fontWeight: 'bold', margin: 0, color: 'var(--text)' }}>
                              {dish.name}
                            </h4>
                            <span style={{ flexGrow: 1, borderBottom: '2px dotted var(--border)', margin: '0 8px' }}></span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: 16 }}>
                              {dish.price?.toLocaleString()}đ
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {dish.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Col>
          </Row>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'center', padding: '16px' }}>
          <button style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            border: '2px solid var(--primary)',
            color: 'var(--primary)',
            background: 'transparent',
            borderRadius: 999,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >

            {t('landing.menu.view_all')}
            <ReadOutlined style={{ fontSize: 20 }} />
          </button>
        </div>
      </section>
    </>
  );
};

export default MenuSection;
