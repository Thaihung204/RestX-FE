'use client';

import React from 'react';
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantHero from './components/RestaurantHero';
import AboutSection from './components/AboutSection';
import FeaturedCategories from './components/FeaturedCategories';
import MenuSection from './components/MenuSection';
import Footer from '../components/Footer';

export default function RestaurantPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a' }}>
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

