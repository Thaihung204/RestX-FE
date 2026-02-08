'use client';

import React, { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import { TenantGuard } from '@/components/tenant';

import AboutSection from './components/AboutSection';
import FeaturedCategories from './components/FeaturedCategories';
import MenuSection from './components/MenuSection';
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantHero from './components/RestaurantHero';
import { tenantService, TenantConfig } from '@/lib/services/tenantService';
import { useTenant } from '@/lib/contexts/TenantContext';
import { categoryService, Category } from '@/lib/services/categoryService';
import dishService, { MenuCategory } from '@/lib/services/dishService';

export default function RestaurantPage() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, menuData] = await Promise.all([
          categoryService.getCategories(),
          dishService.getMenu()
        ]);

        console.log('[RestaurantPage] Categories from API:', categoriesData);
        console.log('[RestaurantPage] Menu from API:', menuData);

        setCategories(categoriesData);
        setMenu(menuData);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || tenantLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <TenantGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <RestaurantHeader tenant={tenant} categories={categories} />
        <main>
          <RestaurantHero tenant={tenant} />
          <AboutSection tenant={tenant} />
          <FeaturedCategories categories={categories} />
          <MenuSection menu={menu} />

          {/* Daily Specials Section Example */}
          <section id="daily" style={{ padding: '80px 24px', maxWidth: 1400, margin: '0 auto' }}>
            <h2 style={{ fontSize: 36, fontFamily: 'serif', color: 'var(--text)', textAlign: 'center' }}>Daily Specials</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Check out our fresh picks for today.</p>
          </section>

          {/* News Section Example */}
          <section id="news" style={{ padding: '80px 24px', maxWidth: 1400, margin: '0 auto' }}>
            <h2 style={{ fontSize: 36, fontFamily: 'serif', color: 'var(--text)', textAlign: 'center' }}>News & Events</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Stay updated with our latest activities.</p>
          </section>
        </main>
        <Footer />
      </div>
    </TenantGuard>
  );
}


