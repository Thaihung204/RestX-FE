'use client';

import ThemeToggle from '@/app/components/ThemeToggle';
import { useThemeMode } from '@/app/theme/AntdProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTenant } from "@/lib/contexts/TenantContext";
import authService, { User } from '@/lib/services/authService';
import {
  CloseOutlined,
  DownOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Dropdown, Space } from 'antd';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar, { handleScroll } from './Navbar';

import { TenantConfig } from '@/lib/services/tenantService';
import { Category } from '@/lib/services/categoryService';

interface RestaurantHeaderProps {
  tenant: TenantConfig | null;
  categories?: Category[];
}

const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ tenant: propTenant, categories = [] }) => {
  const { t } = useTranslation();
  const { tenant: contextTenant } = useTenant();
  const tenant = propTenant || contextTenant;
  const { mode } = useThemeMode();
  const [scrolled, setScrolled] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const headerContentColor = scrolled ? (mode === 'dark' ? 'white' : '#1a1a1a') : 'white';

  const syncUserFromStorage = useCallback(() => {
    const localUser = authService.getCurrentUser();
    setUser(localUser);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    syncUserFromStorage();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', syncUserFromStorage);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focus', syncUserFromStorage);
    };
  }, [syncUserFromStorage]);

  const desktopMenuItems = useMemo(() => [
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
      key: 'featured',
      label: t('restaurant.header.featured'),
      href: '/restaurant#featured'
    },
    {
      key: 'menu',
      label: (
        <Dropdown
          menu={{
            items: [
              { key: 'all', label: t('restaurant.header.menu.all') },
              ...categories.map(cat => ({
                key: cat.id,
                label: cat.name,
              })),
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
      key: 'news',
      label: t('restaurant.header.news'),
      href: '/restaurant#news'
    },
  ], [t, categories]);

  const mobileMenuItems = useMemo(() => [
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
      key: 'featured',
      label: t('restaurant.header.featured'),
      href: '/restaurant#featured'
    },
    {
      key: 'menu',
      label: t('restaurant.header.menu.title'),
      href: '/restaurant#menu'
    },
    {
      key: 'news',
      label: t('restaurant.header.news'),
      href: '/restaurant#news'
    },
    {
      key: 'reservation',
      label: t('restaurant.header.book_table'),
      href: '/restaurant#reservation'
    },
  ], [t]);

  const handleLogout = useCallback(async () => {
    await authService.logoutServer();
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const handleMobileNavigation = useCallback((href: string, key: string) => {
    setActiveItem(key);
    setDrawerOpen(false);

    if (typeof window === 'undefined') return;

    const [targetPath, targetHash] = href.split('#');
    const currentPath = window.location.pathname;
    const isSamePage = currentPath === targetPath;

    if (isSamePage && targetHash) {
      handleScroll(targetHash);
      window.history.pushState(null, '', `${targetPath}#${targetHash}`);
      return;
    }

    if (isSamePage && !targetHash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', targetPath);
      return;
    }

    window.location.href = href;
  }, []);

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
          padding: isMobile ? '10px 12px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: isMobile ? 8 : 16,
        }}>
        {/* Logo */}
        <Link
          href="/restaurant"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            flexShrink: 0,
            maxWidth: isMobile ? 'min(58vw, 240px)' : 280,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
            <img
              src={tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png"}
              alt={tenant?.businessName || tenant?.name || "Restaurant Logo"}
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
              fontSize: isMobile ? 14 : 15,
              fontWeight: 700,
              color: headerContentColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}>
            {tenant?.businessName || tenant?.name || t('restaurant.header.title')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexShrink: 0 }}>
          {!isMobile && (
            <Navbar
              items={desktopMenuItems}
              scrolled={scrolled}
              textColor={headerContentColor}
            />
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 6 : 12,
            marginLeft: isMobile ? 0 : 18,
          }}>
            <LanguageSwitcher
              className={isMobile ? 'restaurant-header-lang-mobile' : undefined}
              style={{
                color: headerContentColor,
                padding: isMobile ? '4px 6px' : '6px 10px',
              }}
            />
            <ThemeToggle style={{ color: headerContentColor }} />

            {!isMobile && user ? (
              <Dropdown
                menu={{
                  className: 'restaurant-user-dropdown-menu',
                  style: { minWidth: 180 },
                  items: [
                    {
                      key: 'logout',
                      label: t('staff.user_menu.logout'),
                      danger: true,
                    },
                  ],
                  onClick: async ({ key }) => {
                    if (key === 'logout') {
                      await handleLogout();
                    }
                  },
                }}
                trigger={['click']}>
                <Space size={8} style={{ cursor: 'pointer' }}>
                  <UserOutlined style={{ fontSize: 20, color: headerContentColor }} />
                  {!isMobile && (
                    <span
                      style={{
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: headerContentColor,
                        fontWeight: 600,
                        fontSize: 14,
                      }}>
                      {user.fullName || user.name || user.email}
                    </span>
                  )}
                </Space>
              </Dropdown>
            ) : null}

            {!isMobile && !user ? (
              <Button
                type="text"
                href="/login"
                style={{
                  background: 'transparent',
                  border: scrolled ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.22)',
                  color: headerContentColor,
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 40,
                  padding: '0 18px',
                }}>
                {t('homepage.header.login')}
              </Button>
            ) : null}

            {!isMobile && (
              <Button
              type="primary"
              href="#reservation"
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
            )}

            {isMobile && (
              <Button
                type="text"
                aria-label={t('common.actions.menu', { defaultValue: 'Menu' })}
                icon={<MenuOutlined style={{ fontSize: 22, color: headerContentColor }} />}
                onClick={() => setDrawerOpen(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: scrolled ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.22)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            )}
          </div>
        </nav>
      </div>

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
          {mobileMenuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleMobileNavigation(item.href, item.key)}
              style={{
                width: '100%',
                textAlign: 'left',
                color: 'var(--text)',
                fontSize: 16,
                padding: '12px 16px',
                borderRadius: 8,
                background: activeItem === item.key ? 'rgba(255, 107, 59, 0.1)' : 'transparent',
                borderLeft: activeItem === item.key ? '3px solid #FF6B3B' : '3px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}>
              {item.label}
            </button>
          ))}

          <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />

          <Button
            type="primary"
            block
            onClick={() => handleMobileNavigation('/restaurant#reservation', 'reservation')}
            style={{
              height: 42,
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            {t('restaurant.header.book_table')}
          </Button>

          {user ? (
            <Button danger block onClick={handleLogout} style={{ height: 40, borderRadius: 10 }}>
              {t('staff.user_menu.logout')}
            </Button>
          ) : (
            <Button
              block
              onClick={() => {
                setDrawerOpen(false);
                window.location.href = '/login';
              }}
              style={{ height: 40, borderRadius: 10 }}
            >
              {t('homepage.header.login')}
            </Button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </Space>
      </Drawer>

      {/* Keyframe animations */}
      <style jsx global>{`
        .restaurant-header-lang-mobile .ant-space-item:nth-child(2) {
          display: none;
        }

        .restaurant-user-dropdown-menu {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
          padding: 8px !important;
        }

        .restaurant-user-dropdown-menu .ant-dropdown-menu-item {
          color: var(--text) !important;
          border-radius: 8px !important;
        }

        .restaurant-user-dropdown-menu .ant-dropdown-menu-item:hover {
          background: var(--surface-subtle) !important;
        }

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
