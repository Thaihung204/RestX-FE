'use client';

import Footer from '../components/Footer';

import AboutSection from './components/AboutSection';
import FeaturedCategories from './components/FeaturedCategories';
import MenuSection from './components/MenuSection';
import RestaurantHeader from './components/RestaurantHeader';
import RestaurantHero from './components/RestaurantHero';

export default function RestaurantPage() {


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <RestaurantHeader />
      <main>
        <RestaurantHero />
        <AboutSection />
        <MenuSection />
        <FeaturedCategories />
        
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
  );
}

