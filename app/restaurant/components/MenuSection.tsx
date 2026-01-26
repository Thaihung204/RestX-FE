'use client';

import { Typography } from 'antd';

import React from 'react';

import { useTranslation } from 'react-i18next';

const { Title } = Typography;

const MenuSection: React.FC = () => {

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

        {/* Menu content will be added here */}
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            {t('restaurant.menu_section.not_updated')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;

