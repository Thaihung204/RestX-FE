'use client';

import React, { useState } from 'react';
import { Typography, Row, Col, Card, Flex } from 'antd';
import {
  TableOutlined,
  FileTextOutlined,
  InboxOutlined,
  BarChartOutlined,
  ShopOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: <TableOutlined style={{ fontSize: 36 }} />,
    title: 'Quản lý đặt bàn thông minh',
    description:
      'Hệ thống đặt bàn tự động với giao diện trực quan, giúp tối ưu hóa sơ đồ bàn và giảm thời gian chờ cho khách hàng.',
    color: '#FF7A00',
  },
  {
    icon: <FileTextOutlined style={{ fontSize: 36 }} />,
    title: 'Order & KOT liền mạch',
    description:
      'Đồng bộ order từ phục vụ đến bếp ngay lập tức. Theo dõi trạng thái món ăn realtime và giảm thiểu sai sót.',
    color: '#10B981',
  },
  {
    icon: <InboxOutlined style={{ fontSize: 36 }} />,
    title: 'Quản lý kho & nguyên vật liệu',
    description:
      'Kiểm soát tồn kho chính xác, cảnh báo nguyên liệu sắp hết, và tối ưu chi phí mua hàng theo chu kỳ kinh doanh.',
    color: '#6366F1',
  },
  {
    icon: <BarChartOutlined style={{ fontSize: 36 }} />,
    title: 'Báo cáo realtime',
    description:
      'Dashboard phân tích doanh thu, món bán chạy, hiệu suất nhân viên. Tất cả dữ liệu cập nhật theo thời gian thực.',
    color: '#F59E0B',
  },
  {
    icon: <ShopOutlined style={{ fontSize: 36 }} />,
    title: 'Đa chi nhánh',
    description:
      'Quản lý nhiều cửa hàng trên một hệ thống. Đồng bộ menu, giá bán và tổng hợp báo cáo tập trung.',
    color: '#EC4899',
  },
  {
    icon: <ApiOutlined style={{ fontSize: 36 }} />,
    title: 'Tích hợp linh hoạt',
    description:
      'Kết nối với payment gateway, giao hàng, kế toán và các ứng dụng bên thứ ba thông qua API mở.',
    color: '#14B8A6',
  },
];

const FeatureSection: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const headerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const iconVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.1, 
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.4 }
    },
  };

  return (
    <section
      id="product"
      style={{
        padding: '100px 24px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-10%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(255, 122, 0, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={headerVariants}
        >
          <Flex vertical gap={16} align="center" style={{ width: '100%', textAlign: 'center', marginBottom: 64 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span
                style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #FFF3E8 0%, #FFE8D6 100%)',
                  borderRadius: 50,
                  color: '#E06000',
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 16,
                }}
              >
                ✨ Tính năng
              </span>
            </motion.div>
            <Title
              level={2}
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 700,
                margin: 0,
                color: '#111111',
                lineHeight: 1.2,
              }}
            >
              Tính năng nổi bật của{' '}
              <span style={{ 
                background: 'linear-gradient(135deg, #FF7A00 0%, #E06000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                RestX
              </span>
            </Title>
            <Paragraph
              style={{
                fontSize: 18,
                color: '#4F4F4F',
                margin: 0,
                maxWidth: 600,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.7,
              }}
            >
              Tất cả công cụ bạn cần để vận hành nhà hàng – trong một giao diện trực quan.
            </Paragraph>
          </Flex>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={containerVariants}
        >
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <motion.div 
                  variants={cardVariants} 
                  style={{ height: '100%' }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                >
                  <motion.div
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                    style={{ height: '100%' }}
                  >
                    <Card
                      hoverable
                      style={{
                        height: '100%',
                        borderRadius: 20,
                        border: hoveredIndex === index ? `2px solid ${feature.color}30` : '1px solid #E5E7EB',
                        transition: 'all 0.3s ease',
                        background: hoveredIndex === index 
                          ? `linear-gradient(135deg, ${feature.color}05 0%, #FFFFFF 100%)`
                          : '#FFFFFF',
                        boxShadow: hoveredIndex === index 
                          ? `0 20px 40px ${feature.color}15`
                          : '0 4px 20px rgba(0, 0, 0, 0.05)',
                      }}
                      styles={{ body: { padding: 28 } }}
                    >
                      <Flex vertical gap={16}>
                        <motion.div
                          initial="rest"
                          animate={hoveredIndex === index ? 'hover' : 'rest'}
                          variants={iconVariants}
                          style={{
                            width: 72,
                            height: 72,
                            background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}08 100%)`,
                            borderRadius: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: feature.color,
                            border: `1px solid ${feature.color}20`,
                          }}
                        >
                          {feature.icon}
                        </motion.div>
                        <Title level={5} style={{ margin: 0, color: '#111111', fontSize: 18 }}>
                          {feature.title}
                        </Title>
                        <Text style={{ color: '#4F4F4F', lineHeight: 1.7, fontSize: 15 }}>
                          {feature.description}
                        </Text>
                        
                        {/* Learn more link */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={hoveredIndex === index ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span
                            style={{
                              color: feature.color,
                              fontWeight: 600,
                              fontSize: 14,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            Tìm hiểu thêm 
                            <motion.span
                              animate={hoveredIndex === index ? { x: [0, 5, 0] } : { x: 0 }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            >
                              →
                            </motion.span>
                          </span>
                        </motion.div>
                      </Flex>
                    </Card>
                  </motion.div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSection;
