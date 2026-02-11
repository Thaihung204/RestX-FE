'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { TenantGuard } from '@/components/tenant';
import Footer from '../components/Footer';

// New/Refactored Components
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantLandingHero from './components/RestaurantLandingHero';
import AboutSection from './components/AboutSection';
import MenuSection, { MenuSectionCategory } from './components/MenuSection';
import ReservationSection from './components/ReservationSection';
import NewsSection from './components/NewsSection';
import FeaturedCategories from './components/FeaturedCategories';
import OverviewSection from './components/OverviewSection';

// Services & Context
import { tenantService } from '@/lib/services/tenantService';
import { useTenant } from '@/lib/contexts/TenantContext';
import { categoryService, Category } from '@/lib/services/categoryService';
import dishService from '@/lib/services/dishService';

// Fonts
const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-playfair',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

export default function RestaurantPage() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menu, setMenu] = useState<MenuSectionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[RestaurantPage] tenant:', tenant);
  console.log('[RestaurantPage] tenantLoading:', tenantLoading);
  console.log('[RestaurantPage] tenant?.businessName:', tenant?.businessName);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, dishListData] = await Promise.all([
          categoryService.getCategories(),
          dishService.getDishes(1, 1000)
        ]);

        console.log('[RestaurantPage] Base Data:', { categoriesData, dishListData });

        const allDishes = dishListData.items || dishListData.data || dishListData.dishes || [];

        // Group dishes by category
        const groupedMenu: MenuSectionCategory[] = categoriesData.map(cat => ({
          categoryId: cat.id,
          categoryName: cat.name,
          items: allDishes.filter(d => d.categoryId === cat.id && d.isActive)
        })).filter(group => group.items.length > 0);

        setCategories(categoriesData);
        setMenu(groupedMenu);
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || tenantLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <TenantGuard>
      <div className={`${playfair.variable} ${jakarta.variable}`} style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        {/* Inject Font Variables locally only if we can, or rely on the classNames which set the --font-playfair variable */}
        <style jsx global>{`
            :root {
                --font-display: var(--font-playfair), "Playfair Display", serif;
                --font-body: var(--font-jakarta), "Plus Jakarta Sans", sans-serif;
            }
            /* Override Ant Design Typography for this page if needed, or use specific styles in components */
            h1, h2, h3, h4, h5, h6, .ant-typography {
                 font-family: var(--font-display) !important;
            }
            body, .ant-btn, .ant-input, .ant-select {
                 font-family: var(--font-body) !important;
            }
        `}</style>

        <RestaurantHeader tenant={tenant} categories={categories} />

        <main>
          <RestaurantLandingHero tenant={tenant} />

          <OverviewSection overview={tenant?.overview} />

          <AboutSection tenant={tenant} />

          <FeaturedCategories categories={categories} />

          <MenuSection menu={menu} />

          <NewsSection tenant={tenant} />

          <ReservationSection tenant={tenant} />
        </main>

        <Footer />
      </div>
    </TenantGuard>
  );
}
