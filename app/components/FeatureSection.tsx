'use client';

import React from 'react';
import { Typography, Row, Col, Card, Space } from 'antd';
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
}

const features: Feature[] = [
  {
    icon: <TableOutlined style={{ fontSize: 40, color: '#FF7A00' }} />,
    title: 'Quản lý đặt bàn thông minh',
    description:
      'Hệ thống đặt bàn tự động với giao diện trực quan, giúp tối ưu hóa sơ đồ bàn và giảm thời gian chờ cho khách hàng.',
  },
  {
    icon: <FileTextOutlined style={{ fontSize: 40, color: '#FF7A00' }} />,
    title: 'Order & KOT liền mạch',
    description:
      'Đồng bộ order từ phục vụ đến bếp ngay lập tức. Theo dõi trạng thái món ăn realtime và giảm thiểu sai sót.',
  },
  {
    icon: <InboxOutlined style={{ fontSize: 40, color: '#FF7A00' }} />,
    title: 'Quản lý kho & nguyên vật liệu',
    description:
      'Kiểm soát tồn kho chính xác, cảnh báo nguyên liệu sắp hết, và tối ưu chi phí mua hàng theo chu kỳ kinh doanh.',
  },
  {
    icon: <BarChartOutlined style={{ fontSize: 40, color: '#FF7A00' }} />,
    title: 'Báo cáo realtime',
    description:
      'Dashboard phân tích doanh thu, món bán chạy, hiệu suất nhân viên. Tất cả dữ liệu cập nhật theo thời gian thực.',
  },
  {
    icon: <ShopOutlined style={{ fontSize: 40, color: '#FF7A00' }} />,
    title: 'Đa chi nhánh',
    description:
      'Quản lý nhiều cửa hàng trên một hệ thống. Đồng bộ menu, giá bán và tổng hợp báo cáo tập trung.',
  },
  {
    icon: <ApiOutlined style={{ fontSize: 40, color: '#FF7A00' }} />,
    title: 'Tích hợp linh hoạt',
    description:
      'Kết nối với payment gateway, giao hàng, kế toán và các ứng dụng bên thứ ba thông qua API mở.',
  },
];

const FeatureSection: React.FC = () => {
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

  return (
    <section
      style={{
        padding: '80px 24px',
        background: '#F9FAFB',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={headerVariants}
        >
          <Space orientation="vertical" size={16} style={{ width: '100%', textAlign: 'center', marginBottom: 64 }}>
            <Title
              level={2}
              style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 700,
                margin: 0,
                color: '#111111',
              }}
            >
              Tính năng nổi bật của RestX
            </Title>
            <Paragraph
              style={{
                fontSize: 18,
                color: '#4F4F4F',
                margin: 0,
                maxWidth: 600,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Tất cả công cụ bạn cần để vận hành nhà hàng – trong một giao diện trực quan.
            </Paragraph>
          </Space>
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
                <motion.div variants={cardVariants} style={{ height: '100%' }}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      transition: 'all 0.3s ease',
                    }}
                    styles={{ body: { padding: 28 } }}
                  >
                    <Space orientation="vertical" size={16}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          background: 'linear-gradient(135deg, #FFF3E8 0%, #FFE8D6 100%)',
                          borderRadius: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {feature.icon}
                      </div>
                      <Title level={5} style={{ margin: 0, color: '#111111' }}>
                        {feature.title}
                      </Title>
                      <Text style={{ color: '#4F4F4F', lineHeight: 1.7 }}>
                        {feature.description}
                      </Text>
                    </Space>
                  </Card>
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
