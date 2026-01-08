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
import { useThemeMode } from '../theme/AutoDarkThemeProvider';
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
      label: t('staff.menu.tables'),
    },
    {
      key: '/staff/orders',
      icon: <ShoppingCartOutlined />,
      label: t('staff.menu.orders'),
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              boxShadow: '0 4px 15px rgba(255, 122, 0, 0.4)',
            }}
          >
            R
          </div>
          {(!collapsed || inDrawer) && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '-0.5px',
              }}
            >
              Rest<span style={{ color: '#FF7A00' }}>X</span>
            </span>
          )}
        </Link>
      </div>

      {/* Staff Info */}
      {(!collapsed || inDrawer) && (
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={44}
              style={{
                background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              NV
            </Avatar>
            <div>
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'block',
                }}
              >
                Nguyễn Văn A
              </Text>
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
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
        theme="dark"
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
            background: 'rgba(255, 122, 0, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(255, 122, 0, 0.2)',
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
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
            {t('staff.sidebar.started')}: 08:00 - {t('staff.sidebar.today')}
          </Text>
        </div>
      )}
    </>
  );

  return (
    <>
    <Layout style={{ minHeight: '100vh' }}>
        {/* Mobile Drawer */}
        {isDrawerDevice && (
          <Drawer
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={280}
            style={{ top: 0, height: '100vh' }}
            closable={false}
            maskClosable
            rootStyle={{
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            }}
            styles={{
              mask: {
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                filter: 'none',
              },
              body: { 
                padding: 0, 
                background: 'var(--sidebar-bg)',
                height: '100%',
                minHeight: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
              },
              header: { display: 'none' },
            }}
            destroyOnClose
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <Button
                type="text"
                icon={<CloseOutlined style={{ color: '#fff' }} />}
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 20,
                  zIndex: 10,
                }}
              />
              <SidebarContent inDrawer />
            </div>
          </Drawer>
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
              background: 'var(--sidebar-bg)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flex: 1, minWidth: 0 }}>
              <Button
                type="text"
                icon={isDrawerDevice ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                onClick={() => isDrawerDevice ? setDrawerOpen(true) : setCollapsed(!collapsed)}
                style={{
                  fontSize: 16,
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              />
              {!isMobile && (
                <div style={{ borderLeft: '1px solid #e8e8e8', paddingLeft: 12, display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                    <Text style={{ 
                      fontSize: 15, 
                      fontWeight: 600, 
                      color: '#1a1a2e',
                      lineHeight: 1.2,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {menuItems.find((item) => item.key === pathname)?.label || t('staff.menu.dashboard')}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#999', lineHeight: 1.2, marginTop: 2 }}>
                      {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'numeric',
                      })}
                    </Text>
                  </div>
                </div>
              )}
              {isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <Text style={{ 
                    fontSize: isMobile ? 14 : 15, 
                    fontWeight: 600, 
                    color: '#1a1a2e',
                    lineHeight: 1.2,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {menuItems.find((item) => item.key === pathname)?.label || t('staff.menu.dashboard')}
                  </Text>
                </div>
              )}
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12, flexShrink: 0 }}>
              {/* Home Link - Hidden on very small mobile */}
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
              <LanguageSwitcher />

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
                  }}
                >
                  <Avatar
                    size={isMobile ? 24 : 28}
                    style={{
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
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
              padding: 0,
              minHeight: 'calc(100vh - 120px)',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
      <style jsx global>{`
        .ant-menu-dark .ant-menu-item {
          margin: 4px 0 !important;
          border-radius: 10px !important;
          height: 48px !important;
          line-height: 48px !important;
        }
        .ant-menu-dark .ant-menu-item-selected {
          background: linear-gradient(135deg, rgba(255, 122, 0, 0.2) 0%, rgba(255, 122, 0, 0.1) 100%) !important;
          border-left: 3px solid #FF7A00 !important;
        }
        .ant-menu-dark .ant-menu-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .ant-menu-dark .ant-menu-item .ant-menu-item-icon {
          font-size: 18px !important;
        }
        /* Disable blur/backdrop on all masks (drawer + modal) */
        .ant-drawer-mask,
        .ant-modal-mask {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
          background: rgba(0, 0, 0, 0.92) !important;
        }
        /* Cards inside modal should be darker */
        .ant-modal-body .ant-card {
          background: #0F1419 !important;
          border-color: var(--border) !important;
        }
        .ant-modal-body .ant-card-body {
          background: #0F1419 !important;
        }
        /* Select dropdown in modal */
        .ant-modal-body .ant-select-selector {
          background: #0F1419 !important;
          border-color: var(--border) !important;
        }
        .ant-modal-body .ant-select-dropdown {
          background: #0F1419 !important;
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

