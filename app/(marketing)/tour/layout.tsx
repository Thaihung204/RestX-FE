'use client';

import {
  ApiOutlined,
  BarChartOutlined,
  FileTextOutlined,
  InboxOutlined,
  ShopOutlined,
  TableOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState, type ReactNode } from 'react';
import { useTenant } from '@/lib/contexts/TenantContext';
import { useThemeMode } from '@/app/theme/AntdProvider';
import ThemeToggle from '@/app/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Layout, Button, Drawer, Divider, Space } from 'antd';
import { useTranslation } from 'react-i18next';

const { Header: AntHeader } = Layout;

export default function TourLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { tenant } = useTenant();
  const { mode } = useThemeMode();
  const { t } = useTranslation();

  const modules = [
    { href: '/tour/analytics', label: t('tour.layout.modules.analytics'), icon: <BarChartOutlined />, color: 'var(--primary)' },
    { href: '/tour/tables', label: t('tour.layout.modules.tables'), icon: <TableOutlined />, color: '#10B981' },
    { href: '/tour/menu', label: t('tour.layout.modules.menu'), icon: <FileTextOutlined />, color: '#6366F1' },
    { href: '/tour/reservations', label: t('tour.layout.modules.reservations'), icon: <InboxOutlined />, color: '#F59E0B' },
    { href: '/tour/customer', label: t('tour.layout.modules.customer'), icon: <ShopOutlined />, color: '#EC4899' },
    { href: '/tour/staff-ops', label: t('tour.layout.modules.staff_ops'), icon: <ApiOutlined />, color: '#14B8A6' },
  ];

  const tenantName = "RestX";
  const tenantLogoUrl = tenant?.logoUrl?.trim() || "/images/logo/restx-removebg-preview.png";

  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // using 1024 to give space for all modules
    };
    
    handleScroll();
    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text)' }}>
      {/* Premium fixed header with glassmorphism similar to main page */}
      <AntHeader
        style={{
          position: "fixed",
          top: scrolled ? 10 : 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: scrolled ? "calc(100% - 40px)" : "calc(100% - 80px)",
          maxWidth: 1400,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 16px" : "0 32px",
          background:
            mode === "dark"
              ? scrolled
                ? "rgba(20, 25, 39, 0.95)"
                : "rgba(20, 25, 39, 0.9)"
              : scrolled
                ? "rgba(255, 255, 255, 0.95)"
                : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 60,
          boxShadow: scrolled
            ? "0 8px 32px rgba(0, 0, 0, 0.12)"
            : "0 4px 24px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(150, 150, 150, 0.2)",
          transition: "all 0.3s ease",
          height: 64,
        }}>
        {/* Logo wrapped in Link to / */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}>
            <img
              src={tenantLogoUrl}
              alt={tenantName || t('tour.layout.logo_alt')}
              className="app-logo-img"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => {
                e.currentTarget.src = "/images/logo/restx-removebg-preview.png";
              }}
            />
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: mode === "dark" ? "#ECECEC" : "#111111",
            }}>
            {tenantName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center' }}>
            {modules.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 50,
                    border: isActive ? `1.5px solid ${item.color}` : '1.5px solid transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    color: isActive ? item.color : mode === 'dark' ? '#A3A3A3' : '#666',
                    textDecoration: 'none',
                    background: isActive ? `${item.color}10` : 'transparent',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 2px 12px ${item.color}20` : 'none',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Desktop Buttons */}
        {!isMobile && (
          <Space size={12}>
            <LanguageSwitcher />
            <ThemeToggle />
          </Space>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20 }} />}
            onClick={() => setDrawerOpen(true)}
            style={{ color: mode === "dark" ? "#ECECEC" : "#111111" }}
          />
        )}
      </AntHeader>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: 'none' }} onClick={() => setDrawerOpen(false)}>
            <div
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
              <img
                src={tenantLogoUrl}
                alt={tenantName || t('tour.layout.logo_alt')}
                className="app-logo-img"
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                onError={(e) => {
                  e.currentTarget.src = "/images/logo/restx-removebg-preview.png";
                }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: mode === "dark" ? "#ECECEC" : "#111111",
              }}>
              {tenantName}
            </span>
          </Link>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        closeIcon={<CloseOutlined style={{ color: mode === "dark" ? "#ECECEC" : "#111111" }} />}
        size="default"
        styles={{
          header: { background: "var(--surface)", borderBottom: "1px solid var(--border)" },
          body: { background: "var(--surface)", padding: '24px 16px' },
          mask: { backdropFilter: "blur(4px)" },
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modules.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: isActive ? `${item.color}15` : 'transparent',
                  color: isActive ? item.color : mode === 'dark' ? '#ECECEC' : '#111111',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 16,
                  border: isActive ? `1px solid ${item.color}30` : `1px solid transparent`,
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        <Divider style={{ borderColor: 'var(--border)' }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </Drawer>

      {/* Page content with entrance animation */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      >
        {children}
      </motion.main>
    </div>
  );
}
