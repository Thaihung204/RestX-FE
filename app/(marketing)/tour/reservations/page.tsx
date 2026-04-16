"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

const COLOR = "#F59E0B";
const CL = "rgba(245,158,11,0.1)";
const CB = "rgba(245,158,11,0.25)";

/*Step data*/
const getSteps = (t: (key: string) => string) => [
  {
    id: 1,
    label: t("tour.reservations.steps.step_1.label"),
    title: t("tour.reservations.steps.step_1.title"),
    summary: t("tour.reservations.steps.step_1.summary"),
    icon: <CalendarOutlined style={{ fontSize: 22 }} />,
    script: [
      {
        icon: <ClockCircleOutlined />,
        heading: t("tour.reservations.steps.step_1.script.select_time.heading"),
        body: t("tour.reservations.steps.step_1.script.select_time.body"),
      },
      {
        icon: <EnvironmentOutlined />,
        heading: t(
          "tour.reservations.steps.step_1.script.select_table.heading",
        ),
        body: t("tour.reservations.steps.step_1.script.select_table.body"),
      },
      {
        icon: <EyeOutlined />,
        heading: t("tour.reservations.steps.step_1.script.view_360.heading"),
        body: t("tour.reservations.steps.step_1.script.view_360.body"),
      },
      {
        icon: <CheckCircleOutlined />,
        heading: t("tour.reservations.steps.step_1.script.confirm.heading"),
        body: t("tour.reservations.steps.step_1.script.confirm.body"),
      },
    ],
  },
  {
    id: 2,
    label: t("tour.reservations.steps.step_2.label"),
    title: t("tour.reservations.steps.step_2.title"),
    summary: t("tour.reservations.steps.step_2.summary"),
    icon: <CheckCircleOutlined style={{ fontSize: 22 }} />,
    script: [
      {
        icon: <CalendarOutlined />,
        heading: t(
          "tour.reservations.steps.step_2.script.receive_request.heading",
        ),
        body: t("tour.reservations.steps.step_2.script.receive_request.body"),
      },
      {
        icon: <CheckCircleOutlined />,
        heading: t(
          "tour.reservations.steps.step_2.script.confirm_or_adjust.heading",
        ),
        body: t("tour.reservations.steps.step_2.script.confirm_or_adjust.body"),
      },
      {
        icon: <TeamOutlined />,
        heading: t(
          "tour.reservations.steps.step_2.script.assign_staff.heading",
        ),
        body: t("tour.reservations.steps.step_2.script.assign_staff.body"),
      },
    ],
  },
  {
    id: 3,
    label: t("tour.reservations.steps.step_3.label"),
    title: t("tour.reservations.steps.step_3.title"),
    summary: t("tour.reservations.steps.step_3.summary"),
    icon: <UserOutlined style={{ fontSize: 22 }} />,
    script: [
      {
        icon: <UserOutlined />,
        heading: t("tour.reservations.steps.step_3.script.checkin.heading"),
        body: t("tour.reservations.steps.step_3.script.checkin.body"),
      },
      {
        icon: <EnvironmentOutlined />,
        heading: t(
          "tour.reservations.steps.step_3.script.guide_to_table.heading",
        ),
        body: t("tour.reservations.steps.step_3.script.guide_to_table.body"),
      },
      {
        icon: <CompassOutlined />,
        heading: t(
          "tour.reservations.steps.step_3.script.update_table_status.heading",
        ),
        body: t(
          "tour.reservations.steps.step_3.script.update_table_status.body",
        ),
      },
    ],
  },
];

/*Script item*/
function ScriptItem({
  icon,
  heading,
  body,
  index,
}: {
  icon: React.ReactNode;
  heading: string;
  body: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 14,
        background: "var(--bg-base)",
        border: "1px solid var(--border)",
      }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          background: CL,
          border: `1px solid ${CB}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLOR,
          fontSize: 15,
          marginTop: 2,
        }}>
        {icon}
      </div>
      <div>
        <Text
          style={{
            fontWeight: 700,
            color: "var(--text)",
            fontSize: 14,
            display: "block",
            marginBottom: 4,
          }}>
          {heading}
        </Text>
        <Text
          style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7 }}>
          {body}
        </Text>
      </div>
    </motion.div>
  );
}

/*Step block*/
function StepBlock({
  step,
  isOpen,
  onClick,
  stepIndex,
}: {
  step: ReturnType<typeof getSteps>[0];
  isOpen: boolean;
  onClick: () => void;
  stepIndex: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.6,
        delay: stepIndex * 0.05,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      style={{ width: "100%", maxWidth: 900 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isOpen ? "200px 1fr" : "1fr",
          gap: 0,
          borderRadius: 20,
          overflow: "hidden",
          border: `1.5px solid ${isOpen ? CB : "var(--border)"}`,
          boxShadow: isOpen
            ? `0 8px 40px rgba(245,158,11,0.12)`
            : "0 2px 12px rgba(0,0,0,0.06)",
          transition: "border-color 0.3s, box-shadow 0.3s",
          background: "var(--card)",
        }}>
        {/* ── Left: step trigger ── */}
        <motion.button
          onClick={onClick}
          whileHover={{ background: isOpen ? CL : "rgba(245,158,11,0.05)" }}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: isOpen ? "28px 24px" : "24px 32px",
            display: "flex",
            flexDirection: isOpen ? "column" : "row",
            alignItems: isOpen ? "flex-start" : "center",
            gap: isOpen ? 12 : 16,
            background: isOpen ? CL : "var(--card)",
            borderRight: isOpen ? `1.5px solid ${CB}` : "none",
            transition: "background 0.25s",
            width: "100%",
          }}>
          {/* Step number badge */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
              background: isOpen ? COLOR : "var(--bg-base)",
              border: `1.5px solid ${isOpen ? COLOR : "var(--border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isOpen ? "white" : COLOR,
              transition: "all 0.3s",
            }}>
            {step.icon}
          </div>

          <div style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: isOpen ? COLOR : "var(--text-muted)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 4,
              }}>
              {step.label}
            </Text>
            <Text
              style={{
                fontSize: isOpen ? 15 : 16,
                fontWeight: 700,
                color: "var(--text)",
                display: "block",
                lineHeight: 1.3,
              }}>
              {step.title}
            </Text>
            {!isOpen && (
              <Text
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 4,
                  display: "block",
                }}>
                {step.summary}
              </Text>
            )}
          </div>

          {/* Chevron — only when collapsed */}
          {!isOpen && (
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut",
              }}
              style={{ color: COLOR, fontSize: 18, flexShrink: 0 }}>
              ›
            </motion.div>
          )}
        </motion.button>

        {/* ── Right: script content ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="script"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}>
                {step.script.map((s, i) => (
                  <ScriptItem key={i} {...s} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/*Page*/
export default function ReservationsTourPage() {
  const { t } = useTranslation();
  const steps = getSteps(t);
  const [openSteps, setOpenSteps] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = (id: number) => {
    setOpenSteps((prev) => {
      if (prev.includes(id)) {
        // collapse this and all after
        return prev.filter((s) => s < id);
      }
      // open up to this step (reveal sequentially)
      const next = [];
      for (let i = 1; i <= id; i++) next.push(i);
      return next;
    });
  };

  // Which steps are visible: step N visible only if step N-1 is open (or N===1)
  const visibleSteps = steps.filter(
    (s) => s.id === 1 || openSteps.includes(s.id - 1),
  );

  return (
    <div style={{ overflow: "hidden" }}>
      <section
        style={{
          padding: "120px 24px 100px",
          background: "var(--bg-base)",
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
        }}>
        {/* bg orbs */}
        {[
          { w: 500, top: -150, left: -150 },
          { w: 350, bottom: -100, right: -100 },
        ].map((o, i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 7 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              width: o.w,
              height: o.w,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
              top: (o as any).top,
              left: (o as any).left,
              bottom: (o as any).bottom,
              right: (o as any).right,
              pointerEvents: "none",
            }}
          />
        ))}

        <div
          ref={containerRef}
          style={{
            maxWidth: 900,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: 56 }}>
            <Title
              level={1}
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 900,
                margin: "0 0 16px",
                color: "var(--text)",
                lineHeight: 1.1,
              }}>
              {t("tour.reservations.header.title_prefix")}{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FCD34D 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                {t("tour.reservations.header.highlight")}
              </span>
            </Title>
            <Paragraph
              style={{
                fontSize: 16,
                color: "var(--text-muted)",
                margin: 0,
                maxWidth: 480,
                marginInline: "auto",
              }}>
              {t("tour.reservations.header.description")}
            </Paragraph>
          </motion.div>

          {/* Steps */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}>
            {visibleSteps.map((step, idx) => (
              <AnimatePresence key={step.id}>
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                  style={{ width: "100%" }}>
                  {/* Connector line */}
                  {idx > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 24, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        width: 2,
                        background: `linear-gradient(to bottom, ${CB}, transparent)`,
                        margin: "-8px auto 0",
                        marginBottom: 8,
                      }}
                    />
                  )}
                  <StepBlock
                    step={step}
                    isOpen={openSteps.includes(step.id)}
                    onClick={() => toggle(step.id)}
                    stepIndex={idx}
                  />
                </motion.div>
              </AnimatePresence>
            ))}
          </div>

          {/* Done state */}
          <AnimatePresence>
            {openSteps.length === steps.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ textAlign: "center", marginTop: 40 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    borderRadius: 40,
                    padding: "10px 24px",
                  }}>
                  <CheckCircleOutlined
                    style={{ color: "#10B981", fontSize: 18 }}
                  />
                  <Text
                    style={{ color: "#10B981", fontWeight: 700, fontSize: 14 }}>
                    {t("tour.reservations.done_message")}
                  </Text>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
