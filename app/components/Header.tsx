'use client';

import React, { useEffect, useState } from 'react';
import { CloseOutlined, MenuOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Drawer, Layout, Menu, Space, Divider } from 'antd';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePageTransition } from './PageTransition';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useThemeMode } from '../theme/AutoDarkThemeProvider';

const { Header: AntHeader } = Layout;

import { useTranslation } from 'react-i18next';

const Header: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { key: 'product', label: <a href="#product">{t('homepage.header.product')}</a> },
    { key: 'workflow', label: <a href="#workflow">{t('homepage.header.workflow')}</a> },
    { key: 'testimonials', label: <a href="#testimonials">{t('homepage.header.testimonials')}</a> },
    { key: 'contact', label: <a href="#footer">{t('homepage.header.contact')}</a> },
  ];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAnimationReady } = usePageTransition();
  const { mode } = useThemeMode();

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Don't render until mounted to prevent FOUC
  if (!mounted) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={isAnimationReady ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.4, 0.25, 1],
          delay: 0.1,
        }}
      >
        <AntHeader
          style={{
            position: 'fixed',
            top: scrolled ? 10 : 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: scrolled ? 'calc(100% - 40px)' : 'calc(100% - 80px)',
            maxWidth: 1400,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            background: mode === 'dark'
              ? (scrolled ? 'rgba(20, 25, 39, 0.95)' : 'rgba(20, 25, 39, 0.9)')
              : (scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)'),
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 60,
            boxShadow: scrolled
              ? '0 8px 32px rgba(0, 0, 0, 0.12)'
              : '0 4px 24px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            transition: 'all 0.3s ease',
            height: 64,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
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
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: mode === 'dark' ? '#ECECEC' : '#111111',
              }}
            >
              Rest<span style={{ color: '#FF380B' }}>X</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Menu
              mode="horizontal"
              items={navItems}
              style={{
                background: 'transparent',
                border: 'none',
                flex: 1,
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 500,
              }}
              selectable={false}
            />
          )}

          {/* Desktop Buttons */}
          {!isMobile && (
            <Space size={12}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="text"
                  href="/staff"
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    height: 40,
                    padding: '0 16px',
                    color: '#FF380B',
                    background: 'rgba(255, 56, 11, 0.08)',
                    borderRadius: 20,
                  }}
                >
                  <TeamOutlined style={{ marginRight: 6 }} /> {t('homepage.header.staff')}
                </Button>
              </motion.div>
              <LanguageSwitcher />
              <ThemeToggle />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="text"
                  href="/login"
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    height: 40,
                    padding: '0 20px',
                    color: mode === 'dark' ? '#ECECEC' : '#111111',
                  }}
                >
                  {t('homepage.header.login')}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(255, 56, 11, 0.45)' }}
                whileTap={{ scale: 0.95 }}
                style={{ borderRadius: 20 }}
              >
                <Button
                  type="primary"
                  href="/register"
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    height: 40,
                    padding: '0 24px',
                    background: 'linear-gradient(135deg, #FF380B 0%, #CC2D08 100%)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(255, 56, 11, 0.35)',
                  }}
                >
                  Sign up
                </Button>
              </motion.div>
            </Space>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setDrawerOpen(true)}
              style={{ color: mode === 'dark' ? '#ECECEC' : '#111111' }}
            />
          )}
        </AntHeader>
      </motion.div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
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
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
              />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: mode === 'dark' ? '#ECECEC' : '#111111' }}>Rest<span style={{ color: '#FF380B' }}>X</span></span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        closeIcon={<CloseOutlined style={{ color: mode === 'dark' ? '#ECECEC' : '#111111' }} />}
        size="default"
        styles={{
          header: {
            background: mode === 'dark' ? '#141927' : '#FFFFFF',
            borderBottom: '1px solid var(--border)',
          },
          body: {
            background: mode === 'dark' ? '#141927' : '#FFFFFF',
          },
          mask: {
            backdropFilter: 'blur(4px)',
          }
        }}
      >
        <Menu
          mode="vertical"
          items={navItems}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 16,
            fontWeight: 500,
          }}
          theme={mode === 'dark' ? 'dark' : 'light'}
          selectable={false}
        />
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            block
            size="large"
            href="/login"
            style={{
              fontWeight: 600,
              height: 48,
              borderRadius: 50,
              borderColor: '#E5E7EB',
            }}
          >
            {t('homepage.header.login')}
          </Button>
          <Button
            type="primary"
            block
            size="large"
            href="/register"
            style={{
              fontWeight: 600,
              height: 48,
              borderRadius: 50,
              background: 'linear-gradient(135deg, #FF380B 0%, #CC2D08 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(255, 56, 11, 0.35)',
            }}
          >
            {t('homepage.header.signup')}
          </Button>
        </div>
      </Drawer>
    </>
  );
};

export default Header;
