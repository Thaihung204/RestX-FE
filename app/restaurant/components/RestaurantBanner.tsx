'use client';

import { useTenant } from '@/lib/contexts/TenantContext';
import React from 'react';

const RestaurantBanner: React.FC = () => {
  const { tenant } = useTenant();

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        marginTop: 80,
        overflow: 'hidden',
      }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}>
        <img
          src={tenant?.backgroundUrl || "/images/restaurant/banner.png"}
          alt="Restaurant Banner"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {/* Overlay gradient for better text readability if needed */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(14, 18, 26, 0.3) 0%, rgba(14, 18, 26, 0.6) 100%)',
          }}
        />
      </div>
    </section>
  );
};

export default RestaurantBanner;

