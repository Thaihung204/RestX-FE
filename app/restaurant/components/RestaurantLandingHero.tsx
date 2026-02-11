'use client';

import { useTenant } from '@/lib/contexts/TenantContext';
import { TenantConfig } from '@/lib/services/tenantService';
import { ArrowDownOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';


const { Title, Paragraph, Text } = Typography;

interface HeroProps {
    tenant: TenantConfig | null;
}

const RestaurantLandingHero: React.FC<HeroProps> = ({ tenant: propTenant }) => {
    const { t } = useTranslation();
    const { tenant: contextTenant } = useTenant();
    const tenant = propTenant || contextTenant;

    // Default background if none provided
    const backgroundUrl = tenant?.backgroundUrl;

    return (
        <header id="home" style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* Background Image */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <img
                    alt="Atmospheric restaurant interior"
                    className="w-full h-full object-cover"
                    src={(backgroundUrl && backgroundUrl.trim() !== '') ? backgroundUrl : "/images/restaurant/banner.png"}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = '/images/restaurant/banner.png'; }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}></div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: 896 }}>
                <Text
                    style={{
                        color: 'var(--accent, #D69E2E)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3em',
                        fontWeight: 600,
                        fontSize: 14,
                        display: 'block',
                        marginBottom: 16
                    }}
                >
                    {t('landing.hero.subtitle')}
                </Text>

                <Title
                    level={1}
                    style={{
                        color: 'white',
                        fontSize: 'clamp(3rem, 5vw, 6rem)',
                        fontFamily: 'var(--font-display), serif',
                        marginBottom: 24,
                        lineHeight: 1.1,
                        fontStyle: 'italic',
                        fontWeight: 300
                    }}
                >
                    {t('landing.hero.title')}
                </Title>

                <Paragraph
                    style={{
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                        marginBottom: 40,
                        maxWidth: 672,
                        margin: '0 auto 40px',
                        lineHeight: 1.6
                    }}
                >
                    {t('landing.hero.description')}
                </Paragraph>

                <div style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        type="primary"
                        size="large"
                        href="#menu"
                        style={{
                            background: 'var(--primary)',
                            border: 'none',
                            height: 56,
                            padding: '0 40px',
                            borderRadius: 999,
                            fontSize: 18,
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        {t('landing.hero.menu_btn')}
                    </Button>

                    <Button
                        ghost
                        size="large"
                        href="#about"
                        style={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.3)',
                            height: 56,
                            padding: '0 40px',
                            borderRadius: 999,
                            fontSize: 18,
                            fontWeight: 'bold',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center'
                        }}
                    >
                        {t('landing.hero.about_btn')}
                    </Button>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite' }}>
                <ArrowDownOutlined style={{ color: 'white', fontSize: 32 }} />
            </div>

            <style jsx>{`
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);}
                    40% {transform: translateY(-10px) translateX(-50%);}
                    60% {transform: translateY(-5px) translateX(-50%);}
                }
            `}</style>
        </header>
    );
};

export default RestaurantLandingHero;
