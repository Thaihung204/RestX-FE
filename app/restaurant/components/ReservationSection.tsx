'use client';

import React from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, Typography } from 'antd';
import { PhoneOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

import { TenantConfig } from '@/lib/services/tenantService';

const { Title, Paragraph, Text } = Typography;

interface ReservationSectionProps {
    tenant: TenantConfig | null;
}

const ReservationSection: React.FC<ReservationSectionProps> = ({ tenant }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log('Reservation:', values);
        // Handle submission logic here
    };

    // Construct address string
    const address = [
        tenant?.businessAddressLine1,
        tenant?.businessAddressLine2,
        tenant?.businessAddressLine3
    ].filter(Boolean).join(', ') || "123 Đường Ẩm Thực, Quận 1, TP.HCM";

    return (
        <section id="reservation" style={{ position: 'relative', padding: '96px 0' }}>
            {/* Background Image with Overlay */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <img
                    alt="Restaurant table"
                    src="/images/restaurant/banner.png"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(26, 32, 44, 0.8)', backdropFilter: 'blur(4px)' }}></div>
            </div>

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 10 }}>
                <div style={{
                    background: 'var(--bg-base)',
                    borderRadius: 24,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'stretch'
                }} className="reservation-card">

                    {/* Info Side */}
                    <div style={{
                        background: 'var(--primary)',
                        padding: 48,
                        color: 'white',
                        flex: '2'
                    }}>
                        <Title level={2} style={{ color: 'white', fontFamily: 'var(--font-display), serif', fontSize: 36, marginBottom: 24 }}>{t('landing.reservation.title')}</Title>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 32 }}>
                            {t('landing.reservation.description')}
                        </Paragraph>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <PhoneOutlined style={{ color: '#FCD34D', fontSize: 20 }} />
                                <Text style={{ color: 'white' }}>{tenant?.businessPrimaryPhone || "+84 (123) 456 789"}</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <ClockCircleOutlined style={{ color: '#FCD34D', fontSize: 20 }} />
                                <Text style={{ color: 'white' }}>{tenant?.businessOpeningHours || "08:00 AM - 10:00 PM"}</Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <EnvironmentOutlined style={{ color: '#FCD34D', fontSize: 20 }} />
                                <Text style={{ color: 'white' }}>{address}</Text>
                            </div>
                        </div>
                    </div>

                    {/* Form Side */}
                    <div style={{ padding: 48, flex: '3', background: 'var(--surface)' }}>
                        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
                            <Row gutter={24}>
                                <Col span={12} xs={24} md={12}>
                                    <Form.Item name="name" label={t('landing.reservation.form.name')} rules={[{ required: true, message: t('landing.reservation.form.name_required') }]}>
                                        <Input placeholder={t('landing.reservation.form.name_placeholder')} style={{ borderRadius: 12 }} />
                                    </Form.Item>
                                </Col>
                                <Col span={12} xs={24} md={12}>
                                    <Form.Item name="phone" label={t('landing.reservation.form.phone')} rules={[{ required: true, message: t('landing.reservation.form.phone_required') }]}>
                                        <Input placeholder={t('landing.reservation.form.phone_placeholder')} style={{ borderRadius: 12 }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12} xs={24} md={12}>
                                    <Form.Item name="guests" label={t('landing.reservation.form.guests')} initialValue="2 người">
                                        <Select style={{ borderRadius: 12 }}>
                                            <Select.Option value="2 người">{t('landing.reservation.guest_options.2')}</Select.Option>
                                            <Select.Option value="4 người">{t('landing.reservation.guest_options.4')}</Select.Option>
                                            <Select.Option value="6 người">{t('landing.reservation.guest_options.6')}</Select.Option>
                                            <Select.Option value="Trên 6 người">{t('landing.reservation.guest_options.more')}</Select.Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12} xs={24} md={12}>
                                    <Form.Item name="date" label={t('landing.reservation.form.date')} rules={[{ required: true, message: t('landing.reservation.form.date_required') }]}>
                                        <DatePicker style={{ width: '100%', borderRadius: 12 }} />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    style={{
                                        height: 56,
                                        borderRadius: 12,
                                        fontWeight: 'bold',
                                        background: 'var(--primary)',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    {t('landing.reservation.form.submit')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </div>

            {/* Mobile responsive fix for flex layout */}
            <style jsx global>{`
        .reservation-card {
            flex-direction: row;
        }
        @media (max-width: 768px) {
          .reservation-card {
            flex-direction: column !important;
          }
        }
      `}</style>
        </section>
    );
};

export default ReservationSection;
