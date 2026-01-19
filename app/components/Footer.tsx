'use client';

import React from 'react';
import { Typography, Row, Col, Space, Divider } from 'antd';
import {
  FacebookFilled,
  LinkedinFilled,
  YoutubeFilled,
} from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text, Link } = Typography;

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '#overview' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#integrations' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '#blog' },
      { label: 'Help Center', href: '#help' },
      { label: 'FAQs', href: '#faqs' },
      { label: 'Documentation', href: '#docs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Careers', href: '#careers' },
      { label: 'Partners', href: '#partners' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'GDPR', href: '#gdpr' },
    ],
  },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  const bottomVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.4,
      },
    },
  };

  return (
    <footer
      style={{
        background: 'var(--surface)',
        padding: '64px 24px 32px',
        color: 'var(--text)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <Row gutter={[48, 48]}>
            {/* Logo and Tagline */}
            <Col xs={24} md={8}>
              <motion.div variants={itemVariants}>
                <Space orientation="vertical" size={20}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background: 'linear-gradient(135deg, #FF380B 0%, #CC2D08 100%)',
                        borderRadius: 12,
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
                    <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>
                      Rest<span style={{ color: '#FF7A00' }}>X</span>
                    </Title>
                  </div>

                  <Text style={{ color: 'var(--text-muted)', lineHeight: 1.7, display: 'block', maxWidth: 280 }}>
                    RestX – Nền tảng vận hành nhà hàng thế hệ mới. Giúp bạn quản lý mọi khía cạnh của nhà hàng trên một hệ thống duy nhất.
                  </Text>

                  {/* Social Icons */}
                  <Space size={8}>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <FacebookFilled style={{ fontSize: 18 }} />
                    </a>
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <LinkedinFilled style={{ fontSize: 18 }} />
                    </a>
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <YoutubeFilled style={{ fontSize: 18 }} />
                    </a>
                  </Space>
                </Space>
              </motion.div>
            </Col>

            {/* Footer Links */}
            <Col xs={24} md={16}>
              <Row gutter={[32, 32]}>
                {footerColumns.map((column, index) => (
                  <Col xs={12} sm={6} key={index}>
                    <motion.div variants={itemVariants}>
                      <Space orientation="vertical" size={16}>
                        <Text strong style={{ color: 'var(--text)', fontSize: 15 }}>
                          {column.title}
                        </Text>
                        <Space orientation="vertical" size={12}>
                          {column.links.map((link, linkIndex) => (
                            <Link
                              key={linkIndex}
                              href={link.href}
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: 14,
                                transition: 'color 0.2s ease',
                              }}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </Space>
                      </Space>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={bottomVariants}
        >
          <Divider style={{ borderColor: 'var(--border)', margin: '48px 0 24px' }} />

          {/* Bottom Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              © {currentYear} RestX. All rights reserved.
            </Text>
            <Space size={24}>
              <Link href="#privacy" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Privacy
              </Link>
              <Link href="#terms" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Terms
              </Link>
              <Link href="#cookies" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Cookies
              </Link>
            </Space>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
