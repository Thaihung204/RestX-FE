'use client';

import React from 'react';
import { Button, Typography } from 'antd';

const { Title, Text } = Typography;

const RestaurantHero: React.FC = () => {
  return (
    <section
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
          src="/images/restaurant/banner.png"
          alt="RestX Restaurant Banner"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
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
          background: 'linear-gradient(180deg, rgba(26, 26, 26, 0.4) 0%, rgba(26, 26, 26, 0.7) 100%)',
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
          RestX Restaurant
        </Title>

        <Text
          style={{
            color: 'rgba(255,255,255,0.95)',
            fontSize: 20,
            display: 'block',
            marginBottom: 48,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}>
          Món ăn đa dạng
        </Text>

        {/* CTA Button */}
        <Button
          type="primary"
          size="large"
          style={{
            background: 'linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)',
            border: 'none',
            borderRadius: 12,
            height: 56,
            padding: '0 48px',
            fontSize: 18,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(255, 122, 0, 0.5)',
            textTransform: 'uppercase',
          }}>
          ĐẶT BÀN NGAY
        </Button>
      </div>
    </section>
  );
};

export default RestaurantHero;

