"use client";

import { Col, Row, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";


const { Title } = Typography;

import { Category } from '@/lib/services/categoryService';

interface FeaturedCategoriesProps {
    categories: Category[];
}

const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({ categories = [] }) => {
    const { t } = useTranslation();

    const displayCategories = categories.length > 0 ? categories : [];

    return (
        <section id="featured" style={{ padding: "80px 24px", background: 'transparent' }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <Title
                    level={2}
                    style={{
                        color: 'var(--text)',
                        textAlign: "center",
                        marginBottom: 48,
                        fontSize: 36,
                        fontFamily: "serif",
                    }}
                >
                    {t("restaurant.categories.title")}
                </Title>
                <Row gutter={[24, 24]}>
                    {displayCategories.map((cat) => (
                        <Col xs={12} md={6} key={cat.id}>
                            <div
                                style={{
                                    position: "relative",
                                    borderRadius: 16,
                                    overflow: "hidden",
                                    aspectRatio: "1/1",
                                    cursor: "pointer",
                                }}
                            >
                                <img
                                    src={cat.imageUrl || '/images/logo/restx-removebg-preview.png'}
                                    alt={cat.name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transition: "transform 0.5s ease",
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/images/logo/restx-removebg-preview.png';
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: 16,
                                        background: "linear-gradient(0deg, rgba(14, 18, 26, 0.9) 0%, transparent 100%)",
                                    }}
                                >
                                    <h3 style={{ color: "white", margin: 0, textAlign: "center", fontSize: 18 }}>
                                        {cat.name}
                                    </h3>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
};

export default FeaturedCategories;

