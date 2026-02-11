'use client';

import { useTenant } from '@/lib/contexts/TenantContext'; // Ensure this path is correct
import { Button, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

import { TenantConfig } from '@/lib/services/tenantService';

interface RestaurantHeroProps {
  tenant: TenantConfig | null;
}

const RestaurantHero: React.FC<RestaurantHeroProps> = ({ tenant: propTenant }) => {
  const { t } = useTranslation();
  const { tenant: contextTenant } = useTenant();
  const tenant = propTenant || contextTenant;

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        overflow: 'hidden',
      }}>
      {/* Banner Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}>
        <img
          src={(tenant?.backgroundUrl && tenant.backgroundUrl.trim() !== '') ? tenant.backgroundUrl : "/images/restaurant/banner.png"}
          alt="Restaurant Banner"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          onError={(e) => { e.currentTarget.src = '/images/restaurant/banner.png'; }}
        />
      </div>

      {/* Dark Overlay for better text readability */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(14, 18, 26, 0.4) 0%, rgba(14, 18, 26, 0.7) 100%)',
          zIndex: 2,
        }}
      />

      {/* Content Overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          textAlign: 'center',
          maxWidth: 800,
          padding: '0 24px',
        }}>
        {/* Title */}
        <Title
          level={1}
          style={{
            color: 'white',
            fontSize: 64,
            fontWeight: 400,
            fontFamily: 'serif',
            marginBottom: 16,
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>
          {t('restaurant.hero.title')}
        </Title>

        <Text
          style={{
            color: 'rgba(255,255,255,0.95)',
            fontSize: 20,
            display: 'block',
            marginBottom: 48,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}>
          {t('restaurant.hero.subtitle')}
        </Text>

        {/* CTA Button */}
        <Button
          type="primary"
          size="large"
          style={{
            background: 'linear-gradient(135deg, #FF6B3B 0%, #CC2D08 100%)',
            border: 'none',
            borderRadius: 12,
            height: 56,
            padding: '0 48px',
            fontSize: 18,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(255, 56, 11, 0.5)',
            textTransform: 'uppercase',
          }}>
          {t('restaurant.hero.cta')}
        </Button>
      </div>
    </section>
  );
};

export default RestaurantHero;
