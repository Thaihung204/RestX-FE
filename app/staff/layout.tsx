'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Space, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  TableOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeMode } from '../theme/AntdProvider';
import Link from 'next/link';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../components/I18nProvider';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false); // e.g. iPad widths
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useThemeMode();

  // Menu items with translations
  const menuItems = [
    {
      key: '/staff',
      icon: <DashboardOutlined />,
      label: t('staff.menu.dashboard'),
    },
    {
      key: '/staff/tables',
      icon: <TableOutlined />,
      label: (isMobile || isTablet) ? t('staff.menu.tables_short') : t('staff.menu.tables'),
    },
    {
      key: '/staff/orders',
      icon: <ShoppingCartOutlined />,
      label: (isMobile || isTablet) ? t('staff.menu.orders_short') : t('staff.menu.orders'),
    },
    {
      key: '/staff/checkout',
      icon: <WalletOutlined />,
      label: t('staff.menu.checkout'),
    },
    {
      key: '/staff/attendance',
      icon: <ClockCircleOutlined />,
      label: t('staff.menu.attendance'),
    },
  ];

  // User menu items with translations
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('staff.user_menu.profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('staff.user_menu.settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('staff.user_menu.logout'),
      danger: true,
    },
  ];

  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      const tablet = w >= 768 && w < 1200;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile || tablet) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
        setDrawerOpen(false);
      }
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    // allow page scroll even when drawer open
    if (drawerOpen) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const isDrawerDevice = isMobile || isTablet;

  const handleMenuClick = (e: { key: string }) => {
    router.push(e.key);
    if (isDrawerDevice) setDrawerOpen(false);
  };

  // Sidebar content component for reuse
  const SidebarContent = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <>
      {/* Logo */}
      <div
        style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: (collapsed && !inDrawer) ? 'center' : 'flex-start',
          padding: (collapsed && !inDrawer) ? '0' : '0 24px',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <img
              src="/images/logo/restx-removebg-preview.png"
              alt="RestX Logo"
              className="app-logo-img"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          {(!collapsed || inDrawer) && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 22,
                fontWeight: 700,
                color: mode === 'dark' ? '#fff' : '#1a1a2e',
                letterSpacing: '-0.5px',
              }}
            >
              Rest<span style={{ color: '#FF380B' }}>X</span>
            </span>
          )}
        </Link>
      </div>

      {/* Staff Info */}
      {(!collapsed || inDrawer) && (
        <div
          style={{
            padding: '20px 24px',
            borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={44}
              style={{
                background: 'linear-gradient(135deg, #FF380B 0%, #FF6B3B 100%)',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              NV
            </Avatar>
            <div>
              <Text
                style={{
                  color: mode === 'dark' ? '#fff' : '#1a1a2e',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'block',
                }}
              >
                Nguyễn Văn A
              </Text>
              <Text
                style={{
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
                  fontSize: 12,
                }}
              >
                {t('staff.sidebar.staff_role')}
              </Text>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '16px 12px',
        }}
        theme={mode === 'dark' ? 'dark' : 'light'}
      />

      {/* Clock In/Out Status */}
      {(!collapsed || inDrawer) && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            padding: '16px',
            background: 'rgba(255, 56, 11, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(255, 56, 11, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#52c41a',
                boxShadow: '0 0 8px rgba(82, 196, 26, 0.6)',
              }}
            />
            <Text style={{ color: '#52c41a', fontSize: 12, fontWeight: 600 }}>
              {t('staff.sidebar.working')}
            </Text>
          </div>
          <Text style={{ color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', fontSize: 12 }}>
            {t('staff.sidebar.started')}: 08:00 - {t('staff.sidebar.today')}
          </Text>
        </div>
      )}
    </>
  );

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Mobile Bottom Navigation */}
        {isDrawerDevice && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 85,
              background: mode === 'dark' ? 'rgba(20, 25, 39, 0.85)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              paddingBottom: 20,
              zIndex: 1000,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
            }}
          >
            {menuItems.map((item) => {
              const isActive = pathname === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => router.push(item.key)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    color: isActive ? '#FF380B' : 'var(--text-muted)',
                    cursor: 'pointer',
                    width: '20%',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{
                    fontSize: 24,
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    transition: 'transform 0.2s',
                    filter: isActive ? 'drop-shadow(0 4px 6px rgba(255, 56, 11, 0.3))' : 'none',
                  }}>
                    {item.icon}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    opacity: isActive ? 1 : 0.8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    textAlign: 'center',
                    padding: '0 2px',
                  }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Desktop Sidebar */}
        {!isDrawerDevice && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            collapsedWidth={80}
            style={{
              background: 'var(--card)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
              borderRight: mode === 'dark' ? 'none' : '1px solid var(--border)',
              position: 'fixed',
              height: '100vh',
              left: 0,
              top: 0,
              zIndex: 100,
            }}
          >
            <SidebarContent />
          </Sider>
        )}

        {/* Main Layout */}
        <Layout style={{
          marginLeft: isDrawerDevice ? 0 : (collapsed ? 80 : 260),
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          width: '100%',
        }}>
          {/* Header */}
          <Header
            style={{
              padding: isMobile ? '0 16px' : '0 24px',
              background: 'var(--card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)',
              position: 'sticky',
              top: 0,
              zIndex: 99,
              height: 64,
              borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Left Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!isDrawerDevice && (
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{
                    fontSize: 16,
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              )}
              <div style={{ borderLeft: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e8e8e8', paddingLeft: 12, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: mode === 'dark' ? '#fff' : '#1a1a2e',
                    lineHeight: 1.2,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {menuItems.find((item) => item.key === pathname)?.label || t('staff.menu.dashboard')}
                  </Text>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12 }}>
              {/* Home Link */}
              {!isMobile && (
                <Link href="/">
                  <Button
                    type="text"
                    icon={<HomeOutlined style={{ fontSize: 18, color: 'var(--text-muted)' }} />}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </Link>
              )}

              {/* Notifications */}
              <Badge count={3} size="small" offset={[-4, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: isMobile ? 16 : 18, color: 'var(--text-muted)' }} />}
                  style={{
                    width: isMobile ? 32 : 36,
                    height: isMobile ? 32 : 36,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                />
              </Badge>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Language switcher */}
              {/* Language switcher - hidden on very small screens if needed, or just keep it */}
              <div style={{ display: isMobile && window.innerWidth < 360 ? 'none' : 'block' }}>
                <LanguageSwitcher />
              </div>

              {/* User Menu */}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 4 : 8,
                    padding: isMobile ? '4px' : '4px 8px 4px 4px',
                    background: 'var(--card)',
                    borderRadius: 24,
                    cursor: 'pointer',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s',
                    maxWidth: isMobile ? 34 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <Avatar
                    size={isMobile ? 24 : 28}
                    style={{
                      background: 'linear-gradient(135deg, #FF380B 0%, #FF6B3B 100%)',
                      fontWeight: 600,
                      fontSize: isMobile ? 10 : 12,
                    }}
                  >
                    NV
                  </Avatar>
                  {!isMobile && (
                    <Text style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', paddingRight: 4 }}>
                      Nguyễn Văn A
                    </Text>
                  )}
                </div>
              </Dropdown>
            </div>
          </Header>

          {/* Content */}
          <Content
            style={{
              margin: isMobile ? 12 : 24,
              marginBottom: isDrawerDevice ? 130 : 24,
              padding: 0,
              minHeight: 'calc(100vh - 120px)',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
      <style jsx global>{`
        .ant-menu-dark .ant-menu-item,
        .ant-menu-light .ant-menu-item {
          margin: 4px 0 !important;
          border-radius: 10px !important;
          height: 48px !important;
          line-height: 48px !important;
        }
        /* Dark Mode Menu */
        .ant-menu-dark .ant-menu-item-selected {
          background: linear-gradient(135deg, rgba(255, 56, 11, 0.2) 0%, rgba(255, 56, 11, 0.1) 100%) !important;
          border-left: 3px solid #FF380B !important;
        }
        .ant-menu-dark .ant-menu-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .ant-menu-dark .ant-menu-item .ant-menu-item-icon {
          font-size: 18px !important;
        }

        /* Light Mode Menu */
        .ant-menu-light .ant-menu-item-selected {
          background: linear-gradient(135deg, rgba(255, 56, 11, 0.15) 0%, rgba(255, 56, 11, 0.05) 100%) !important;
          border-left: 3px solid #FF380B !important;
          color: #FF380B !important;
        }
        .ant-menu-light .ant-menu-item:hover {
          background: rgba(0, 0, 0, 0.04) !important;
        }
        .ant-menu-light .ant-menu-item .ant-menu-item-icon {
          font-size: 18px !important;
        }
        /* Disable blur/backdrop on all masks (drawer + modal) */
        .ant-drawer-mask,
        .ant-modal-mask {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
        }
        [data-theme="dark"] .ant-drawer-mask,
        [data-theme="dark"] .ant-modal-mask {
          background: rgba(0, 0, 0, 0.92) !important;
        }
        [data-theme="light"] .ant-drawer-mask,
        [data-theme="light"] .ant-modal-mask {
          background: rgba(0, 0, 0, 0.45) !important;
        }
        /* Cards inside modal */
        [data-theme="dark"] .ant-modal-body .ant-card {
          background: #0F1419 !important;
          border-color: var(--border) !important;
        }
        [data-theme="dark"] .ant-modal-body .ant-card-body {
          background: #0F1419 !important;
        }
        [data-theme="light"] .ant-modal-body .ant-card {
          background: #FFFFFF !important;
          border-color: #E5E7EB !important;
        }
        [data-theme="light"] .ant-modal-body .ant-card-body {
          background: #FFFFFF !important;
        }
        /* Select dropdown in modal */
        [data-theme="dark"] .ant-modal-body .ant-select-selector {
          background: #0F1419 !important;
          border-color: var(--border) !important;
        }
        [data-theme="dark"] .ant-modal-body .ant-select-dropdown {
          background: #0F1419 !important;
        }
        [data-theme="light"] .ant-modal-body .ant-select-selector {
          background: #FFFFFF !important;
          border-color: #E5E7EB !important;
        }
        [data-theme="light"] .ant-modal-body .ant-select-dropdown {
          background: #FFFFFF !important;
        }
        /* Divider in modal */
        .ant-modal-body .ant-divider {
          border-color: var(--border) !important;
        }
        /* Scrollbar styling for modal body (checkout and other modals) */
        .ant-modal-body {
          scrollbar-width: thin !important;
          scrollbar-color: var(--border) var(--card) !important;
        }
        .ant-modal-body::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        .ant-modal-body::-webkit-scrollbar-track {
          background: var(--card) !important;
          border-radius: 4px !important;
        }
        .ant-modal-body::-webkit-scrollbar-thumb {
          background: var(--border) !important;
          border-radius: 4px !important;
        }
        .ant-modal-body::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted) !important;
        }
      `}</style>
    </>
  );
}

