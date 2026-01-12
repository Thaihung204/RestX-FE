'use client';

import React, { useState, useEffect } from 'react';
import {
  SearchOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DownOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Button, Input, Drawer, Space, Dropdown } from 'antd';
import Link from 'next/link';
import Image from 'next/image';

const RestaurantHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    { key: 'home', label: <Link href="/restaurant">Trang chủ</Link> },
    { key: 'about', label: <a href="#about">Giới thiệu</a> },
    {
      key: 'menu',
      label: (
        <Dropdown
          menu={{
            items: [
              { key: 'all', label: 'Tất cả món' },
              { key: 'appetizer', label: 'Khai vị' },
              { key: 'main', label: 'Món chính' },
              { key: 'dessert', label: 'Tráng miệng' },
              { key: 'drink', label: 'Đồ uống' },
            ],
          }}>
          <Space>
            Menu
            <DownOutlined style={{ fontSize: 10 }} />
          </Space>
        </Dropdown>
      ),
    },
    { key: 'featured', label: <a href="#featured">Món ăn nổi bật</a> },
    { key: 'daily', label: <a href="#daily">Món ngon mỗi ngày</a> },
    { key: 'news', label: <a href="#news">Tin tức</a> },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: scrolled ? 'rgba(26, 26, 26, 0.95)' : '#1a1a1a',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        borderBottom: scrolled ? '1px solid rgba(255, 122, 0, 0.2)' : 'none',
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
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
            }}>
            <span style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>R</span>
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'white',
              fontFamily: 'serif',
            }}>
            RestX Restaurant
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Space size="large" style={{ display: isMobile ? 'none' : 'flex' }}>
            {menuItems.map((item) => (
              <span key={item.key} style={{ color: 'white', fontSize: 15, cursor: 'pointer' }}>
                {item.label}
              </span>
            ))}
          </Space>

          {/* Icons */}
          <Space size="large" style={{ marginLeft: 24 }}>
            <SearchOutlined style={{ fontSize: 20, color: 'white', cursor: 'pointer' }} />
            <UserOutlined style={{ fontSize: 20, color: 'white', cursor: 'pointer' }} />
            <ShoppingCartOutlined style={{ fontSize: 20, color: 'white', cursor: 'pointer' }} />
            <Button
              type="primary"
              style={{
                background: 'linear-gradient(135deg, #FF8A3D 0%, #D24A00 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                height: 40,
                padding: '0 24px',
                boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)',
              }}>
              Đặt bàn
            </Button>
            <MenuOutlined
              style={{
                fontSize: 24,
                color: 'white',
                cursor: 'pointer',
                display: isMobile ? 'block' : 'none',
              }}
              onClick={() => setDrawerOpen(true)}
            />
          </Space>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        style={{ background: '#1a1a1a' }}
        styles={{ body: { background: '#1a1a1a' } }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {menuItems.map((item) => (
            <div key={item.key} style={{ color: 'white', fontSize: 16 }}>
              {item.label}
            </div>
          ))}
        </Space>
      </Drawer>
    </header>
  );
};

export default RestaurantHeader;

