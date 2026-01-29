'use client';

import Footer from '../components/Footer';
import { TenantGuard } from '@/components/tenant';

import AboutSection from './components/AboutSection';
import FeaturedCategories from './components/FeaturedCategories';
import MenuSection from './components/MenuSection';
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantHero from './components/RestaurantHero';

export default function RestaurantPage() {
  return (
    <TenantGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <RestaurantHeader />
        <main>
          <RestaurantHero />
          <AboutSection />
          <FeaturedCategories />
          <MenuSection />
        </main>
        <Footer />
      </div>
    </TenantGuard>
  );
}


