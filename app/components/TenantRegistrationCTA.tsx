'use client';

import React, { useState } from 'react';
import { Button, Typography, Space, Row, Col } from 'antd';
import { RocketOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TenantRequestForm from './TenantRequestForm';

const { Title, Paragraph } = Typography;

const features = [
  'Quick setup in 24 hours',
  'No credit card required',
  'Free trial available',
  'Dedicated support team',
];

export const TenantRegistrationCTA: React.FC = () => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg-base) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255, 107, 59, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-50%',
            left: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255, 56, 11, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={24}>
                <div>
                  <Title
                    level={1}
                    style={{
                      margin: 0,
                      fontSize: 'clamp(32px, 5vw, 48px)',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      background: 'linear-gradient(135deg, #FF6B3B 0%, #FF380B 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Ready to Transform Your Restaurant?
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: '18px',
                      color: 'var(--text-muted)',
                      marginTop: '16px',
                      marginBottom: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    Join hundreds of restaurants already using RestX to streamline operations and boost revenue.
                  </Paragraph>
                </div>

                <div>
                  <Space direction="vertical" size={12}>
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        <CheckCircleOutlined
                          style={{
                            fontSize: '20px',
                            color: '#10b981',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '16px',
                            color: 'var(--text)',
                            fontWeight: 500,
                          }}
                        >
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </Space>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 32px',
                  background: 'var(--card)',
                  borderRadius: '24px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                }}
              >
                <RocketOutlined
                  style={{
                    fontSize: '64px',
                    color: '#FF6B3B',
                    marginBottom: '24px',
                  }}
                />
                <Title
                  level={3}
                  style={{
                    margin: '0 0 16px 0',
                    color: 'var(--text)',
                    fontSize: '24px',
                  }}
                >
                  Start Your Free Trial
                </Title>
                <Paragraph
                  style={{
                    color: 'var(--text-muted)',
                    marginBottom: '32px',
                    fontSize: '15px',
                  }}
                >
                  Fill out a quick form and our team will contact you within 24 hours to get you started.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => setModalVisible(true)}
                  style={{
                    height: '56px',
                    fontSize: '18px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: '0 48px',
                    background: 'linear-gradient(135deg, #FF6B3B 0%, #FF380B 100%)',
                    border: 'none',
                    boxShadow: '0 8px 24px rgba(255, 107, 59, 0.3)',
                  }}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  Register Your Restaurant
                </Button>
                <Paragraph
                  style={{
                    marginTop: '16px',
                    marginBottom: 0,
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  No credit card required • Cancel anytime
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </motion.div>

      <TenantRequestForm
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          // Optional: Track success or show additional message
          console.log('Request submitted successfully');
        }}
      />
    </>
  );
};

export default TenantRegistrationCTA;
