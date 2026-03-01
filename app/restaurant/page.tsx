'use client';

import React, { useEffect, useState } from 'react';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { TenantGuard } from '@/components/tenant';
import Footer from '../components/Footer';

// New/Refactored Components
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantLandingHero from './components/RestaurantLandingHero';
import AboutSection from './components/AboutSection';
import MenuSection, { MenuSectionCategory } from './components/MenuSection';
import ReservationSection from './components/ReservationSection';
import ReservationLookupSection from './components/ReservationLookupSection';
import NewsSection from './components/NewsSection';
import FeaturedCategories from './components/FeaturedCategories';
import OverviewSection from './components/OverviewSection';
import categoryService, { Category } from '@/lib/services/categoryService';

// Services & Context
import { useTenant } from '@/lib/contexts/TenantContext';
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
  const [menu, setMenu] = useState<MenuSectionCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug logs
  useEffect(() => {
    if (tenant) {
      console.log('[RestaurantPage] tenant loaded:', tenant.businessName);
    }
  }, [tenant]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch menu and categories in parallel
        const [menuData, categoriesData] = await Promise.all([
          dishService.getMenu(),
          categoryService.getCategories()
        ]);

        console.log('[RestaurantPage] Menu data:', menuData);
        console.log('[RestaurantPage] Categories data:', categoriesData);

        // Transform MenuCategory to MenuSectionCategory format
        const transformedMenu: MenuSectionCategory[] = menuData.map(category => ({
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          items: category.items.filter(item => item.name !== undefined) as any
        }));

        setMenu(transformedMenu);

        // Filter only active categories for display
        setCategories(categoriesData.filter(c => c.isActive));

      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // We now use the fetched categories state directly
  // const categories = ... (removed derived logic)

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

          <ReservationLookupSection />
        </main>

        <Footer />
      </div>
    </TenantGuard>
  );
}
