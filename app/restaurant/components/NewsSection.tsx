'use client';

import { useTenant } from '@/lib/contexts/TenantContext';
import { TenantConfig } from '@/lib/services/tenantService';
import { CalendarOutlined } from '@ant-design/icons';
import { Col, Row, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

const { Title, Paragraph, Text } = Typography;

const newsData = [
    {
        id: 1,
        date: '24 Tháng 5, 2024',
        title: 'Đêm tiệc rượu vang Pháp đặc sắc',
        desc: 'Khám phá hương vị vang thượng hạng kết hợp cùng các món ăn Âu chuẩn vị tại...',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOqQQInifXdbiRzRtckmOT0XYfsRA-pLCy8xwCOl5Zi8VDTY4i86KmT9oAyXdeFktW5Vb3cUD_GOzmxf9eX1VZvqYu0MFJ8IA6nqJCpyVJG1dBILjRe4Sc0T9glxqjK7-AGbjNvNDYds4Rq_0TNJc9-EifLjOeVNNXNd9Y9Ct5gTgm9SiTXSzFBjaqDwL1XV0Lz3J-8M0Hi8VCxE4sN-v0XR_pk9fuq36ptFYjjrBwcvj77mZL0PZdyV9snkn89oZUOvUoI7ps9y4',
        tagKey: 'event'
    },
    {
        id: 2,
        date: '18 Tháng 5, 2024',
        title: 'Bí quyết chọn nguyên liệu của Bếp trưởng',
        desc: 'Đằng sau mỗi món ngon là quy trình tuyển chọn nguyên liệu cực kỳ khắt khe...',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVQfRntw3ql80E541RU8oC9i4aH3oLTW8F63ke7kUdRapXh_MHuyqEN2gkdLUNhvJbXH1P3bzVZUgXuQ9FboAsh1yUMpv1iOVt8tjrOpBaAfgnubYdJhS8cghcrjrq0HGUlLF3Mk30OIptxLtBhCLoF74XUESpxv07AfD15hsc03-7O9d7UTcgbHLfwjX6SQ42k3TxbBI4h7Cua3gJv1V8jXOlGCAwk51CiT30dH5KrQFLRkH3RyuPAJ1Jwesa929JUseRjiqgGeU',
        tagKey: 'cuisine'
    },
    {
        id: 3,
        date: '10 Tháng 5, 2024',
        title: 'Không gian mới cho những trải nghiệm mới',
        desc: 'Nhà hàng vừa ra mắt khu vực VIP riêng tư, lý tưởng cho những buổi tiếp đãi đối tác...',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-u2-bC62wcZEniRi5vkPg06iLpptuDOTp5Mw-Di3IKoAkLCdlGLxO3TQ8PHAHkh5RsfV4ufYJOuMTPyDte4zHyT-s1Jm_kMEA3wNjevTK7r0heAGsqUI8Em3zMTaW7vaLDx660wF4F2jvCZwQIDMa-6v7uaw5N-uctUuQ0GgEFv0Z5H_2JzG7KxCipIjJtoA-eFwdHPqXUpJa2JTYWWJY02i0qWOb_F4y63eq-1pujirCtWW3a3jKJDA0W8Xh3a0k58_6nrmlTbo',
        tagKey: 'discovery'
    }
];

interface NewsSectionProps {
    tenant: TenantConfig | null;
}

const NewsSection: React.FC<NewsSectionProps> = ({ tenant: propTenant }) => {
    const { t } = useTranslation();
    const { tenant: contextTenant } = useTenant();
    const tenant = propTenant || contextTenant;

    return (
        <section id="news" style={{ padding: '96px 24px', background: 'var(--bg-base)' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 64 }}>
                    <span style={{
                        color: 'var(--primary)',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontSize: 14,
                        display: 'block',
                        marginBottom: 16
                    }}>
                        {t('landing.news.subtitle')}
                    </span>
                    <Title level={2} style={{ fontFamily: 'var(--font-display), serif', fontSize: 36, marginBottom: 16 }}>
                        {t('landing.news.title', { name: tenant?.businessName || tenant?.name || t('landing.news.title_default') })}
                    </Title>
                    <Paragraph type="secondary" style={{ fontSize: 16 }}>
                        {t('landing.news.description')}
                    </Paragraph>
                </div>

                <Row gutter={[32, 32]}>
                    {newsData.map(item => (
                        <Col xs={24} md={8} key={item.id}>
                            <div
                                style={{ cursor: 'pointer' }}
                                className="group"
                            >
                                <div style={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: 16,
                                    marginBottom: 24,
                                    aspectRatio: '16/9'
                                }}>
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.7s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: 16,
                                        left: 16,
                                        background: 'var(--primary)',
                                        color: 'white',
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        padding: '4px 12px',
                                        borderRadius: 999
                                    }}>
                                        {t(`landing.news.tags.${item.tagKey}`)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <CalendarOutlined style={{ color: 'var(--text-muted)' }} />
                                    <Text type="secondary" style={{ fontSize: 14 }}>{item.date}</Text>
                                </div>

                                <Title level={3} style={{
                                    fontSize: 20,
                                    marginTop: 8,
                                    marginBottom: 12,
                                    transition: 'color 0.3s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                                >
                                    {item.title}
                                </Title>

                                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                                    {item.desc}
                                </Paragraph>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
};

export default NewsSection;
