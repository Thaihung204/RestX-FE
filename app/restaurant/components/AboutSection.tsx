'use client';

import React from 'react';
import { Typography, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { TenantConfig } from '@/lib/services/tenantService';

const { Title } = Typography;

interface AboutSectionProps {
  tenant: TenantConfig | null;
}

// Sub-component for Custom HTML Content
const AboutHtmlContent: React.FC<{ content?: string }> = ({ content }) => {
  if (!content) return null;

  const sanitizedContent = typeof window !== 'undefined'
    ? DOMPurify.sanitize(content)
    : content; // On server render, we might pass raw or empty, but hydration will fix it on client.

  return (
    <section id="about" style={{ padding: '96px 24px', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <div
        style={{ maxWidth: 1280, margin: '0 auto' }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content)
        }}
      />
    </section>
  );
};

// Sub-component for Default Layout
const AboutDefaultContent: React.FC<{ tenant: TenantConfig | null }> = ({ tenant }) => {
  const { t } = useTranslation();
  return (
    <section id="about" style={{ padding: '96px 24px', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Row gutter={[64, 64]} align="middle">

          {/* Images Grid */}
          <Col xs={24} lg={12}>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <img
                    className="rounded-2xl shadow-lg transform hover:-translate-y-2 transition duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5oI6cs6P9hYcrYSrSyZzhkLv8P5IHTU2BvCSP5L2HdnS0fQF-hRucMNxdk8QWM8nZTvwWaFmAqGF7Ijz-DlqkQ34Z9zwaUWl2v5bfSrWwKpCRbPhhj8dDVAML92SIRRCJcv3SJIvHxEpzGTTaBQ5BNqcVFoEJIDa_L3LOS_VPngWUc9cteDcjaWRSLV5iFgahlK53uRdi3RraoFqIUf71dkVKUAkY-mo0NPnbYXLtqwpjObGMLD5feOHdAwkvvvwyhNX6kNyjwHg"
                    alt="Culinary art"
                    style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <img
                    className="rounded-2xl shadow-lg transform hover:translate-y-2 transition duration-700 delay-100"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUgtvL34j-tQeN9ykBVh3odZ290AAwF51ceeSqGBH7C7jizqQux0u63iFlXzfTL8rj6LclmkHKP4ozUEqA3dfTpoyzh8Eld-toqKsQOqf78cTQ3-J7_qDL7uqT_v9qlYOGkyBVX1cqd7eTwD2SGq9S9Zed1_ZhjKTrVLg6G-2Ja7XBxYGMYuEK-RtHuEwvxhI4ZyBE3qmWEAH4iqPnKJHkf7-goTIb6qwAyiYNOQlFc_ppYQK2WtoVioko2zYmKSyBb6vUIC-ud3g"
                    alt="Fresh ingredients"
                    style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                </div>
                <div style={{ paddingTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <img
                    className="rounded-2xl shadow-lg transform hover:-translate-y-2 transition duration-700 delay-200"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDA5VEduqItkZ4uDToDbffAseTAsQNiqFIkJawN55U2mGDEcWfcjErKxKhftk1KE04jyMYkiTIjPF2UdwTAfj8bWgWgP2tT0GnE-XQwMWYIkrno2iG_yP1ArkHkOCwdSuOqIkMcFoLgHMgiLxaM3MhN59Bk21AOYEc6baIRBVacdGrebKN1iv7TEo69F8T9nFqkmHFoscRWLJMi8qBZKYvtlJ_LqpnD-7N8ya0d_l0qKyOY5iJSqdYa2EkMOx_TaJoifZlzj51GYI"
                    alt="Plated dish"
                    style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <img
                    className="rounded-2xl shadow-lg transform hover:translate-y-2 transition duration-700 delay-300"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnPei-PdDRNOnmrQmKTOWpT6cYAC2LQV0hMuKIzUUX9aAmcZtso3AQ331_Mp5xQO-esSwY0YlEBi3B-GYycXFE2iZORT7onuQxxML8PHGflGKuBNjE2ud1GndP6lsssf2T6UhyBwcUMaP5V3N1WaxnKnZ63txMhnadBikRdAuNdZvCr_WNQ7820AJ82pIHngvoJXE1t-kiPbZF_pjLd55htXFCswwNPko5mpxTxCSjwVt1xcY435fWvCxjbipg0jK2b_QUV4uvN3g"
                    alt="Chef at work"
                    style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                </div>
              </div>
              {/* Decorative element */}
              <div style={{
                position: 'absolute',
                top: -40,
                left: -40,
                width: 160,
                height: 160,
                borderLeft: '2px solid rgba(192, 86, 33, 0.3)',
                borderTop: '2px solid rgba(192, 86, 33, 0.3)',
                zIndex: 0,
                borderTopLeftRadius: 24
              }}></div>
            </div>
          </Col>

          {/* Text Content */}
          <Col xs={24} lg={12}>
            <span style={{
              color: 'var(--primary)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontSize: 14,
              display: 'block',
              marginBottom: 16
            }}>
              {t('landing.about.subtitle')}
            </span>

            <Title level={2} style={{
              fontFamily: 'var(--font-display), serif',
              fontSize: 'clamp(2.25rem, 4vw, 3rem)',
              marginBottom: 32,
              lineHeight: 1.2
            }}>
              {t('landing.about.title')}
            </Title>

            <div style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p>
                {tenant?.aboutUs || t('landing.about.default_description')}
              </p>
              <p>
                {t('landing.about.secondary_description')}
              </p>
            </div>

            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 24 }}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnFX8rZGZQXBiC0Qbi6skwOd0JcuyAWl0uwKxJ9B_PSQndKJRGr8bCKhGbG7MK9nF2l2HCW0Hibp8DBXT9gAUcCpJdkkNH8trxsC9x5dh0Q1hr0o_ofxcCum5gFgLtNihXv11jZ6GlZdcGwFmmNV8gsCGi9rVhP45IXUQQDokYFYXmtLZV3Ak4uSYQfi4YfXRUBMPoOsEPx4LUuIpyz4_IkX0_uerpIFUr7sDhiMauaRkX1-W5WUteLeRq0Iz-uQh7Mg-GAkWA2eY"
                alt="Signature"
                style={{ height: 64, opacity: 0.6, filter: 'var(--signature-filter, none)' }}
              />
              <div>
                <p style={{ fontFamily: 'var(--font-display), serif', fontSize: 20, fontWeight: 'bold', margin: 0 }}>Lê Quang</p>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{t('landing.about.chef')}</p>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Dark mode signature filter support */}
      <style jsx global>{`
        [data-theme='dark'] {
            --signature-filter: invert(1);
        }
      `}</style>
    </section>
  );
};

// Main Component
const AboutSection: React.FC<AboutSectionProps> = ({ tenant }) => {
  const { t } = useTranslation();

  // Switch logic based on aboutUsType
  if (tenant?.aboutUsType === 'html') {
    return <AboutHtmlContent content={tenant.aboutUs} />;
  }

  return <AboutDefaultContent tenant={tenant} />;
};

export default AboutSection;
