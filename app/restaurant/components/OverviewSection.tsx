'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import RichTextRenderer from '@/app/components/RichTextRenderer';
import { Typography } from 'antd';

const { Title } = Typography;

export interface OverviewSectionProps {
    overview?: string;
}

/**
 * OverviewSection
 * 
 * Displays the hotel/restaurant overview using secure rich text rendering.
 * Designed to be clean, centered, and responsive.
 */
const OverviewSection: React.FC<OverviewSectionProps> = ({ overview }) => {
    const { t } = useTranslation();
    // If no content, don't render the section at all
    if (!overview) {
        return null;
    }

    return (
        <section id="overview" style={{ padding: '80px 24px', background: 'var(--bg-base)' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <span style={{
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        fontSize: 14
                    }}>
                        {t('landing.overview.subtitle')}
                    </span>
                    <Title level={2} style={{
                        fontFamily: 'var(--font-display), serif',
                        marginTop: 12,
                        fontSize: 'clamp(2rem, 4vw, 2.5rem)'
                    }}>
                        {t('landing.overview.title')}
                    </Title>
                </div>

                <div style={{
                    fontSize: '1.125rem',
                    lineHeight: 1.8,
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                }}>
                    <RichTextRenderer content={overview} />
                </div>
            </div>
        </section>
    );
};

export default OverviewSection;
