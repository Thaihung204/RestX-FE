"use client";

import { useThemeMode } from "@/app/theme/AutoDarkThemeProvider";
import {
    BellOutlined,
    CheckOutlined,
    CloseOutlined,
    CreditCardOutlined,
    CustomerServiceOutlined,
} from "@ant-design/icons";
import { Badge, Button, Drawer, Tag, Typography } from "antd";
import { useState } from "react";

const { Text } = Typography;

interface Notification {
  id: string;
  table: string;
  type: "payment" | "support";
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", table: "Bàn A2", type: "payment", message: "Yêu cầu thanh toán", time: "1 phút trước", read: false },
  { id: "2", table: "Bàn B5", type: "support", message: "Cần hỗ trợ", time: "3 phút trước", read: false },
  { id: "3", table: "Bàn C1", type: "payment", message: "Yêu cầu thanh toán", time: "7 phút trước", read: false },
  { id: "4", table: "Bàn A4", type: "support", message: "Cần hỗ trợ", time: "12 phút trước", read: true },
  { id: "5", table: "Bàn D3", type: "payment", message: "Yêu cầu thanh toán", time: "20 phút trước", read: true },
  { id: "6", table: "Bàn B2", type: "support", message: "Cần hỗ trợ", time: "35 phút trước", read: true },
];

export default function StaffNotificationDrawer() {
  const { mode } = useThemeMode();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <Badge count={unreadCount} size="small" offset={[-4, 4]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18, color: "var(--text-muted)" }} />}
          onClick={() => setOpen(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        />
      </Badge>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="right"
        size="default"
        style={{ maxWidth: 360 }}
        styles={{
          header: { display: "none" },
          body: { padding: 0, background: "var(--card)" },
          wrapper: { boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" },
        }}
        style={{ background: "var(--card)" }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: "var(--card)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255, 56, 11, 0.1)",
                border: "1px solid rgba(255, 56, 11, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BellOutlined style={{ color: "var(--primary)", fontSize: 16 }} />
            </div>
            <div>
              <Text style={{ color: "var(--text)", fontWeight: 700, fontSize: 15, display: "block", lineHeight: 1.2 }}>
                Thông báo
              </Text>
              {unreadCount > 0 && (
                <Text style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {unreadCount} chưa đọc
                </Text>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                onClick={markAllRead}
                style={{ color: "var(--primary)", fontSize: 12, fontWeight: 600, padding: "0 8px" }}
              >
                Đọc tất cả
              </Button>
            )}
            <Button
              type="text"
              icon={<CloseOutlined style={{ fontSize: 13 }} />}
              onClick={() => setOpen(false)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ padding: "8px 0" }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <BellOutlined style={{ fontSize: 40, opacity: 0.3, display: "block", marginBottom: 12 }} />
              <Text style={{ color: "var(--text-muted)", fontSize: 14 }}>Không có thông báo</Text>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border)",
                  background: notif.read
                    ? "transparent"
                    : mode === "dark"
                    ? "rgba(255, 56, 11, 0.06)"
                    : "rgba(255, 56, 11, 0.04)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        notif.type === "payment"
                          ? "rgba(82, 196, 26, 0.12)"
                          : "rgba(250, 173, 20, 0.12)",
                      border:
                        notif.type === "payment"
                          ? "1px solid rgba(82, 196, 26, 0.25)"
                          : "1px solid rgba(250, 173, 20, 0.25)",
                    }}
                  >
                    {notif.type === "payment" ? (
                      <CreditCardOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                    ) : (
                      <CustomerServiceOutlined style={{ color: "#faad14", fontSize: 16 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <Text style={{ color: "var(--text)", fontWeight: 700, fontSize: 14 }}>
                        {notif.table}
                      </Text>
                      {!notif.read && (
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "var(--primary)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <Tag
                      color={notif.type === "payment" ? "success" : "warning"}
                      style={{ fontSize: 11, margin: "0 0 4px 0", borderRadius: 4 }}
                    >
                      {notif.message}
                    </Tag>
                    <Text style={{ color: "var(--text-muted)", fontSize: 11, display: "block" }}>
                      {notif.time}
                    </Text>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    {!notif.read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined style={{ fontSize: 11 }} />}
                        onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#52c41a",
                          border: "1px solid rgba(82,196,26,0.3)",
                        }}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ fontSize: 11 }} />}
                      onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Drawer>
    </>
  );
}
