'use client';

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusCircleOutlined,
  QrcodeOutlined,
  RadarChartOutlined,
  SafetyOutlined,
  TableOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { Col, Row, Tag, Typography } from 'antd';
import { motion, useInView } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const PanoramaViewer = dynamic(() => import('./PanoramaViewer'), { ssr: false });

const { Title, Paragraph, Text } = Typography;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] } },
};

const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const featureItem = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const arrowBounce = {
  animate: {
    x: [0, 10, 0],
    transition: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' },
  },
};

const floatImage = {
  animate: {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
  },
};

const steps = [
  {
    icon: <EnvironmentOutlined style={{ fontSize: 28 }} />,
    step: '01',
    titleKey: 'tour.tables.steps.1.title',
    descriptionKey: 'tour.tables.steps.1.description',
    color: '#10B981',
  },
  {
    icon: <TableOutlined style={{ fontSize: 28 }} />,
    step: '02',
    titleKey: 'tour.tables.steps.2.title',
    descriptionKey: 'tour.tables.steps.2.description',
    color: '#10B981',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 28 }} />,
    step: '03',
    titleKey: 'tour.tables.steps.3.title',
    descriptionKey: 'tour.tables.steps.3.description',
    color: 'var(--primary)',
  },
];

const highlights = [
  { icon: <UploadOutlined />, textKey: 'tour.tables.highlights.upload_floor_map' },
  { icon: <PlusCircleOutlined />, textKey: 'tour.tables.highlights.add_and_name_table' },
  { icon: <EyeOutlined />, textKey: 'tour.tables.highlights.real_position_view' },
];

const panoramaHighlights = [
  { icon: <CameraOutlined />, textKey: 'tour.tables.panorama.highlights.upload_360' },
  { icon: <CompassOutlined />, textKey: 'tour.tables.panorama.highlights.rotate_preview' },
  { icon: <RadarChartOutlined />, textKey: 'tour.tables.panorama.highlights.increase_conversion' },
];

const qrHighlights = [
  { icon: <QrcodeOutlined />, textKey: 'tour.tables.qr.highlights.unique_qr_per_table' },
  { icon: <CheckCircleOutlined />, textKey: 'tour.tables.qr.highlights.auto_bind_order' },
  { icon: <SafetyOutlined />, textKey: 'tour.tables.qr.highlights.no_cross_table_mixup' },
  { icon: <ThunderboltOutlined />, textKey: 'tour.tables.qr.highlights.faster_service' },
];

export default function TablesTourPage() {
  const { t } = useTranslation();
  const step1Ref = useRef(null);
  const panoramaRef = useRef(null);
  const stepsRef = useRef(null);
  const step1InView = useInView(step1Ref, { once: true, amount: 0.2 });
  const panoramaInView = useInView(panoramaRef, { once: true, amount: 0.2 });
  const stepsInView = useInView(stepsRef, { once: true, amount: 0.2 });

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* ── STEP 1: Floor Plan Upload Section ── */}
      <section
        ref={step1Ref}
        style={{
          padding: '120px 24px 80px',
          background: 'var(--bg-base)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[64, 48]} align="middle">

            {/* Left: Text content */}
            <Col xs={24} lg={11}>
              <motion.div
                initial="hidden"
                animate={step1InView ? 'visible' : 'hidden'}
                variants={stagger}
              >
                <motion.div variants={featureItem}>
                  <Tag
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10B981',
                      borderRadius: 20,
                      padding: '4px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 20,
                    }}
                  >
                    {t('tour.tables.section_1.tag')}
                  </Tag>
                </motion.div>

                <motion.div variants={featureItem}>
                  <Title
                    level={2}
                    style={{
                      fontSize: 'clamp(26px, 3.5vw, 40px)',
                      fontWeight: 800,
                      color: 'var(--text)',
                      lineHeight: 1.2,
                      margin: '0 0 20px',
                    }}
                  >
                    {t('tour.tables.section_1.title_prefix')}{' '}
                    <span style={{ color: '#10B981' }}>{t('tour.tables.section_1.title_highlight')}</span>{' '}
                    {t('tour.tables.section_1.title_suffix')}
                  </Title>
                </motion.div>

                <motion.div variants={featureItem}>
                  <Paragraph
                    style={{
                      fontSize: 16,
                      color: 'var(--text-muted)',
                      lineHeight: 1.8,
                      margin: '0 0 32px',
                    }}
                  >
                    {t('tour.tables.section_1.description')}
                  </Paragraph>
                </motion.div>

                <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {highlights.map((item, i) => (
                    <motion.div
                      key={i}
                      variants={featureItem}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10B981',
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </span>
                      <Text style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
                        {t(item.textKey)}
                      </Text>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </Col>

            {/* Arrow connector */}
            <Col xs={0} lg={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={step1InView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <motion.div
                  variants={arrowBounce}
                  animate="animate"
                  style={{ color: '#10B981', fontSize: 28 }}
                >
                  <ArrowRightOutlined />
                </motion.div>
              </motion.div>
            </Col>

            {/* Right: Image */}
            <Col xs={24} lg={11}>
              <motion.div
                initial="hidden"
                animate={step1InView ? 'visible' : 'hidden'}
                variants={fadeRight}
              >
                <motion.div variants={floatImage} animate="animate">
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 24,
                      overflow: 'hidden',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                      border: '2px solid rgba(16,185,129,0.2)',
                    }}
                  >
                    {/* Glow overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, transparent 60%)',
                        zIndex: 1,
                        pointerEvents: 'none',
                      }}
                    />
                    <img
                      src="/images/example/Floor-plan-examples.png"
                      alt={t('tour.tables.section_1.image_alt')}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        borderRadius: 22,
                      }}
                    />

                    {/* Floating badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={step1InView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.9, duration: 0.4 }}
                      style={{
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        zIndex: 2,
                        background: 'rgba(16,185,129,0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: 12,
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                      }}
                    >
                      <EnvironmentOutlined style={{ color: 'white', fontSize: 16 }} />
                      <Text style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                        {t('tour.tables.section_1.badge')}
                      </Text>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </Col>

          </Row>
        </div>
      </section>

      {/* ── PANORAMA 360° Section ── */}
      <section
        ref={panoramaRef}
        style={{
          padding: '80px 24px',
          background: 'var(--card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* bg blobs */}
        <div style={{ position: 'absolute', top: -60, left: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[64, 48]} align="middle">

            {/* Left: Real 360° Viewer */}
            <Col xs={24} lg={11}>
              <motion.div
                initial="hidden"
                animate={panoramaInView ? 'visible' : 'hidden'}
                variants={fadeRight}
              >
                <div style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '2px solid rgba(16,185,129,0.25)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
                  background: '#0f0f1a',
                  position: 'relative',
                }}>
                  {/* Viewer header bar */}
                  <div style={{
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['#FF5F57', '#FFBD2E', '#28CA41'].map((c) => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      <CompassOutlined />
                      <span>{t('tour.tables.panorama.viewer_title')}</span>
                    </div>
                    <div style={{ width: 48 }} />
                  </div>

                  {/* Three.js panorama */}
                  <PanoramaViewer src="/images/example/panorama.png" height={300} />

                  {/* Drag hint overlay — fades out */}
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ delay: 2.5, duration: 1.2 }}
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      pointerEvents: 'none',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '5px 12px',
                      borderRadius: 20,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <motion.span animate={{ x: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                      <ArrowLeftOutlined style={{ fontSize: 10 }} />
                    </motion.span>
                    <span>{t('tour.tables.panorama.drag_hint')}</span>
                    <motion.span animate={{ x: [6, -6, 6] }} transition={{ repeat: Infinity, duration: 1.4 }}>
                      <ArrowRightOutlined style={{ fontSize: 10 }} />
                    </motion.span>
                  </motion.div>
                </div>
              </motion.div>
            </Col>

            {/* Arrow connector */}
            <Col xs={0} lg={2} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={panoramaInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <motion.div
                  variants={arrowBounce}
                  animate="animate"
                  style={{ color: '#10B981', fontSize: 28 }}
                >
                  <ArrowRightOutlined />
                </motion.div>
              </motion.div>
            </Col>

            {/* Right: Text */}
            <Col xs={24} lg={11}>
              <motion.div
                initial="hidden"
                animate={panoramaInView ? 'visible' : 'hidden'}
                variants={stagger}
              >
                <motion.div variants={featureItem}>
                  <Tag
                    style={{
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10B981',
                      borderRadius: 20,
                      padding: '4px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 20,
                    }}
                  >
                    {t('tour.tables.panorama.tag')}
                  </Tag>
                </motion.div>

                <motion.div variants={featureItem}>
                  <Title
                    level={2}
                    style={{
                      fontSize: 'clamp(24px, 3vw, 36px)',
                      fontWeight: 800,
                      color: 'var(--text)',
                      lineHeight: 1.25,
                      margin: '0 0 20px',
                    }}
                  >
                    {t('tour.tables.panorama.title_prefix')}{' '}
                    <span style={{ color: '#10B981' }}>{t('tour.tables.panorama.title_highlight')}</span>{' '}
                    {t('tour.tables.panorama.title_suffix')}
                  </Title>
                </motion.div>

                <motion.div variants={featureItem}>
                  <Paragraph
                    style={{
                      fontSize: 16,
                      color: 'var(--text-muted)',
                      lineHeight: 1.8,
                      margin: '0 0 32px',
                    }}
                  >
                    {t('tour.tables.panorama.description')}
                  </Paragraph>
                </motion.div>

                <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {panoramaHighlights.map((item, i) => (
                    <motion.div
                      key={i}
                      variants={featureItem}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 12,
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#10B981',
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                      <Text style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
                        {t(item.textKey)}
                      </Text>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </Col>

          </Row>

          {/* ── Arrow down ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={panoramaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '56px 0 0' }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '2px solid rgba(16,185,129,0.4)',
                background: 'rgba(16,185,129,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                fontSize: 18,
              }}
            >
              <ArrowDownOutlined />
            </motion.div>
          </motion.div>

          {/* ── QR Code Sub-section ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={panoramaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.0, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ marginTop: 48 }}
          >
            <Row gutter={[64, 48]} align="middle">

              {/* Left: text */}
              <Col xs={24} lg={12}>
                <motion.div
                  initial="hidden"
                  animate={panoramaInView ? 'visible' : 'hidden'}
                  variants={stagger}
                >
                  <motion.div variants={featureItem}>
                    
                  </motion.div>

                  <motion.div variants={featureItem}>
                    <Title
                      level={2}
                      style={{
                        fontSize: 'clamp(24px, 3vw, 36px)',
                        fontWeight: 800,
                        color: 'var(--text)',
                        lineHeight: 1.25,
                        margin: '0 0 20px',
                      }}
                    >
                      {t('tour.tables.qr.title_prefix')}{' '}
                      <span style={{ color: '#10B981' }}>{t('tour.tables.qr.title_highlight')}</span>{' '}
                      {t('tour.tables.qr.title_suffix')}
                    </Title>
                  </motion.div>

                  <motion.div variants={featureItem}>
                    <Paragraph
                      style={{
                        fontSize: 16,
                        color: 'var(--text-muted)',
                        lineHeight: 1.8,
                        margin: '0 0 32px',
                      }}
                    >
                      {t('tour.tables.qr.description')}
                    </Paragraph>
                  </motion.div>

                  <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {qrHighlights.map((item, i) => (
                      <motion.div
                        key={i}
                        variants={featureItem}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          borderRadius: 12,
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#10B981',
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                        <Text style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
                          {t(item.textKey)}
                        </Text>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </Col>

              {/* Right: QR image */}
              <Col xs={24} lg={12}>
                <motion.div
                  initial="hidden"
                  animate={panoramaInView ? 'visible' : 'hidden'}
                  variants={fadeRight}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 24,
                        overflow: 'hidden',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                        border: '2px solid rgba(16,185,129,0.2)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, transparent 60%)',
                          zIndex: 1,
                          pointerEvents: 'none',
                        }}
                      />
                      <img
                        src="/images/example/qrtable.png"
                        alt={t('tour.tables.qr.image_alt')}
                        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 22 }}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={panoramaInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 1.4, duration: 0.4 }}
                        style={{
                          position: 'absolute',
                          bottom: 20,
                          left: 20,
                          zIndex: 2,
                          background: 'rgba(16,185,129,0.95)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 12,
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
                        }}
                      >
                        <QrcodeOutlined style={{ color: 'white', fontSize: 16 }} />
                        <Text style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
                          {t('tour.tables.qr.badge')}
                        </Text>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              </Col>

            </Row>
          </motion.div>

        </div>
      </section>
                  
    </div>
  );
}
