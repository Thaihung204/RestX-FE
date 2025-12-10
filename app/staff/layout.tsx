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
import AntdProvider from '../theme/AntdProvider';
import Link from 'next/link';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/staff',
    icon: <DashboardOutlined />,
    label: 'Tổng quan',
  },
  {
    key: '/staff/tables',
    icon: <TableOutlined />,
    label: 'Quản lý bàn',
  },
  {
    key: '/staff/orders',
    icon: <ShoppingCartOutlined />,
    label: 'Quản lý Order',
  },
  {
    key: '/staff/checkout',
    icon: <WalletOutlined />,
    label: 'Thanh toán',
  },
  {
    key: '/staff/attendance',
    icon: <ClockCircleOutlined />,
    label: 'Chấm công',
  },
];

const userMenuItems = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Thông tin cá nhân',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Cài đặt',
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Đăng xuất',
    danger: true,
  },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuClick = (e: { key: string }) => {
    router.push(e.key);
    if (isMobile) setDrawerOpen(false);
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
                Nhân viên phục vụ
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
              Đang làm việc
            </Text>
          </div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
            Bắt đầu: 08:00 - Hôm nay
          </Text>
        </div>
      )}
    </>
  );

  return (
    <AntdProvider>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            placement="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            width={280}
            closable={false}
            styles={{
              body: { padding: 0, background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' },
              header: { display: 'none' },
            }}
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
        {!isMobile && (
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            collapsedWidth={80}
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
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
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 260), 
          transition: 'margin-left 0.2s' 
        }}>
          {/* Header */}
          <Header
            style={{
              padding: isMobile ? '0 16px' : '0 24px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 8px rgba(0, 0, 0, 0.08)',
              position: 'sticky',
              top: 0,
              zIndex: 99,
              height: 64,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            {/* Left Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button
                type="text"
                icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
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
              <div style={{ borderLeft: '1px solid #e8e8e8', paddingLeft: 12, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Text style={{ 
                    fontSize: 15, 
                    fontWeight: 600, 
                    color: '#1a1a2e',
                    lineHeight: 1.2,
                    margin: 0,
                  }}>
                    {menuItems.find((item) => item.key === pathname)?.label || 'Dashboard'}
                  </Text>
                  {!isMobile && (
                    <Text style={{ fontSize: 12, color: '#999', lineHeight: 1.2, marginTop: 2 }}>
                      {new Date().toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'numeric',
                      })}
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
              {/* Home Link */}
              <Link href="/">
                <Button
                  type="text"
                  icon={<HomeOutlined style={{ fontSize: 18, color: '#666' }} />}
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

              {/* Notifications */}
              <Badge count={3} size="small" offset={[-4, 4]}>
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#666' }} />}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Badge>

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
                    gap: 8,
                    padding: '4px 8px 4px 4px',
                    background: '#f8f8f8',
                    borderRadius: 24,
                    cursor: 'pointer',
                    border: '1px solid #eee',
                    transition: 'all 0.2s',
                  }}
                >
                  <Avatar
                    size={28}
                    style={{
                      background: 'linear-gradient(135deg, #FF7A00 0%, #FF9A40 100%)',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    NV
                  </Avatar>
                  {!isMobile && (
                    <Text style={{ fontWeight: 500, fontSize: 13, color: '#333', paddingRight: 4 }}>
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
      `}</style>
    </AntdProvider>
  );
}

