"use client";

import {
  AppstoreOutlined,
  EditOutlined,
  ExperimentOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

const P = "#6366F1";
const PL = "rgba(99,102,241,0.12)";
const PB = "rgba(99,102,241,0.25)";

/* ── Spotlight card ─────────────────────────────────────────────── */
function SpotlightCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, show: false });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, show: false }))}
      style={{ position: "relative", overflow: "hidden", ...style }}>
      {pos.show && (
        <div
          style={{
            position: "absolute",
            left: pos.x - 120,
            top: pos.y - 120,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
            transition: "opacity 0.2s",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* ── Animated number counter ────────────────────────────────────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    let start = 0;
    const duration = 1400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * to);
      if (ref.current) ref.current.textContent = `${start}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ── Feature card — ảnh trên, text dưới ────────────────────────── */
interface FeatureCardProps {
  tag: string;
  title: React.ReactNode;
  desc: string;
  bullets: { icon: React.ReactNode; text: string }[];
  img: string;
  imgAlt: string;
  reverse?: boolean;
  inView: boolean;
  delay?: number;
  bg?: string;
}

function FeatureCard({
  tag,
  title,
  desc,
  bullets,
  img,
  imgAlt,
  inView: _inView,
  delay = 0,
  bg,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.4, 0.25, 1] }}
      style={{
        borderRadius: 28,
        overflow: "hidden",
        border: `1.5px solid ${PB}`,
        background: bg ?? "var(--card)",
        boxShadow: "0 8px 48px rgba(99,102,241,0.09)",
      }}>
      {/* ── Image block ── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "var(--bg-base)",
        }}>
        <motion.img
          src={img}
          alt={imgAlt}
          initial={{ scale: 1.05, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{
            duration: 0.9,
            delay: delay + 0.15,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            background: `linear-gradient(to bottom, transparent, ${bg ?? "var(--card)"})`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Text block ── */}
      <SpotlightCard style={{ padding: "36px 40px 40px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{ duration: 0.55, delay: delay + 0.25 }}
          style={{ marginBottom: 28 }}>
          <span
            style={{
              display: "inline-block",
              background: PL,
              border: `1px solid ${PB}`,
              color: P,
              borderRadius: 20,
              padding: "4px 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}>
            {tag}
          </span>
          <Title
            level={3}
            style={{
              margin: "0 0 12px",
              color: "var(--text)",
              fontSize: "clamp(20px, 2.5vw, 26px)",
              fontWeight: 800,
              lineHeight: 1.25,
            }}>
            {title}
          </Title>
          <Paragraph
            style={{
              color: "var(--text-muted)",
              fontSize: 15,
              lineHeight: 1.8,
              margin: 0,
            }}>
            {desc}
          </Paragraph>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.1, delayChildren: delay + 0.4 },
            },
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}>
          {bullets.map((b, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 14,
                background: PL,
                border: `1px solid ${PB}`,
              }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  flexShrink: 0,
                  background: "var(--card)",
                  border: `1px solid ${PB}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: P,
                  fontSize: 14,
                  marginTop: 1,
                }}>
                {b.icon}
              </span>
              <Text
                style={{
                  color: "var(--text)",
                  fontSize: 13,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}>
                {b.text}
              </Text>
            </motion.div>
          ))}
        </motion.div>
      </SpotlightCard>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function MenuTourPage() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const card0Ref = useRef(null);
  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const heroIn = useInView(heroRef, { once: true, amount: 0.3 });
  const card0In = useInView(card0Ref, { once: true, amount: 0.25 });
  const card1In = useInView(card1Ref, { once: true, amount: 0.25 });
  const card2In = useInView(card2Ref, { once: true, amount: 0.25 });
  const cardInViews = [card0In, card1In, card2In];
  const cardRefs = [card0Ref, card1Ref, card2Ref];

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const features = [
    {
      tag: t("tour.menu.features.step_1.tag"),
      title: (
        <>
          <span style={{ color: P }}>
            {t("tour.menu.features.step_1.title_highlight")}
          </span>{" "}
          {t("tour.menu.features.step_1.title_suffix")}
        </>
      ),
      desc: t("tour.menu.features.step_1.description"),
      bullets: [
        {
          icon: <AppstoreOutlined />,
          text: t("tour.menu.features.step_1.bullets.create_category"),
        },
        {
          icon: <PlusCircleOutlined />,
          text: t("tour.menu.features.step_1.bullets.add_dish"),
        },
        {
          icon: <EditOutlined />,
          text: t("tour.menu.features.step_1.bullets.reorder_display"),
        },
      ],
      img: "/images/example/category.png",
      imgAlt: t("tour.menu.features.step_1.image_alt"),
      bg: "var(--card)",
    },
    {
      tag: t("tour.menu.features.step_2.tag"),
      title: (
        <>
          {t("tour.menu.features.step_2.title_prefix")}{" "}
          <span style={{ color: P }}>
            {t("tour.menu.features.step_2.title_highlight")}
          </span>{" "}
          {t("tour.menu.features.step_2.title_suffix")}
        </>
      ),
      desc: t("tour.menu.features.step_2.description"),
      bullets: [
        {
          icon: <EditOutlined />,
          text: t("tour.menu.features.step_2.bullets.edit_info"),
        },
        {
          icon: <AppstoreOutlined />,
          text: t("tour.menu.features.step_2.bullets.attach_multi_category"),
        },
        {
          icon: <MinusCircleOutlined />,
          text: t("tour.menu.features.step_2.bullets.toggle_visibility"),
        },
      ],
      img: "/images/example/dish.png",
      imgAlt: t("tour.menu.features.step_2.image_alt"),
      bg: "var(--bg-base)",
    },
    {
      tag: t("tour.menu.features.step_3.tag"),
      title: (
        <>
          {t("tour.menu.features.step_3.title_prefix")}{" "}
          <span style={{ color: P }}>
            {t("tour.menu.features.step_3.title_highlight")}
          </span>{" "}
          {t("tour.menu.features.step_3.title_suffix")}
        </>
      ),
      desc: t("tour.menu.features.step_3.description"),
      bullets: [
        {
          icon: <ExperimentOutlined />,
          text: t("tour.menu.features.step_3.bullets.bind_ingredients"),
        },
        {
          icon: <WarningOutlined />,
          text: t("tour.menu.features.step_3.bullets.low_stock_alert"),
        },
        {
          icon: <MinusCircleOutlined />,
          text: t("tour.menu.features.step_3.bullets.auto_hide_out_of_stock"),
        },
      ],
      img: "/images/example/ingredient.png",
      imgAlt: t("tour.menu.features.step_3.image_alt"),
      bg: "var(--card)",
    },
  ];

  return (
    <div style={{ overflow: "hidden" }}>
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        style={{
          padding: "120px 24px 80px",
          background: "var(--bg-base)",
          position: "relative",
          overflow: "hidden",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
        }}>
        {/* Animated bg orbs */}
        {[
          { w: 600, h: 600, top: -200, left: -200, delay: 0 },
          { w: 400, h: 400, top: 100, right: -100, delay: 1.5 },
          { w: 300, h: 300, bottom: -100, left: "40%", delay: 3 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              delay: orb.delay,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              width: orb.w,
              height: orb.h,
              top: (orb as any).top,
              left: (orb as any).left,
              right: (orb as any).right,
              bottom: (orb as any).bottom,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        ))}

        <motion.div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
            y: heroY,
            opacity: heroOpacity,
            position: "relative",
            zIndex: 1,
          }}>
          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroIn ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(24px, 5vw, 64px)",
              flexWrap: "wrap",
            }}>
            {[
              {
                value: 3,
                suffix: t("tour.menu.stats.setup_suffix"),
                label: t("tour.menu.stats.setup_label"),
              },
              {
                value: 100,
                suffix: "+",
                label: t("tour.menu.stats.menu_items_label"),
              },
              {
                value: 0,
                suffix: t("tour.menu.stats.reload_suffix"),
                label: t("tour.menu.stats.realtime_label"),
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                style={{
                  textAlign: "center",
                  padding: "20px 28px",
                  borderRadius: 20,
                  background: "var(--card)",
                  border: `1.5px solid ${PB}`,
                  boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
                  minWidth: 120,
                }}>
                <div
                  style={{
                    fontSize: "clamp(24px, 3vw, 36px)",
                    fontWeight: 900,
                    color: P,
                    lineHeight: 1,
                  }}>
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </div>
                <Text
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 500,
                    marginTop: 6,
                    display: "block",
                  }}>
                  {stat.label}
                </Text>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Feature cards ── */}
      <section
        style={{ padding: "40px 24px 100px", background: "var(--bg-base)" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}>
          {features.map((f, i) => (
            <div key={i} ref={cardRefs[i]}>
              <FeatureCard {...f} inView={cardInViews[i]} delay={0} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
