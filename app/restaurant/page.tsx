'use client';

import React from 'react';
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantHero from './components/RestaurantHero';
import AboutSection from './components/AboutSection';
import FeaturedCategories from './components/FeaturedCategories';
import MenuSection from './components/MenuSection';
import Footer from '../components/Footer';
import { useThemeMode } from '../theme/AutoDarkThemeProvider';

export default function RestaurantPage() {
  const { mode } = useThemeMode();

  return (
    <div style={{ minHeight: '100vh', background: mode === 'dark' ? '#1a1a1a' : '#FFFFFF' }}>
      <RestaurantHeader />
      <main>
        <RestaurantHero />
        <AboutSection />
        <FeaturedCategories />
        <MenuSection />
      </main>
      <Footer />
    </div>
  );
}

