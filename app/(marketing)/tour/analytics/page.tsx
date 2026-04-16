'use client';

import OrdersBarChart from '@/components/admin/charts/OrdersBarChart';
import RevenueChart from '@/components/admin/charts/RevenueChart';
import {
  DashboardOutlined,
  PieChartOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Typography } from 'antd';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

const headerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
  },
};

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
};

const steps = [
  {
    icon: <DashboardOutlined style={{ fontSize: 32 }} />,
    titleKey: 'tour.analytics.steps.data_collection.title',
    descriptionKey: 'tour.analytics.steps.data_collection.description',
    color: 'var(--primary)',
  },
  {
    icon: <PieChartOutlined style={{ fontSize: 32 }} />,
    titleKey: 'tour.analytics.steps.smart_aggregation.title',
    descriptionKey: 'tour.analytics.steps.smart_aggregation.description',
    color: '#6366F1',
  },
  {
    icon: <RiseOutlined style={{ fontSize: 32 }} />,
    titleKey: 'tour.analytics.steps.actionable_insights.title',
    descriptionKey: 'tour.analytics.steps.actionable_insights.description',
    color: '#10B981',
  },
];

const timeFilters = [
  { labelKey: 'tour.analytics.filters.day', value: 'day' },
  { labelKey: 'tour.analytics.filters.week', value: 'week' },
  { labelKey: 'tour.analytics.filters.month', value: 'month' },
  { labelKey: 'tour.analytics.filters.year', value: 'year' },
] as const;

type TimeFilter = (typeof timeFilters)[number]['value'];

const revenueMockData: Record<TimeFilter, { label: string; value: number; date: string }[]> = {
  day: [
    { label: '30/03', value: 3200000, date: '2026-03-30' },
    { label: '31/03', value: 5800000, date: '2026-03-31' },
    { label: '01/04', value: 4400000, date: '2026-04-01' },
    { label: '02/04', value: 6900000, date: '2026-04-02' },
    { label: '03/04', value: 4100000, date: '2026-04-03' },
    { label: '04/04', value: 7200000, date: '2026-04-04' },
    { label: '05/04', value: 3600000, date: '2026-04-05' },
  ],
  week: [
    { label: '16-23/03', value: 20800000, date: '2026-03-16' },
    { label: '24-31/03', value: 34100000, date: '2026-03-24' },
    { label: '01-08/04', value: 18900000, date: '2026-04-01' },
    { label: '09-16/04', value: 44700000, date: '2026-04-09' },
  ],
  month: [
    { label: '01/2026', value: 68000000, date: '2026-01' },
    { label: '02/2026', value: 52000000, date: '2026-02' },
    { label: '03/2026', value: 87000000, date: '2026-03' },
    { label: '04/2026', value: 43000000, date: '2026-04' },
    { label: '05/2026', value: 98000000, date: '2026-05' },
    { label: '06/2026', value: 61000000, date: '2026-06' },
  ],
  year: [
    { label: '2021', value: 180000000, date: '2021-01-01' },
    { label: '2022', value: 147000000, date: '2022-01-01' },
    { label: '2023', value: 229000000, date: '2023-01-01' },
    { label: '2024', value: 192000000, date: '2024-01-01' },
    { label: '2025', value: 268000000, date: '2025-01-01' },
  ],
};

const ordersMockData: Record<TimeFilter, { label: string; total: number; date: string }[]> = {
  day: [
    { label: '30/03', total: 11, date: '2026-03-30' },
    { label: '31/03', total: 36, date: '2026-03-31' },
    { label: '01/04', total: 8, date: '2026-04-01' },
    { label: '02/04', total: 44, date: '2026-04-02' },
    { label: '03/04', total: 19, date: '2026-04-03' },
    { label: '04/04', total: 61, date: '2026-04-04' },
    { label: '05/04', total: 14, date: '2026-04-05' },
  ],
  week: [
    { label: '16-23/03', total: 72, date: '2026-03-16' },
    { label: '24-31/03', total: 181, date: '2026-03-24' },
    { label: '01-08/04', total: 54, date: '2026-04-01' },
    { label: '09-16/04', total: 236, date: '2026-04-09' },
  ],
  month: [
    { label: '01/2026', total: 141, date: '2026-01' },
    { label: '02/2026', total: 264, date: '2026-02' },
    { label: '03/2026', total: 98, date: '2026-03' },
    { label: '04/2026', total: 317, date: '2026-04' },
    { label: '05/2026', total: 176, date: '2026-05' },
    { label: '06/2026', total: 389, date: '2026-06' },
  ],
  year: [
    { label: '2021', total: 1210, date: '2021-01-01' },
    { label: '2022', total: 1875, date: '2022-01-01' },
    { label: '2023', total: 1398, date: '2023-01-01' },
    { label: '2024', total: 2242, date: '2024-01-01' },
    { label: '2025', total: 1654, date: '2025-01-01' },
  ],
};

export default function AnalyticsTourPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TimeFilter>('week');

  const revenueData = useMemo(() => revenueMockData[filter], [filter]);
  const ordersData = useMemo(() => ordersMockData[filter], [filter]);
  const totalRevenue = useMemo(() => revenueData.reduce((sum, item) => sum + item.value, 0), [revenueData]);
  const totalOrders = useMemo(() => ordersData.reduce((sum, item) => sum + item.total, 0), [ordersData]);
  const activeFilterLabel = t(timeFilters.find((item) => item.value === filter)?.labelKey ?? 'tour.analytics.filters.day');

  const filterButtonStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    background: isActive ? 'var(--primary)' : 'var(--card)',
    color: isActive ? '#fff' : 'var(--text)',
    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
    boxShadow: isActive ? '0 8px 20px rgba(255, 56, 11, 0.18)' : 'none',
    cursor: 'pointer',
  });

  return (
    <div style={{ overflow: 'hidden' }}>

      {/* Steps Section */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={headerVariants}
          >
            <div style={{ textAlign: 'center', marginBottom: 64, paddingTop: 30 }}>
              <Title level={2} style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {t('tour.analytics.how_it_works.title')}
              </Title>
              <Paragraph style={{ fontSize: 18, color: 'var(--text-muted)', margin: '12px auto 0', maxWidth: 500 }}>
                {t('tour.analytics.how_it_works.description')}
              </Paragraph>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            <Row gutter={[32, 32]}>
              {steps.map((step, index) => (
                <Col xs={24} md={8} key={index}>
                  <motion.div variants={cardVariants} style={{ height: '100%' }}>
                    <motion.div
                      whileHover={{ y: -8 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                      style={{ height: '100%' }}
                    >
                      <Card
                        style={{
                          height: '100%',
                          borderRadius: 20,
                          border: '2px solid var(--border)',
                          transition: 'all 0.3s ease',
                          background: 'var(--card)',
                        }}
                        styles={{ body: { padding: 32 } }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div
                            style={{
                              width: 64,
                              height: 64,
                              background: `linear-gradient(135deg, ${step.color}15 0%, ${step.color}08 100%)`,
                              borderRadius: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: step.color,
                              border: `1px solid ${step.color}20`,
                            }}
                          >
                            {step.icon}
                          </div>
                          <Title level={4} style={{ margin: 0, color: 'var(--text)' }}>
                            {t(step.titleKey)}
                          </Title>
                          <Text style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 15 }}>
                            {t(step.descriptionKey)}
                          </Text>
                        </div>
                      </Card>
                    </motion.div>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </div>
      </section>

      {/* Interactive Charts Section */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: 300,
            background: 'radial-gradient(ellipse at center, rgba(255, 56, 11, 0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <Card
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                background: 'var(--card)',
              }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
                <div>
                  <Title level={3} style={{ margin: 0, color: 'var(--text)' }}>
                    {t('tour.analytics.interactive.title')}
                  </Title>
                  <Paragraph style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
                    {t('tour.analytics.interactive.description')}
                  </Paragraph>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {timeFilters.map((item) => {
                    const isActive = filter === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setFilter(item.value)}
                        style={filterButtonStyle(isActive)}
                      >
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Button style={{ borderRadius: 999 }}>
                  {t('tour.analytics.summary.total_revenue')}: {new Intl.NumberFormat('vi-VN').format(totalRevenue)}đ
                </Button>
                <Button style={{ borderRadius: 999 }}>
                  {t('tour.analytics.summary.total_orders')}: {totalOrders.toLocaleString('vi-VN')}
                </Button>
              </div>

              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <RevenueChart
                    data={revenueData}
                    totalRevenue={totalRevenue}
                    subtitle={t('tour.analytics.chart.revenue_by_filter', { filter: activeFilterLabel.toLowerCase() })}
                  />
                </Col>
                <Col xs={24} lg={12}>
                  <OrdersBarChart
                    data={ordersData}
                    totalOrders={totalOrders}
                    subtitle={t('tour.analytics.chart.orders_by_filter', { filter: activeFilterLabel.toLowerCase() })}
                  />
                </Col>
              </Row>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
