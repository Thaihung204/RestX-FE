"use client";

import { Col, Row, Typography } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";


const { Title } = Typography;

const FeaturedCategories: React.FC = () => {
    const { t } = useTranslation();


    const categories = [
        {
            key: "appetizer",
            image: "/images/restaurant/cat-1.jpg",
            title: t("restaurant.categories.appetizer"),
        },
        {
            key: "main",
            image: "/images/restaurant/cat-2.jpg",
            title: t("restaurant.categories.main"),
        },
        {
            key: "dessert",
            image: "/images/restaurant/cat-3.jpg",
            title: t("restaurant.categories.dessert"),
        },
        {
            key: "drinks",
            image: "/images/restaurant/cat-4.jpg",
            title: t("restaurant.categories.drinks"),
        },
    ];

    return (
        <section style={{ padding: "80px 24px", background: 'transparent' }}>
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
                    {categories.map((cat) => (
                        <Col xs={12} md={6} key={cat.key}>
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
                                    src={cat.image}
                                    alt={cat.title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transition: "transform 0.5s ease",
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
                                        {cat.title}
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

