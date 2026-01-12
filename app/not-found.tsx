'use client';

import React, { useState, useEffect } from 'react';
import { Button, Typography, Space, Card } from 'antd';
import {
  HomeOutlined,
  ArrowLeftOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export default function NotFound() {
  const router = useRouter();
  // Use state with safe default to prevent hydration mismatch
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Detect theme from data-theme attribute or localStorage
    const detectTheme = () => {
      if (typeof window !== 'undefined') {
        const themeAttr = document.documentElement.getAttribute('data-theme');
        if (themeAttr === 'dark' || themeAttr === 'light') {
          return themeAttr;
        }
        const stored = localStorage.getItem('restx-theme-mode');
        if (stored === 'dark' || stored === 'light') {
          return stored;
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        return media.matches ? 'dark' : 'light';
      }
      return 'light';
    };
    setMode(detectTheme() as 'light' | 'dark');
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  // Use CSS variables for theme to prevent hydration mismatch
  // Default to light theme until mounted
  const isDark = mounted && mode === 'dark';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0E121A 0%, #141927 50%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #F7F8FA 0%, #FFFFFF 50%, #F7F8FA 100%)',
      }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl">
        <Card
          className="text-center border-0 shadow-2xl relative"
          style={{
            background: isDark
              ? 'rgba(20, 25, 39, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '48px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
          {/* Animated 404 Icon */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div
              variants={iconVariants}
              className="inline-flex items-center justify-center mb-6">
              <div
                className="relative"
                style={{
                  fontSize: '120px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FFB066 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1,
                }}>
                404
              </div>
            </motion.div>
            
            {/* Animated Icon */}
            <motion.div
              variants={pulseVariants}
              animate="animate"
              className="flex justify-center mb-6">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: '120px',
                  height: '120px',
                  background: isDark
                    ? 'rgba(255, 122, 0, 0.1)'
                    : 'rgba(255, 122, 0, 0.05)',
                  border: `2px solid ${isDark ? 'rgba(255, 122, 0, 0.3)' : 'rgba(255, 122, 0, 0.2)'}`,
                }}>
                <CoffeeOutlined
                  style={{
                    fontSize: '48px',
                    color: '#FF7A00',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div variants={itemVariants}>
            <Title
              level={1}
              style={{
                fontSize: '32px',
                fontWeight: 700,
                marginBottom: '16px',
                color: isDark ? '#ECECEC' : '#111111',
              }}>
              Trang không tìm thấy
            </Title>
          </motion.div>

          {/* Description */}
          <motion.div variants={itemVariants}>
            <Paragraph
              style={{
                fontSize: '18px',
                marginBottom: '32px',
                color: isDark ? '#C5C5C5' : '#4F4F4F',
                maxWidth: '500px',
                margin: '0 auto 32px',
              }}>
              Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
              Có thể món ăn này đã hết trong thực đơn!
            </Paragraph>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={itemVariants}>
            <Space size="large" wrap className="justify-center">
              <Button
                type="primary"
                size="large"
                icon={<HomeOutlined />}
                onClick={() => router.push('/')}
                style={{
                  height: '48px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #FF7A00 0%, #FFB066 100%)',
                  border: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(255, 122, 0, 0.3)',
                }}>
                Về trang chủ
              </Button>
              
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{
                  height: '48px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  borderRadius: '24px',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F7F8FA',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid #E5E7EB',
                  color: isDark ? '#ECECEC' : '#111111',
                  fontWeight: 600,
                }}>
                Quay lại
              </Button>
            </Space>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="mt-12">
            <Text
              style={{
                fontSize: '14px',
                color: isDark ? '#9CA3AF' : '#6B7280',
                display: 'block',
                marginBottom: '16px',
              }}>
              Hoặc truy cập:
            </Text>
            <Space size="middle" wrap className="justify-center">
              <Link
                href="/restaurant"
                style={{
                  color: '#FF7A00',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFB066';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FF7A00';
                  e.currentTarget.style.textDecoration = 'none';
                }}>
                Nhà hàng
              </Link>
              <span style={{ color: isDark ? '#4B5563' : '#D1D5DB' }}>•</span>
              <Link
                href="/login"
                style={{
                  color: '#FF7A00',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFB066';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FF7A00';
                  e.currentTarget.style.textDecoration = 'none';
                }}>
                Đăng nhập
              </Link>
              <span style={{ color: isDark ? '#4B5563' : '#D1D5DB' }}>•</span>
              <Link
                href="/customer"
                style={{
                  color: '#FF7A00',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFB066';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#FF7A00';
                  e.currentTarget.style.textDecoration = 'none';
                }}>
                Khách hàng
              </Link>
            </Space>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                top: '10%',
                right: '10%',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: isDark
                  ? 'rgba(255, 122, 0, 0.05)'
                  : 'rgba(255, 122, 0, 0.03)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 60, 0],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '10%',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: isDark
                  ? 'rgba(255, 122, 0, 0.05)'
                  : 'rgba(255, 122, 0, 0.03)',
                filter: 'blur(40px)',
              }}
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

