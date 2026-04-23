"use client";

import { useThemeMode } from "@/app/theme/AutoDarkThemeProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import notificationService, {
  NotificationItem,
} from "@/lib/services/notificationService";
import {
  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { HubConnectionState } from "@microsoft/signalr";
import { Badge, Button, Drawer, Tag, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import notificationSignalRService from "../../lib/services/notificationSignalRService";

const { Text } = Typography;

interface UINotification {
  id: string;
  table: string;
  type: "payment" | "support";
  title: string;
  time: string;
  read: boolean;
}

interface RealtimeNotificationEnvelope {
  id?: string;
  notification?: NotificationItem | null;
}

let myNotificationsPromise: Promise<NotificationItem[]> | null = null;

function getMyNotifications(forceRefresh = false): Promise<NotificationItem[]> {
  if (forceRefresh || !myNotificationsPromise) {
    myNotificationsPromise = notificationService.getMyNotifications();
  }
  return myNotificationsPromise;
}

function formatRelativeTime(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const timestamp = new Date(dateStr).getTime();
  if (Number.isNaN(timestamp)) return t("notifications.just_now");

  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diff < 60) return t("notifications.seconds_ago", { count: diff, defaultValue: `${diff}s` });
  if (diff < 3600) return t("notifications.minutes_ago", { count: Math.floor(diff / 60), defaultValue: `${Math.floor(diff / 60)}m` });
  if (diff < 86400) return t("notifications.hours_ago", { count: Math.floor(diff / 3600), defaultValue: `${Math.floor(diff / 3600)}h` });
  return t("notifications.days_ago", { count: Math.floor(diff / 86400), defaultValue: `${Math.floor(diff / 86400)}d` });
}

function mapNotification(n: NotificationItem, t: (key: string, opts?: Record<string, unknown>) => string): UINotification {
  const isPayment = n.notificationType?.toUpperCase() === "PAYMENT";
  const tableCode = n.message?.trim();
  const safeTitle = n.title?.trim() || t("notifications.title");

  return {
    id: n.id,
    table: tableCode ? t("notifications.table_prefix", { code: tableCode }) : t("notifications.table_unknown"),
    type: isPayment ? "payment" : "support",
    title: safeTitle,
    time: n.createdDate ? formatRelativeTime(n.createdDate, t) : t("notifications.just_now"),
    read: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractNotificationFromPayload(
  payload: unknown,
): NotificationItem | null {
  if (!isRecord(payload)) return null;

  const envelope = payload as RealtimeNotificationEnvelope;

  if (isRecord(envelope.notification)) {
    const notification = envelope.notification as NotificationItem;
    if (typeof notification.id === "string") {
      return notification;
    }
  }

  const directId = payload.id;
  const directTitle = payload.title;
  if (typeof directId === "string" && typeof directTitle === "string") {
    return payload as unknown as NotificationItem;
  }

  return null;
}

function extractNotificationId(payload: unknown): string | null {
  if (typeof payload === "string") return payload;
  if (!isRecord(payload)) return null;
  return typeof payload.id === "string" ? payload.id : null;
}

export default function StaffNotificationDrawer() {
  const { t } = useTranslation();
  const { mode } = useThemeMode();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loading, setLoading] = useState(false);
  const readIdsRef = useRef<Set<string>>(new Set());
  const joinedUserGroupIdsRef = useRef<Set<string>>(new Set());

  const collectCandidateUserGroupIds = (items?: NotificationItem[]) => {
    const result = new Set<string>();

    const addCandidate = (value: unknown) => {
      if (typeof value !== "string") return;
      const normalized = value.trim();
      if (!normalized) return;
      result.add(normalized);
    };

    addCandidate(user?.id);

    const userRecord = user as Record<string, unknown> | null;
    if (userRecord) {
      addCandidate(userRecord.memberId);
      addCandidate(userRecord.memberID);
      addCandidate(userRecord.employeeId);
      addCandidate(userRecord.staffId);
      addCandidate(userRecord.customerId);
      addCandidate(userRecord.userId);
    }

    items?.forEach((item) => addCandidate(item.recipientId));

    return Array.from(result);
  };

  const ensureTenantUserGroups = async (items?: NotificationItem[]) => {
    if (!tenantId) return;

    const candidateIds = collectCandidateUserGroupIds(items);
    await Promise.all(
      candidateIds.map(async (candidateId) => {
        if (joinedUserGroupIdsRef.current.has(candidateId)) return;

        try {
          await notificationSignalRService.joinTenantUserGroup(
            tenantId,
            candidateId,
          );
          joinedUserGroupIdsRef.current.add(candidateId);
        } catch {
          // silent
        }
      }),
    );
  };

  const syncNotifications = (data: NotificationItem[]) => {
    setNotifications(
      data.map((n) => ({
        ...mapNotification(n, t),
        read: readIdsRef.current.has(n.id),
      })),
    );
  };

  const refreshNotifications = async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications(true);
      syncNotifications(data);
      await ensureTenantUserGroups(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const upsertNotification = (
    incoming: NotificationItem,
    options?: { prependWhenNew?: boolean },
  ) => {
    const mapped = mapNotification(incoming, t);
    const prependWhenNew = options?.prependWhenNew ?? true;

    setNotifications((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === mapped.id);

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...mapped,
          read: prev[existingIndex].read || readIdsRef.current.has(mapped.id),
        };
        return next;
      }

      const nextItem = {
        ...mapped,
        read: readIdsRef.current.has(mapped.id),
      };

      return prependWhenNew ? [nextItem, ...prev] : [...prev, nextItem];
    });
  };

  // Initial fetch
  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await getMyNotifications();
        if (!mounted) return;
        syncNotifications(data);
        await ensureTenantUserGroups(data);
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  // SignalR real-time notifications
  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;

    const handleNotificationCreated = (payload: unknown) => {
      if (!isMounted) return;

      const notification = extractNotificationFromPayload(payload);
      if (!notification) return;

      ensureTenantUserGroups([notification]).catch(() => {});

      upsertNotification(notification, { prependWhenNew: true });
    };

    const handleNotificationUpdated = (payload: unknown) => {
      if (!isMounted) return;

      const notification = extractNotificationFromPayload(payload);
      if (!notification) return;

      ensureTenantUserGroups([notification]).catch(() => {});

      upsertNotification(notification, { prependWhenNew: false });
    };

    const handleNotificationDeleted = (payload: unknown) => {
      if (!isMounted) return;

      const notificationId = extractNotificationId(payload);
      if (!notificationId) return;

      readIdsRef.current.add(notificationId);
      setNotifications((prev) =>
        prev.filter((item) => item.id !== notificationId),
      );
    };

    const setupSignalR = async () => {
      try {
        await notificationSignalRService.start();
        if (!isMounted) return;

        const conn = notificationSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await notificationSignalRService.joinTenantGroup(tenantId);
          await ensureTenantUserGroups();
          if (!isMounted) return;

          notificationSignalRService.on<unknown>(
            "notifications.created",
            handleNotificationCreated,
          );
          notificationSignalRService.on<unknown>(
            "notifications.personal.created",
            handleNotificationCreated,
          );
          notificationSignalRService.on<unknown>(
            "notifications.updated",
            handleNotificationUpdated,
          );
          notificationSignalRService.on<unknown>(
            "notifications.deleted",
            handleNotificationDeleted,
          );
        }
      } catch (error) {
        console.error("SignalR notifications: setup failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      notificationSignalRService.off<unknown>(
        "notifications.created",
        handleNotificationCreated,
      );
      notificationSignalRService.off<unknown>(
        "notifications.personal.created",
        handleNotificationCreated,
      );
      notificationSignalRService.off<unknown>(
        "notifications.updated",
        handleNotificationUpdated,
      );
      notificationSignalRService.off<unknown>(
        "notifications.deleted",
        handleNotificationDeleted,
      );

      notificationSignalRService.leaveTenantGroup(tenantId).catch(() => {});
      const joinedUserIds = Array.from(joinedUserGroupIdsRef.current);
      joinedUserGroupIdsRef.current.clear();

      joinedUserIds.forEach((joinedUserId) => {
        notificationSignalRService
          .leaveTenantUserGroup(tenantId, joinedUserId)
          .catch(() => {});
      });
    };
  }, [tenantId, user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    notifications.forEach((n) => readIdsRef.current.add(n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    readIdsRef.current.add(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const dismiss = (id: string) => {
    readIdsRef.current.add(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <>
      <Badge count={unreadCount} size="small" offset={[-4, 4]}>
        <Button
          type="text"
          icon={
            <BellOutlined
              style={{ fontSize: 18, color: "var(--text-muted)" }}
            />
          }
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
        width={360}
        style={{ background: "var(--card)" }}
        styles={{
          header: { display: "none" },
          body: { padding: 0, background: "var(--card)" },
          wrapper: { boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" },
        }}>
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
          }}>
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
              }}>
              <BellOutlined style={{ color: "var(--primary)", fontSize: 16 }} />
            </div>
            <div>
              <Text
                style={{
                  color: "var(--text)",
                  fontWeight: 700,
                  fontSize: 15,
                  display: "block",
                  lineHeight: 1.2,
                }}>
                {t("notifications.title")}
              </Text>
              {unreadCount > 0 && (
                <Text style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {t("notifications.unread_count", { count: unreadCount })}
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
                style={{
                  color: "var(--primary)",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "0 8px",
                }}>
                {t("notifications.mark_all_read")}
              </Button>
            )}
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined style={{ fontSize: 13 }} spin={loading} />}
              onClick={refreshNotifications}
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
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-muted)",
              }}>
              <BellOutlined
                style={{
                  fontSize: 40,
                  opacity: 0.3,
                  display: "block",
                  marginBottom: 12,
                }}
              />
              <Text style={{ color: "var(--text-muted)", fontSize: 14 }}>
                {t("notifications.empty")}
              </Text>
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
                }}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}>
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
                    }}>
                    {notif.type === "payment" ? (
                      <CreditCardOutlined
                        style={{ color: "#52c41a", fontSize: 16 }}
                      />
                    ) : (
                      <CustomerServiceOutlined
                        style={{ color: "#faad14", fontSize: 16 }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}>
                      <Text
                        style={{
                          color: "var(--text)",
                          fontWeight: 700,
                          fontSize: 14,
                        }}>
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
                      style={{
                        fontSize: 11,
                        margin: "0 0 4px 0",
                        borderRadius: 4,
                      }}>
                      {notif.title}
                    </Tag>
                    <Text
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 11,
                        display: "block",
                      }}>
                      {notif.time}
                    </Text>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      flexShrink: 0,
                    }}>
                    {!notif.read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined style={{ fontSize: 11 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(notif.id);
                        }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(notif.id);
                      }}
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
