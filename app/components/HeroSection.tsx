'use client';

import React, { useState, useEffect } from 'react';
import { Button, Typography, Tag, Row, Col, Card, Flex } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { usePageTransition } from './PageTransition';

const { Title, Paragraph, Text } = Typography;

const HeroSection: React.FC = () => {
  const { isAnimationReady } = usePageTransition();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
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

  const cardVariants = {
    hidden: { opacity: 0, x: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const blobVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 0.12,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: 'easeOut',
      },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const trustedByVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 1,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <section
      style={{
        position: 'relative',
        minHeight: isMobile ? 'auto' : '100vh',
        padding: isMobile ? '100px 16px 40px' : '100px 24px 40px',
        overflow: 'hidden',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Orange Gradient Blob - Hidden on mobile for cleaner look */}
      {!isMobile && (
        <motion.div
          variants={blobVariants}
          initial="hidden"
          animate={isAnimationReady ? 'visible' : 'hidden'}
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-15%',
            width: '60%',
            height: '120%',
            background: 'linear-gradient(135deg, #FFB066 0%, #FF7A00 50%, #E06000 100%)',
            borderRadius: '40% 30% 50% 40%',
            transform: 'rotate(-15deg)',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1, width: '100%' }}>
        <Row gutter={[48, 32]} align="middle">
          {/* Left Column */}
          <Col xs={24} md={12}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isAnimationReady ? 'visible' : 'hidden'}
            >
              <Flex vertical gap={20} style={{ width: '100%' }}>
                <motion.div variants={itemVariants}>
                  <Tag
                    style={{
                      background: 'linear-gradient(135deg, #FFF3E8 0%, #FFE8D6 100%)',
                      border: 'none',
                      color: '#E06000',
                      fontWeight: 600,
                      fontSize: isMobile ? 12 : 14,
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      borderRadius: 50,
                    }}
                  >
                    All-in-one Restaurant Ops Platform
                  </Tag>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Title
                    level={1}
                    style={{
                      fontSize: isMobile ? 28 : 'clamp(36px, 5vw, 56px)',
                      fontWeight: 700,
                      lineHeight: 1.15,
                      margin: 0,
                      color: '#111111',
                    }}
                  >
                    Tối ưu vận hành nhà hàng với RestX
                  </Title>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Paragraph
                    style={{
                      fontSize: isMobile ? 15 : 18,
                      color: '#4F4F4F',
                      lineHeight: 1.7,
                      margin: 0,
                      maxWidth: 480,
                    }}
                  >
                    Quản lý đặt bàn, order, bếp, kho và báo cáo trên một nền tảng duy nhất.
                  </Paragraph>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Flex gap={12} wrap="wrap">
                    <Button
                      type="primary"
                      size={isMobile ? 'middle' : 'large'}
                      block={isMobile}
                      style={{
                        height: isMobile ? 44 : 52,
                        padding: isMobile ? '0 24px' : '0 36px',
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 600,
                        borderRadius: 50,
                        background: 'linear-gradient(135deg, #FF7A00 0%, #E06000 100%)',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(255, 122, 0, 0.35)',
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      size={isMobile ? 'middle' : 'large'}
                      icon={<PlayCircleOutlined />}
                      block={isMobile}
                      style={{
                        height: isMobile ? 44 : 52,
                        padding: isMobile ? '0 20px' : '0 32px',
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 600,
                        borderRadius: 50,
                        borderColor: '#E5E7EB',
                        color: '#111111',
                      }}
                    >
                      Watch Demo
                    </Button>
                  </Flex>
                </motion.div>

                {/* Stats */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate={isAnimationReady ? 'visible' : 'hidden'}
                  style={{ marginTop: 8 }}
                >
                  <Row gutter={[isMobile ? 16 : 32, 16]}>
                    {[
                      { value: '100.000+', label: 'Thương hiệu' },
                      { value: '15+', label: 'Năm kinh nghiệm' },
                      { value: '500+', label: 'Chi nhánh' },
                    ].map((stat, index) => (
                      <Col key={index} xs={8}>
                        <motion.div
                          variants={statsVariants}
                          custom={index}
                          style={{ 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'baseline', 
                            gap: isMobile ? 2 : 8 
                          }}
                        >
                          <span style={{ color: '#FF7A00', fontSize: isMobile ? 20 : 28, fontWeight: 700 }}>{stat.value}</span>
                          <span style={{ color: '#4F4F4F', fontSize: isMobile ? 11 : 13 }}>{stat.label}</span>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                </motion.div>
              </Flex>
            </motion.div>
          </Col>

          {/* Right Column - Dashboard Mockup - Hidden on small mobile */}
          <Col xs={24} md={12} style={{ display: isMobile ? 'none' : 'block' }}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate={isAnimationReady ? 'visible' : 'hidden'}
            >
              <Card
                style={{
                  background: '#FAFAFA',
                  borderRadius: 24,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                }}
                styles={{ body: { padding: 24 } }}
              >
                <Flex vertical gap={20} style={{ width: '100%' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 18 }}>Tổng quan hoạt động</Text>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #FF7A00 0%, #E06000 100%)',
                        borderRadius: 8,
                      }}
                    />
                  </div>

                  {/* Chart Area */}
                  <div
                    style={{
                      height: 180,
                      border: '2px dashed #D1D5DB',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#FFFFFF',
                    }}
                  >
                    <Text style={{ color: '#9CA3AF' }}>📊 Revenue Chart</Text>
                  </div>

                  {/* Metrics */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card size="small" style={{ borderRadius: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                          Doanh thu
                        </Text>
                        <Title level={4} style={{ margin: '8px 0 0', color: '#FF7A00' }}>
                          ₫2.4M
                        </Title>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small" style={{ borderRadius: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                          Đơn hàng
                        </Text>
                        <Title level={4} style={{ margin: '8px 0 0', color: '#FF7A00' }}>
                          148
                        </Title>
                      </Card>
                    </Col>
                  </Row>

                  {/* Table Preview */}
                  <Card size="small" style={{ borderRadius: 12 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>
                      📋 Recent Orders
                    </Text>
                    <Flex vertical gap={8} style={{ width: '100%' }}>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: 10,
                            background: '#E5E7EB',
                            borderRadius: 4,
                            width: `${100 - i * 15}%`,
                          }}
                        />
                      ))}
                    </Flex>
                  </Card>
                </Flex>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Trusted By - Inside Hero */}
        <motion.div
          variants={trustedByVariants}
          initial="hidden"
          animate={isAnimationReady ? 'visible' : 'hidden'}
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: '1px solid rgba(229, 231, 235, 0.6)',
            textAlign: 'center',
          }}
        >
          <Text
            style={{
              color: '#9CA3AF',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
            }}
          >
            Được tin dùng bởi các thương hiệu hàng đầu
          </Text>
          <motion.div
            initial="hidden"
            animate={isAnimationReady ? 'visible' : 'hidden'}
            variants={{
              hidden: { opacity: 1 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 1.2,
                },
              },
            }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 24,
              marginTop: 20,
              flexWrap: 'wrap',
            }}
          >
            {['Golden Gate', 'Redsun', 'ThaiExpress', 'Phở 24', 'Highlands', 'King BBQ'].map((brand, index) => (
              <motion.span
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.4,
                      ease: [0.25, 0.4, 0.25, 1],
                    },
                  },
                }}
                style={{
                  color: '#9CA3AF',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '8px 16px',
                  background: 'rgba(249, 250, 251, 0.8)',
                  borderRadius: 8,
                }}
              >
                {brand}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
