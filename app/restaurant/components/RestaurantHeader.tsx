'use client';

import ThemeToggle from '@/app/components/ThemeToggle';
import { useThemeMode } from '@/app/theme/AutoDarkThemeProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTenant } from "@/lib/contexts/TenantContext";
import {
  CloseOutlined,
  DownOutlined,
  MenuOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Dropdown, Space } from 'antd';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';

import { TenantConfig } from '@/lib/services/tenantService';

interface RestaurantHeaderProps {
  tenant: TenantConfig | null;
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ tenant: propTenant }) => {
  const { t } = useTranslation();
  const { tenant: contextTenant } = useTenant();
  const tenant = propTenant || contextTenant;
  const { mode } = useThemeMode();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const headerContentColor = scrolled ? (mode === 'dark' ? 'white' : '#1a1a1a') : 'white';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const menuItems = [
    {
      key: 'home',
      label: t('restaurant.header.home'),
      href: '/restaurant'
    },
    {
      key: 'about',
      label: t('restaurant.header.about'),
      href: '/restaurant#about'
    },
    {
      key: 'menu',
      label: (
        <Dropdown
          menu={{
            items: [
              { key: 'all', label: t('restaurant.header.menu.all') },
              { key: 'appetizer', label: t('restaurant.header.menu.appetizer') },
              { key: 'main', label: t('restaurant.header.menu.main') },
              { key: 'dessert', label: t('restaurant.header.menu.dessert') },
              { key: 'drink', label: t('restaurant.header.menu.drink') },
            ],
          }}>
          <Space style={{ color: 'inherit' }}>
            {t('restaurant.header.menu.title')}
            <DownOutlined style={{ fontSize: 10, color: 'inherit' }} />
          </Space>
        </Dropdown>
      ),
      href: '/restaurant#menu'
    },
    {
      key: 'featured',
      label: t('restaurant.header.featured'),
      href: '/restaurant#featured'
    },
    {
      key: 'daily',
      label: t('restaurant.header.daily'),
      href: '/restaurant#daily'
    },
    {
      key: 'news',
      label: t('restaurant.header.news'),
      href: '/restaurant#news'
    },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrolled
          ? (mode === 'dark' ? 'rgba(14, 18, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)')
          : 'transparent',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        borderBottom: scrolled ? '1px solid rgba(255, 56, 11, 0.2)' : 'none',
      }}>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {/* Logo */}
        <Link href="/restaurant" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div
            style={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            <img
              src={(tenant?.logoUrl && tenant.logoUrl.trim() !== '') ? tenant.logoUrl : "/images/logo/restx-removebg-preview.png"}
              alt="Restaurant Logo"
              className="app-logo-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: headerContentColor === 'white' ? 'invert(1) hue-rotate(180deg) brightness(1.1)' : 'none'
              }}
              onError={(e) => { e.currentTarget.src = '/images/logo/restx-removebg-preview.png'; }}
            />
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: headerContentColor,
              fontFamily: 'serif',
            }}>
            {tenant?.name || t('restaurant.header.title')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: isMobile ? 'none' : 'block' }}>
            <Navbar
              items={menuItems}
              scrolled={scrolled}
              textColor={headerContentColor}
            />
          </div>

          <Space size="middle" style={{ marginLeft: 24 }}>
            {/* Add Language Switcher and Theme Toggle here */}
            <LanguageSwitcher style={{ color: headerContentColor }} />
            <ThemeToggle style={{ color: headerContentColor }} />

            <SearchOutlined style={{ fontSize: 20, color: headerContentColor, cursor: 'pointer' }} />
            <UserOutlined style={{ fontSize: 20, color: headerContentColor, cursor: 'pointer' }} />
            <ShoppingCartOutlined style={{ fontSize: 20, color: headerContentColor, cursor: 'pointer' }} />
            <Button
              type="primary"
              style={{
                background: 'linear-gradient(135deg, #FF6B3B 0%, #CC2D08 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                height: 40,
                padding: '0 24px',
                boxShadow: '0 4px 12px rgba(255, 56, 11, 0.3)',
              }}>
              {t('restaurant.header.book_table')}
            </Button>
            <MenuOutlined
              style={{
                fontSize: 24,
                color: headerContentColor,
                cursor: 'pointer',
                display: isMobile ? 'block' : 'none',
              }}
              onClick={() => setDrawerOpen(true)}
            />
          </Space>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {/* Mobile Drawer */}
      <Drawer
        title={<span style={{ color: 'var(--text)' }}>Menu</span>}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        closeIcon={<CloseOutlined style={{ color: 'var(--text)' }} />}
        style={{ background: 'var(--bg-base)' }}
        styles={{ body: { background: 'var(--bg-base)' } }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {menuItems.map((item, index) => (
            <div
              key={item.key}
              onClick={() => {
                setActiveItem(item.key);
                setDrawerOpen(false);
              }}
              style={{
                color: 'var(--text)',
                fontSize: 16,
                padding: '12px 16px',
                borderRadius: 8,
                background: activeItem === item.key ? 'rgba(255, 107, 59, 0.1)' : 'transparent',
                borderLeft: activeItem === item.key ? '3px solid #FF6B3B' : '3px solid transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                animation: `slideIn 0.3s ease ${index * 0.1}s both`,
              }}
              onMouseEnter={(e) => {
                if (activeItem !== item.key) {
                  e.currentTarget.style.background = 'rgba(255, 107, 59, 0.05)';
                  e.currentTarget.style.transform = 'translateX(8px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeItem !== item.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
              }}>
              {item.label}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </Space>
      </Drawer>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translateX(-50%) scale(1.5);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </header>
  );
};

export default RestaurantHeader;
