"use client";

import { TableData } from "@/app/admin/tables/components/DraggableTable";
import { Layout, TableMap2D } from "@/app/admin/tables/components/TableMap2D";
import TablePreview3DModal from "@/app/restaurant/components/TablePreview3DModal";
import MenuPreOrder, {
  PreOrderSelectionItem,
} from "@/components/customer/MenuPreOrder";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTenant } from "@/lib/contexts/TenantContext";
import customerService from "@/lib/services/customerService";
import dishService, {
  MenuCategory,
  MenuItem,
} from "@/lib/services/dishService";
import orderService, { OrderDto } from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import reservationService, {
  ReservationDetail,
  ReservationStatus,
} from "@/lib/services/reservationService";
import {
  FloorLayoutTableItem,
  floorService,
  tableService,
} from "@/lib/services/tableService";
import { formatVND } from "@/lib/utils/currency";
import { HubConnectionState } from "@microsoft/signalr";
import { Drawer, message, Tag } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ReservationDetailsViewProps {
  reservationId: string;
  mode: "admin" | "customer";
}

interface PanoramaTableImage {
  tableId: string;
  tableCode: string;
  imageUrl: string;
}

interface TableActivityDish {
  key: string;
  dishId?: string;
  name: string;
  quantity: number;
  notes: string[];
}

interface TableActivityOrderSummary {
  orderId: string;
  reference: string;
  totalAmount: number;
  paymentStatusLabel: string;
  isPaid: boolean;
  createdAt?: string | null;
  itemCount: number;
}

interface TableActivityDetail {
  tableId: string;
  tableCode: string;
  floorName: string;
  guestDisplayName: string;
  guests: number;
  currentDishes: TableActivityDish[];
  totalQuantity: number;
  ordersCount: number;
  unpaidOrdersCount: number;
  estimatedAmount: number;
  currentStatusLabel: string;
  statusTone: "success" | "processing" | "warning" | "default";
  openedAt?: string | null;
  latestOrderAt?: string | null;
  orderSummaries: TableActivityOrderSummary[];
}

const statusColor: Record<string, string> = {
  PENDING: "var(--warning)",
  CONFIRMED: "var(--primary)",
  CHECKED_IN: "#8b5cf6",
  COMPLETED: "var(--success)",
  CANCELLED: "var(--danger)",
};

const statusBg: Record<string, string> = {
  PENDING: "var(--warning-soft)",
  CONFIRMED: "var(--primary-soft)",
  CHECKED_IN: "rgba(139,92,246,0.12)",
  COMPLETED: "var(--success-soft)",
  CANCELLED: "var(--danger-soft)",
};

const getLocaleTag = (language: string): string =>
  language.toLowerCase().startsWith("vi") ? "vi-VN" : "en-US";

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isGuidLike = (value: string): boolean => GUID_REGEX.test(value.trim());
const deriveConfirmationCodeFromGuid = (guid: string): string =>
  guid.replace(/-/g, "").slice(0, 6).toUpperCase();

interface ReservationDepositStatus {
  reservationId: string;
  depositAmount: number;
  paymentDeadline: string | null;
  isPaid: boolean;
  checkoutUrl: string | null;
  status?: string | null;
  orderId?: string | null;
}

type ReservationDetailViewModel = ReservationDetail & {
  paymentDeadline?: string | null;
  checkoutUrl?: string | null;
  depositStatus?: string | null;
  orderId?: string | null;
};

const reservationServiceWithDeposit =
  reservationService as typeof reservationService & {
    getDepositStatus?: (id: string) => Promise<ReservationDepositStatus>;
    createDepositPaymentLink?: (
      id: string,
    ) => Promise<{ checkoutUrl: string | null }>;
  };

const normalizeReservationDetail = (
  detail: ReservationDetail,
): ReservationDetailViewModel => {
  const raw = detail as ReservationDetailViewModel;
  const code = raw.status?.code?.toUpperCase() ?? "";
  const isConfirmed = code === "CONFIRMED";
  const isCheckedIn = code === "CHECKED_IN" || Boolean(raw.checkedInAt);
  const isCompleted = code === "COMPLETED";
  const isDepositPaid = Boolean(raw.depositPaid) || isConfirmed || isCheckedIn || isCompleted;

  return {
    ...detail,
    depositAmount: Number(detail.depositAmount || 0),
    depositPaid: isDepositPaid,
    paymentDeadline: raw.paymentDeadline ?? null,
    checkoutUrl: raw.checkoutUrl ?? null,
    depositStatus: raw.depositStatus ?? null,
    orderId: raw.orderId ?? null,
  };
};

const mergeDepositStatusIntoDetail = (
  detail: ReservationDetailViewModel,
  depositStatus?: ReservationDepositStatus | null,
): ReservationDetailViewModel => {
  if (!depositStatus) return detail;

  const code = detail.status?.code?.toUpperCase() ?? "";
  const isConfirmed = code === "CONFIRMED";
  const isCheckedIn = code === "CHECKED_IN" || Boolean(detail.checkedInAt);
  const isCompleted = code === "COMPLETED";

  const isDepositPaid =
      typeof depositStatus.isPaid === "boolean"
        ? depositStatus.isPaid || isConfirmed || isCheckedIn || isCompleted
        : detail.depositPaid;

  return {
    ...detail,
    depositAmount:
      typeof depositStatus.depositAmount === "number"
        ? Number(depositStatus.depositAmount)
        : detail.depositAmount,
    depositPaid: isDepositPaid,
    paymentDeadline:
      depositStatus.paymentDeadline ?? detail.paymentDeadline ?? null,
    checkoutUrl: depositStatus.checkoutUrl ?? detail.checkoutUrl ?? null,
    depositStatus: depositStatus.status ?? detail.depositStatus ?? null,
    orderId: depositStatus.orderId ?? detail.orderId ?? null,
  };
};

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  const { t } = useTranslation();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}>
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-full border-[3px] animate-spin"
            style={{
              borderColor: "var(--primary-border)",
              borderTopColor: "var(--primary)",
            }}
          />
          <p
            className="text-sm font-medium tracking-wide"
            style={{ color: "var(--text-muted)" }}>
            {t("reservation_detail.loading")}
          </p>
        </div>
        <div className="space-y-3">
          <div
            className="h-4 rounded-full animate-pulse"
            style={{ background: "var(--surface)" }}
          />
          <div
            className="h-4 rounded-full animate-pulse w-5/6"
            style={{ background: "var(--surface)" }}
          />
          <div
            className="h-24 rounded-2xl animate-pulse"
            style={{ background: "var(--surface)" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Booking Progress Bar ──────────────────────────────────────────────────────
function BookingProgressBar({
  steps,
  currentIndex,
  ariaLabel,
}: {
  steps: ReservationStatus[];
  currentIndex: number;
  ariaLabel: string;
}) {
  const safeSteps = steps.length > 0 ? steps : [];
  const stepsCount = safeSteps.length;

  if (stepsCount === 0) return null;

  const normalizedIndex =
    currentIndex >= 0 ? Math.min(currentIndex, stepsCount - 1) : 0;

  const progressPercent =
    stepsCount <= 1
      ? currentIndex >= 0
        ? 100
        : 0
      : (normalizedIndex / (stepsCount - 1)) * 100;

  const currentStepName =
    currentIndex >= 0 ? safeSteps[normalizedIndex]?.name : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-xs font-semibold tabular-nums"
          style={{ color: "var(--text-muted)" }}>
          {currentIndex >= 0 ? normalizedIndex + 1 : 0}/{stepsCount}
        </p>
        {currentStepName && (
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{
              background: "var(--success-soft)",
              color: "var(--success)",
              border: "1px solid var(--success-border)",
            }}>
            {currentStepName}
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={stepsCount}
        aria-valuenow={currentIndex >= 0 ? normalizedIndex + 1 : 0}>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background: "var(--success)",
            }}
          />
        </div>
      </div>

      <div
        className="grid gap-2 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${stepsCount}, minmax(0, 1fr))`,
        }}>
        {safeSteps.map((step, index) => {
          const done = currentIndex >= 0 && index < normalizedIndex;
          const active = currentIndex >= 0 && index === normalizedIndex;

          return (
            <div
              key={step.code || index}
              className="rounded-xl px-2 py-2.5 sm:px-3 sm:py-3 min-w-0"
              style={{
                background: active
                  ? "color-mix(in srgb, var(--success) 8%, var(--card))"
                  : "var(--card)",
                border: `1px solid ${active ? "var(--success-border)" : "var(--border)"}`,
              }}>
              <div
                className="mx-auto mb-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                style={{
                  background:
                    done || active ? "var(--success-soft)" : "var(--surface)",
                  border: `1px solid ${done || active ? "var(--success-border)" : "var(--border)"}`,
                  color:
                    done || active ? "var(--success)" : "var(--text-muted)",
                }}>
                {done ? (
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-[11px] font-bold tabular-nums">
                    {index + 1}
                  </span>
                )}
              </div>
              <p
                className="text-[11px] sm:text-sm font-semibold text-center leading-snug break-words"
                style={{
                  color: done || active ? "var(--text)" : "var(--text-muted)",
                }}
                title={step.name}>
                {step.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Deposit Badge ─────────────────────────────────────────────────────────────
function DepositBadge({ paid, amount }: { paid: boolean; amount: number }) {
  const { t, i18n } = useTranslation();
  const localeTag = getLocaleTag(i18n.language);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: paid ? "var(--success-soft)" : "var(--danger-soft)",
        color: paid ? "var(--success)" : "var(--danger)",
        border: `1px solid ${paid ? "var(--success-border)" : "var(--danger-border)"}`,
      }}>
      {paid ? (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {paid
        ? `${formatVND(amount)} - ${t("reservation_detail.deposit.badge_paid")}`
        : `${formatVND(amount)} - ${t("reservation_detail.deposit.badge_unpaid")}`}
    </span>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: "1px solid var(--border)" }}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <p
          className="text-sm font-semibold break-words leading-snug"
          style={{ color: "var(--text)" }}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

// ── Order Panel ───────────────────────────────────────────────────────────────
function OrderPanel({
  orders,
  isCustomer,
  onOrderNow,
  isOrderingNow = false,
}: {
  orders: OrderDto[];
  isCustomer: boolean;
  onOrderNow?: () => void;
  isOrderingNow?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const localeTag = getLocaleTag(i18n.language);
  const totalAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}>
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(to right, var(--primary-soft), var(--surface))",
          borderBottom: "1px solid var(--border)",
        }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary)",
            }}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              {t("reservation_detail.order.title")}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {orders.length} {t("reservation_detail.order.orders_count")}
            </p>
          </div>
        </div>
        {orders.length > 0 && (
          <span
            className="text-sm font-black tracking-wide"
            style={{ color: "var(--primary)" }}>
            {formatVND(totalAmount)}
          </span>
        )}
      </div>

      <div className="p-5 space-y-3" style={{ background: "var(--card)" }}>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--surface)",
                border: "1px dashed var(--border)",
              }}>
              <svg
                className="w-6 h-6"
                style={{ color: "var(--text-muted)" }}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p
              className="text-sm text-center"
              style={{ color: "var(--text-muted)" }}>
              {t("reservation_detail.order.no_orders")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order, i) => {
              const paymentRaw =
                order.paymentStatusId ?? order.paymentStatus ?? 0;
              const isPaid = paymentRaw === 1;

              return (
                <div
                  key={order.id ?? i}
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{
                          background: "var(--primary-soft)",
                          color: "var(--primary)",
                        }}>
                        {i + 1}
                      </div>
                      <p
                        className="text-xs font-bold truncate"
                        style={{ color: "var(--text)" }}>
                        {order.reference ||
                          order.id ||
                          t("reservation_detail.order.unnamed_order")}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold shrink-0"
                      style={{ color: "var(--primary)" }}>
                      {formatVND(order.totalAmount)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                      style={{
                        background: "var(--card)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}>
                      {order.orderDetails?.length ?? 0}{" "}
                      {t("reservation_detail.order.items")}
                    </span>
                    <span
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                      style={{
                        background: isPaid
                          ? "var(--success-soft)"
                          : "var(--warning-soft)",
                        color: isPaid ? "var(--success)" : "var(--warning)",
                        border: `1px solid ${isPaid ? "var(--success-border)" : "var(--warning-border)"}`,
                      }}>
                      {order.paymentStatusName ||
                        (isPaid
                          ? t("reservation_detail.order.paid")
                          : t("reservation_detail.order.unpaid"))}
                    </span>
                  </div>

                  {order.orderDetails && order.orderDetails.length > 0 && (
                    <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: "1px dashed var(--border)" }}>
                      {order.orderDetails.map((item, idx) => (
                        <div key={item.id ?? idx} className="grid grid-cols-[1fr_auto_auto] gap-3 text-[13px] items-start">
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold leading-snug" style={{ color: "var(--text)" }}>
                              {item.dishName}
                            </p>
                            {item.note && (
                              <p className="text-[11px] italic mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
                                {item.note}
                              </p>
                            )}
                          </div>
                          <div className="text-center whitespace-nowrap min-w-[40px] pt-[1px]">
                            <span className="font-medium" style={{ color: "var(--text-muted)" }}>
                              x{item.quantity}
                            </span>
                          </div>
                          <div className="text-right whitespace-nowrap min-w-[70px] pt-[1px]">
                            <span className="font-bold" style={{ color: "var(--text)" }}>
                              {formatVND(Number(item.unitPrice || item.dishPrice || 0))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isCustomer && (
          <button
            id="order-now-link"
            type="button"
            onClick={onOrderNow}
            disabled={!onOrderNow || isOrderingNow}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all hover:brightness-110"
            style={{
              background: "var(--primary)",
              color: "var(--on-primary)",
              opacity: !onOrderNow || isOrderingNow ? 0.7 : 1,
              cursor: !onOrderNow || isOrderingNow ? "not-allowed" : "pointer",
            }}>
            {isOrderingNow ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            )}
            {isOrderingNow
              ? t("reservation_detail.order.creating_pre_order")
              : t("reservation_detail.order.order_now")}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Table Map Card ─────────────────────────────────────────────────────────────
function TableMapCard({
  detail,
  relatedOrders,
  viewMode,
}: {
  detail: ReservationDetail;
  relatedOrders: OrderDto[];
  viewMode: "admin" | "customer";
}) {
  const router = useRouter();
  const { tenant } = useTenant();
  const { t } = useTranslation();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [selectedTableActivity, setSelectedTableActivity] =
    useState<TableActivityDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dishNameMap, setDishNameMap] = useState<Record<string, string>>({});
  const [customerNameMap, setCustomerNameMap] = useState<
    Record<string, string>
  >({});
  const [ordersSource, setOrdersSource] = useState<OrderDto[]>(relatedOrders);
  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState(false);

  const dishNameCacheRef = useRef<Record<string, string>>({});
  const customerNameCacheRef = useRef<Record<string, string>>({});
  const tableActivityCacheRef = useRef<Record<string, TableActivityDetail>>({});

  useEffect(() => {
    setOrdersSource(relatedOrders);
  }, [relatedOrders]);

  useEffect(() => {
    let active = true;
    const loadDishNames = async () => {
      if (Object.keys(dishNameCacheRef.current).length > 0) {
        setDishNameMap(dishNameCacheRef.current);
        return;
      }
      try {
        const menu = await dishService.getMenu();
        const flatItems = (menu ?? []).flatMap(
          (cat: MenuCategory) => cat.items ?? [],
        );
        const nextMap: Record<string, string> = {};
        flatItems.forEach((dish: MenuItem) => {
          if (dish.id) {
            nextMap[dish.id] = dish.name || dish.id;
          }
        });
        dishNameCacheRef.current = nextMap;
        if (active) setDishNameMap(nextMap);
      } catch {
        if (active) setDishNameMap(dishNameCacheRef.current || {});
      }
    };
    loadDishNames();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadCustomerNames = async () => {
      const uniqueCustomerIds = Array.from(
        new Set((ordersSource ?? []).map((o) => o.customerId).filter(Boolean)),
      );
      if (uniqueCustomerIds.length === 0) {
        if (active) setCustomerNameMap(customerNameCacheRef.current || {});
        return;
      }

      const missingIds = uniqueCustomerIds.filter(
        (id) => !customerNameCacheRef.current[id],
      );
      if (missingIds.length === 0) {
        if (active) setCustomerNameMap({ ...customerNameCacheRef.current });
        return;
      }

      const entries = await Promise.all(
        missingIds.map(async (customerId) => {
          try {
            const profile =
              await customerService.getCustomerProfile(customerId);
            return [customerId, profile?.fullName || customerId] as const;
          } catch {
            return [customerId, customerId] as const;
          }
        }),
      );
      entries.forEach(([id, name]) => {
        customerNameCacheRef.current[id] = name;
      });
      if (!active) return;
      setCustomerNameMap({ ...customerNameCacheRef.current });
    };

    loadCustomerNames();
    return () => {
      active = false;
    };
  }, [ordersSource]);

  const handleTableActivityClick = useCallback(
    (table: TableData) => {
      const cached = tableActivityCacheRef.current[table.id];
      if (cached) {
        setSelectedTableActivity(cached);
        setDrawerOpen(true);
        return;
      }

      const relatedTableOrders = ordersSource.filter((order) => {
        const matchedByMainTable = order.tableId === table.id;
        const matchedByTableIds = (order.tableIds ?? []).includes(table.id);
        const matchedBySessions = (order.tableSessions ?? []).some(
          (session) =>
            session?.tableId === table.id || session?.table?.id === table.id,
        );
        return matchedByMainTable || matchedByTableIds || matchedBySessions;
      });

      const rawGuests = Number(detail.numberOfGuests || 0);
      const tableCapacity = Number(table.seats || 0);
      const guests =
        rawGuests > 0 && tableCapacity > 0
          ? Math.min(rawGuests, tableCapacity)
          : rawGuests || tableCapacity || 0;

      const dishMap = new Map<string, TableActivityDish>();
      let totalQuantity = 0;
      let estimatedAmount = 0;

      relatedTableOrders.forEach((order, orderIndex) => {
        estimatedAmount += Number(order.totalAmount || 0);
        (order.orderDetails ?? []).forEach((item, detailIndex) => {
          const quantity = Number(item.quantity || 0);
          if (!quantity) return;
          totalQuantity += quantity;

          const dishKey = item.dishId || `dish-${orderIndex}-${detailIndex}`;
          const dishLabel = item.dishId
            ? dishNameMap[item.dishId] ||
              `${t("reservation_detail.floor_activity.dish")} ${item.dishId.slice(0, 8)}`
            : t("reservation_detail.floor_activity.unknown_dish");

          const current = dishMap.get(dishKey);
          if (current) {
            current.quantity += quantity;
            if (item.note && item.note.trim()) {
              current.notes.push(item.note.trim());
            }
          } else {
            dishMap.set(dishKey, {
              key: dishKey,
              dishId: item.dishId,
              name: dishLabel,
              quantity,
              notes: item.note && item.note.trim() ? [item.note.trim()] : [],
            });
          }
        });
      });

      const currentDishes = Array.from(dishMap.values()).sort(
        (a, b) => b.quantity - a.quantity,
      );
      const unpaidOrdersCount = relatedTableOrders.filter(
        (order) => (order.paymentStatusId ?? order.paymentStatus ?? 0) === 0,
      ).length;

      const latestOrder = [...relatedTableOrders].sort(
        (a, b) =>
          new Date(b.createdDate || 0).getTime() -
          new Date(a.createdDate || 0).getTime(),
      )[0];
      const firstOrder = [...relatedTableOrders].sort(
        (a, b) =>
          new Date(a.createdDate || 0).getTime() -
          new Date(b.createdDate || 0).getTime(),
      )[0];

      const dominantCustomerId = relatedTableOrders[0]?.customerId;
      const dominantCustomerName = dominantCustomerId
        ? customerNameMap[dominantCustomerId] || detail.contact.name
        : detail.contact.name;

      const statusLabelMap: Record<string, string> = {
        AVAILABLE: t("reservation_detail.floor_activity.status_available"),
        OCCUPIED: t("reservation_detail.floor_activity.status_occupied"),
        RESERVED: t("reservation_detail.floor_activity.status_reserved"),
        CLEANING: t("reservation_detail.floor_activity.status_cleaning"),
        DISABLED: t("reservation_detail.floor_activity.status_disabled"),
        SELECTED: t("reservation_detail.floor_activity.status_selected"),
      };

      const statusToneMap: Record<
        string,
        "success" | "processing" | "warning" | "default"
      > = {
        AVAILABLE: "success",
        OCCUPIED: "processing",
        RESERVED: "warning",
        CLEANING: "warning",
        DISABLED: "default",
        SELECTED: "processing",
      };

      const orderSummaries: TableActivityOrderSummary[] = relatedTableOrders
        .map((order, idx) => {
          const isPaid =
            (order.paymentStatusId ?? order.paymentStatus ?? 0) === 1;
          return {
            orderId: order.id || `order-${idx}`,
            reference: order.reference || order.id || `#${idx + 1}`,
            totalAmount: Number(order.totalAmount || 0),
            paymentStatusLabel:
              order.paymentStatusName ||
              (isPaid
                ? t("dashboard.orders.payment_status.paid")
                : t("dashboard.orders.payment_status.unpaid")),
            isPaid,
            createdAt: order.createdDate,
            itemCount: (order.orderDetails ?? []).reduce(
              (sum, item) => sum + Number(item.quantity || 0),
              0,
            ),
          };
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

      const nextActivity: TableActivityDetail = {
        tableId: table.id,
        tableCode: table.name,
        floorName: table.area,
        guestDisplayName:
          guests > 1
            ? `${dominantCustomerName} (+${guests - 1})`
            : dominantCustomerName,
        guests,
        currentDishes,
        totalQuantity,
        ordersCount: relatedTableOrders.length,
        unpaidOrdersCount,
        estimatedAmount,
        currentStatusLabel: statusLabelMap[table.status] || table.status,
        statusTone: statusToneMap[table.status] || "default",
        openedAt: firstOrder?.createdDate || null,
        latestOrderAt: latestOrder?.createdDate || null,
        orderSummaries,
      };

      tableActivityCacheRef.current[table.id] = nextActivity;
      setSelectedTableActivity(nextActivity);
      setDrawerOpen(true);
    },
    [
      customerNameMap,
      detail.contact.name,
      detail.numberOfGuests,
      dishNameMap,
      ordersSource,
      t,
    ],
  );

  useEffect(() => {
    tableActivityCacheRef.current = {};
  }, [ordersSource, detail.updatedAt]);

  useEffect(() => {
    if (!tenant?.id) return;
    const tenantId = tenant.id;
    let mounted = true;
    let debounceTimer: ReturnType<typeof setTimeout>;

    const handleOrderChanged = (payload: unknown) => {
      const eventPayload = payload as Record<string, unknown>;
      const changedTenantId = (eventPayload?.tenantId ||
        (eventPayload?.order as Record<string, unknown>)?.tenantId) as
        | string
        | undefined;
      if (changedTenantId && changedTenantId !== tenantId) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!mounted) return;
        try {
          setIsRealtimeSyncing(true);
          const orders = await orderService.getAllOrders();
          const nextOrders = orders.filter(
            (o) => o.reservationId === detail.id,
          );
          setOrdersSource(nextOrders);
        } catch (err) {
          console.warn("Realtime floor activity sync failed", err);
        } finally {
          if (mounted) setIsRealtimeSyncing(false);
        }
      }, 350);
    };

    const events = ["orders.created", "orders.updated", "orders.deleted"];

    const setupRealtime = async () => {
      try {
        await orderSignalRService.start();
        const conn = orderSignalRService.getConnection();
        if (!mounted) return;
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenantId);
          events.forEach((eventName) =>
            orderSignalRService.on(eventName, handleOrderChanged),
          );
        }
      } catch (err) {
        console.warn("Failed to setup order realtime", err);
      }
    };

    setupRealtime();

    return () => {
      mounted = false;
      clearTimeout(debounceTimer);
      events.forEach((eventName) =>
        orderSignalRService.off(eventName, handleOrderChanged),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenantId).catch(() => {});
    };
  }, [detail.id, tenant?.id]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!detail.tables || detail.tables.length === 0) return;
      setLoadingMap(true);
      try {
        const queryTime =
          detail.reservationDateTime || new Date().toISOString();
        const allFloors = await floorService.getAllFloors().catch(() => []);
        const activeFloors = allFloors.filter((f) => f.isActive !== false);
        if (activeFloors.length > 0) {
          const layoutResults = await Promise.allSettled(
            activeFloors.map((f) =>
              floorService.getFloorLayout(f.id, queryTime),
            ),
          );
          const floors = activeFloors.map((floorSummary, idx) => {
            const layoutResult = layoutResults[idx];
            const layoutData =
              layoutResult.status === "fulfilled" ? layoutResult.value : null;
            const tableDataList: TableData[] = (layoutData?.tables ?? []).map(
              (t: FloorLayoutTableItem) => ({
                id: t.id,
                tenantId: "default",
                name: t.code,
                seats: t.seatingCapacity,
                status:
                  t.status === "1" || t.status?.toLowerCase() === "occupied"
                    ? "OCCUPIED"
                    : "AVAILABLE",
                area: floorSummary.name,
                position: { x: Number(t.layout.x), y: Number(t.layout.y) },
                shape: (t.layout.shape === "Round" ||
                t.layout.shape === "Circle"
                  ? "Circle"
                  : t.layout.shape === "Square"
                    ? "Square"
                    : t.layout.shape === "Oval"
                      ? "Oval"
                      : "Rectangle") as
                  | "Circle"
                  | "Rectangle"
                  | "Square"
                  | "Oval",
                width: Number(t.layout.width) || 100,
                height: Number(t.layout.height) || 100,
                rotation: Number(t.layout.rotation) || 0,
                zoneId: floorSummary.name,
              }),
            );
            return {
              id: floorSummary.id,
              name: floorSummary.name,
              width: Number(
                layoutData?.floor.width ?? floorSummary.width ?? 1400,
              ),
              height: Number(
                layoutData?.floor.height ?? floorSummary.height ?? 900,
              ),
              backgroundImage:
                layoutData?.floor.backgroundImageUrl ??
                floorSummary.imageUrl ??
                undefined,
              tables: tableDataList,
            };
          });
          const reservedTableIds = detail.tables.map((t) => t.id);
          const firstFloorId =
            floors.find((f) =>
              f.tables.some((t) => reservedTableIds.includes(t.id)),
            )?.id ||
            floors[0]?.id ||
            "";
          if (active)
            setLayout({
              id: "be-layout",
              name: "Main Layout",
              activeFloorId: firstFloorId,
              floors,
            });
        }
      } catch (err) {
        console.warn("Failed to load table layout", err);
      } finally {
        if (active) setLoadingMap(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [detail]);

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ border: "1px solid var(--border)" }}>
      <div className="relative h-64" style={{ background: "var(--surface)" }}>
        {loadingMap ? (
          <div
            className="absolute inset-0 flex items-center justify-center gap-3"
            style={{ color: "var(--text-muted)" }}>
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: "var(--primary-border)",
                borderTopColor: "var(--primary)",
              }}
            />
            <span className="text-xs font-bold tracking-widest uppercase">
              {t("reservation_detail.map.loading")}
            </span>
          </div>
        ) : layout ? (
          <div className="absolute inset-0 p-1 pointer-events-auto">
            <TableMap2D
              layout={layout}
              onLayoutChange={() => {}}
              onTableClick={handleTableActivityClick}
              onTablePositionChange={() => {}}
              readOnly
              hideControls={true}
              focusOnSelected={true}
              selectedTableIds={detail.tables.map((t) => t.id)}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center p-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                }}>
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-muted)" }}>
                {t("reservation_detail.map.unavailable")}
              </p>
            </div>
          </div>
        )}
      </div>

      <Drawer
        open={drawerOpen && !!selectedTableActivity}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTableActivity(null);
        }}
        className="reservation-detail-floor-activity-drawer"
        title={
          selectedTableActivity
            ? `${t("reservation_detail.floor_activity.title")} · ${selectedTableActivity.tableCode}`
            : t("reservation_detail.floor_activity.title")
        }
        size="large">
        {selectedTableActivity && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.current_guest")}
                </p>
                <p
                  className="text-sm font-black"
                  style={{ color: "var(--text)" }}>
                  {selectedTableActivity.guestDisplayName}
                </p>
              </div>
              <Tag color={selectedTableActivity.statusTone}>
                {selectedTableActivity.currentStatusLabel}
              </Tag>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <p
                  className="text-[10px] font-bold uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.guests")}
                </p>
                <p
                  className="text-sm font-black"
                  style={{ color: "var(--text)" }}>
                  {selectedTableActivity.guests}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <p
                  className="text-[10px] font-bold uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.orders")}
                </p>
                <p
                  className="text-sm font-black"
                  style={{ color: "var(--text)" }}>
                  {selectedTableActivity.ordersCount}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <p
                  className="text-[10px] font-bold uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.items")}
                </p>
                <p
                  className="text-sm font-black"
                  style={{ color: "var(--text)" }}>
                  {selectedTableActivity.totalQuantity}
                </p>
              </div>
              <div
                className="rounded-lg px-3 py-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}>
                <p
                  className="text-[10px] font-bold uppercase"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.unpaid")}
                </p>
                <p
                  className="text-sm font-black"
                  style={{ color: "var(--text)" }}>
                  {selectedTableActivity.unpaidOrdersCount}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}>
              <p
                className="text-[11px] font-bold"
                style={{ color: "var(--text-muted)" }}>
                {t("reservation_detail.floor_activity.current_dishes")}
              </p>
              {selectedTableActivity.currentDishes.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.no_dishes")}
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-auto pr-1">
                  {selectedTableActivity.currentDishes.map((dish) => (
                    <div
                      key={dish.key}
                      className="rounded-lg p-2"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className="truncate pr-2"
                          style={{ color: "var(--text)" }}>
                          {dish.name}
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: "var(--primary)" }}>
                          x{dish.quantity}
                        </span>
                      </div>
                      {dish.notes.length > 0 && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--text-muted)" }}>
                          {t("reservation_detail.floor_activity.kitchen_note")}:{" "}
                          {dish.notes.join("; ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}>
              <p
                className="text-[11px] font-bold"
                style={{ color: "var(--text-muted)" }}>
                {t("reservation_detail.floor_activity.orders_detail")}
              </p>
              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {selectedTableActivity.orderSummaries.map((order) => (
                  <div
                    key={order.orderId}
                    className="rounded-lg p-2"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                    }}>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: "var(--text)" }}>
                        {order.reference}
                      </p>
                      <Tag color={order.isPaid ? "success" : "warning"}>
                        {order.paymentStatusLabel}
                      </Tag>
                    </div>
                    <div
                      className="flex items-center justify-between text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}>
                      <span>
                        {order.itemCount} {t("reservation_detail.order.items")}
                      </span>
                      <span>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("vi-VN")
                          : "—"}
                      </span>
                    </div>
                    <p
                      className="text-sm font-black mt-1"
                      style={{ color: "var(--primary)" }}>
                      {formatVND(order.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-between text-sm"
              style={{ color: "var(--text-muted)" }}>
              <span>
                {t("reservation_detail.floor_activity.opened_at")}:{" "}
                {selectedTableActivity.openedAt
                  ? new Date(selectedTableActivity.openedAt).toLocaleString(
                      "vi-VN",
                    )
                  : "—"}
              </span>
            </div>
            <div
              className="flex items-center justify-between text-sm"
              style={{ color: "var(--text-muted)" }}>
              <span>
                {t("reservation_detail.floor_activity.latest_order")}:{" "}
                {selectedTableActivity.latestOrderAt
                  ? new Date(
                      selectedTableActivity.latestOrderAt,
                    ).toLocaleString("vi-VN")
                  : "—"}
              </span>
              <span className="font-black" style={{ color: "var(--primary)" }}>
                {formatVND(selectedTableActivity.estimatedAmount)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/menu/${selectedTableActivity.tableId}`,
                  )
                }
                className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}>
                {t("reservation_detail.floor_activity.goto_pos")}
              </button>

              {isRealtimeSyncing && (
                <span
                  className="text-xs self-center"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.floor_activity.syncing")}
                </span>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ReservationDetailsView({
  reservationId,
  mode: viewMode,
}: ReservationDetailsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ReservationDetailViewModel | null>(null);
  const [statusSteps, setStatusSteps] = useState<ReservationStatus[]>([]);
  const [relatedOrders, setRelatedOrders] = useState<OrderDto[]>([]);
  const [depositLoading, setDepositLoading] = useState(false);
  const [panoramaImage, setPanoramaImage] = useState<PanoramaTableImage | null>(
    null,
  );
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editDateTime, setEditDateTime] = useState("");
  const [editGuests, setEditGuests] = useState<number>(1);
  const [editSpecialRequests, setEditSpecialRequests] = useState("");
  const [isPreOrdering, setIsPreOrdering] = useState(false);
  const [isPreOrderPopupOpen, setIsPreOrderPopupOpen] = useState(false);

  const isCustomer = viewMode === "customer";
  const reservationSlug = String(reservationId || "").trim();
  const reservationCodeQuery = (searchParams.get("code") || "")
    .trim()
    .toUpperCase();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!reservationSlug) {
        throw new Error("Reservation identifier is empty");
      }

      let d: ReservationDetailViewModel;

      if (isCustomer) {
        const codeCandidates = Array.from(
          new Set(
            [
              reservationCodeQuery,
              !isGuidLike(reservationSlug) ? reservationSlug : "",
              isGuidLike(reservationSlug)
                ? deriveConfirmationCodeFromGuid(reservationSlug)
                : "",
            ]
              .map((value) => value.trim().toUpperCase())
              .filter(Boolean),
          ),
        );

        let loadedByCode: ReservationDetailViewModel | null = null;
        let lastLookupError: unknown = null;

        for (const code of codeCandidates) {
          try {
            loadedByCode = await reservationService.lookupReservation({ code });
            break;
          } catch (error) {
            lastLookupError = error;
          }
        }

        if (!loadedByCode) {
          throw lastLookupError ?? new Error("Reservation lookup failed");
        }

        d = loadedByCode;
      } else {
        d = await reservationService.getReservationById(reservationSlug);
      }

      let normalizedDetail = normalizeReservationDetail(d);

      if (reservationServiceWithDeposit.getDepositStatus) {
        try {
          const depositStatus =
            await reservationServiceWithDeposit.getDepositStatus(
              normalizedDetail.id,
            );
          normalizedDetail = mergeDepositStatusIntoDetail(
            normalizedDetail,
            depositStatus,
          );
        } catch (depositError) {
          // Keep reservation detail fallback when deposit status endpoint is unavailable for current auth context.
          console.warn("Deposit status unavailable:", depositError);
        }
      }

      const deadlineTime = normalizedDetail.paymentDeadline
        ? new Date(normalizedDetail.paymentDeadline).getTime()
        : Number.NaN;
      const isDepositDeadlinePassed =
        !Number.isNaN(deadlineTime) && deadlineTime <= Date.now();
      const shouldRegenerateDepositLink =
        isCustomer &&
        !normalizedDetail.depositPaid &&
        normalizedDetail.depositAmount > 0 &&
        !isDepositDeadlinePassed &&
        (!normalizedDetail.checkoutUrl || normalizedDetail.depositStatus === 'CANCELLED');

      if (
        shouldRegenerateDepositLink &&
        reservationServiceWithDeposit.createDepositPaymentLink
      ) {
        try {
          const payLinkRes =
            await reservationServiceWithDeposit.createDepositPaymentLink(
              normalizedDetail.id,
            );
          if (payLinkRes.checkoutUrl) {
            normalizedDetail = {
              ...normalizedDetail,
              checkoutUrl: payLinkRes.checkoutUrl,
              depositStatus: "PENDING",
            };
          }
        } catch (payLinkError) {
          console.warn(
            "Deposit payment link regeneration unavailable:",
            payLinkError,
          );
        }
      }

      setDetail(normalizedDetail);

      try {
        const statuses = await reservationService.getReservationStatuses();
        const allowedCodes = new Set(["PENDING", "CONFIRMED", "CANCELLED"]);
        const normalized = (statuses ?? []).filter(
          (s) => !!s?.code && allowedCodes.has(s.code.toUpperCase()),
        );
        if (normalized.length > 0) {
          setStatusSteps(normalized);
        } else {
          setStatusSteps([]);
        }
      } catch {
        setStatusSteps([]);
      }
      setEditDateTime(
        normalizedDetail.reservationDateTime
          ? normalizedDetail.reservationDateTime.slice(0, 16)
          : "",
      );
      setEditGuests(normalizedDetail.numberOfGuests || 1);
      setEditSpecialRequests(normalizedDetail.specialRequests || "");

      if (normalizedDetail.tables?.length) {
        try {
          const firstTable = normalizedDetail.tables[0];
          const table = await tableService.getTableById(firstTable.id);
          const imageUrl =
            table.cubeFrontImageUrl || table.defaultViewUrl || "";
          setPanoramaImage(
            imageUrl
              ? { tableId: firstTable.id, tableCode: firstTable.code, imageUrl }
              : null,
          );
        } catch {
          setPanoramaImage(null);
        }
      } else {
        setPanoramaImage(null);
      }

      if (!isCustomer) {
        try {
          const orders = await orderService.getAllOrders();
          setRelatedOrders(
            orders.filter((o) => o.reservationId === normalizedDetail.id),
          );
        } catch {
          setRelatedOrders([]);
        }
      } else {
        if (normalizedDetail.orderId) {
          try {
            const preOrder = await orderService.getOrderById(normalizedDetail.orderId);
            setRelatedOrders(preOrder ? [preOrder] : []);
          } catch {
            setRelatedOrders([]);
          }
        } else {
          setRelatedOrders([]);
        }
      }
    } catch (err) {
      console.error(err);
      setDetail(null);
      setPanoramaImage(null);
    } finally {
      setLoading(false);
    }
  }, [isCustomer, reservationCodeQuery, reservationSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const resolvedCustomerId =
    detail?.contact?.customerId || user?.customerId || undefined;

  const handleOpenPreOrderPopup = () => {
    if (!detail) return;

    if (!resolvedCustomerId) {
      messageApi.warning(t("reservation_detail.order.customer_required"));
      return;
    }

    setIsPreOrderPopupOpen(true);
  };

  const handleCreatePreOrder = async (
    selectedItems: PreOrderSelectionItem[],
  ) => {
    if (!detail || !resolvedCustomerId) return;

    const orderDetails = selectedItems
      .filter((item) => item.quantity > 0 && (item.comboId || item.dishId))
      .map((item) => {
        const base = {
          quantity: Number(item.quantity || 0),
          note: item.note?.trim() || undefined,
        };
        return item.comboId
          ? { ...base, comboId: item.comboId }
          : { ...base, dishId: item.dishId };
      });

    if (orderDetails.length === 0) {
      messageApi.warning(t("reservation_detail.order.no_selected_items"));
      return;
    }

    try {
      setIsPreOrdering(true);

      const response = await orderService.preOrderByReservation(detail.id, {
        customerId: resolvedCustomerId,
        orderDetails,
      });

      messageApi.success(
        response?.message || t("reservation_detail.order.pre_order_created"),
      );
      setIsPreOrderPopupOpen(false);

      if (!isCustomer) {
        try {
          const orders = await orderService.getAllOrders();
          setRelatedOrders(orders.filter((o) => o.reservationId === detail.id));
        } catch {
          // Keep current list if refresh fails.
        }
      }
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data;
      messageApi.error(
        typeof serverMsg === "string" && serverMsg.length < 200
          ? serverMsg
          : t("reservation_detail.order.pre_order_failed"),
      );
    } finally {
      setIsPreOrdering(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const tenantAddress = [
    tenant?.businessAddressLine1,
    tenant?.businessAddressLine2,
    tenant?.businessAddressLine3,
    tenant?.businessAddressLine4,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
  const mapSearchUrl = tenantAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenantAddress)}`
    : "";
  const mapEmbedUrl = tenantAddress
    ? `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent(tenantAddress)}&t=&z=14&ie=UTF8&iwloc=B&output=embed`
    : "";

  const handlePayDeposit = async () => {
    if (!detail) return;

    if (detail.depositPaid) {
      messageApi.info(t("reservation_detail.deposit.already_paid"));
      return;
    }

    if (detail.paymentDeadline) {
      const deadlineTime = new Date(detail.paymentDeadline).getTime();
      if (!Number.isNaN(deadlineTime) && deadlineTime <= Date.now()) {
        messageApi.warning(t("reservation_detail.deposit.deadline_passed"));
        return;
      }
    }

    try {
      setDepositLoading(true);

      if (detail.checkoutUrl && detail.depositStatus !== 'CANCELLED') {
        window.location.assign(detail.checkoutUrl);
        return;
      }

      if (!reservationServiceWithDeposit.createDepositPaymentLink) {
        messageApi.error(t("reservation_detail.deposit.create_failed"));
        return;
      }

      const res = await reservationServiceWithDeposit.createDepositPaymentLink(
        detail.id,
      );
      if (res.checkoutUrl) {
        setDetail((prev) =>
          prev
            ? {
              ...prev,
              checkoutUrl: res.checkoutUrl,
            }
            : prev,
        );

        window.location.assign(res.checkoutUrl);
      } else {
        messageApi.error(t("reservation_detail.deposit.link_error"));
      }
    } catch (err) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const beMessage = axiosError?.response?.data?.message;
      messageApi.error(
        beMessage || t("reservation_detail.deposit.create_failed"),
      );
    } finally {
      setDepositLoading(false);
    }
  };

  const handleToggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    const nextT = i18n.getFixedT(newLang);
    messageApi.success(nextT("reservation_detail.language.switched"));
  };

  const handleCancelEdit = () => {
    if (!detail) return;
    setEditDateTime(
      detail.reservationDateTime ? detail.reservationDateTime.slice(0, 16) : "",
    );
    setEditGuests(detail.numberOfGuests || 1);
    setEditSpecialRequests(detail.specialRequests || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!detail) return;

    const isLockedStatus = ["COMPLETED", "CANCELLED"].includes(
      detail.status.code,
    );
    if (isLockedStatus) {
      messageApi.warning(t("reservation_detail.edit.locked_status"));
      return;
    }

    if (!editDateTime) {
      messageApi.warning(t("reservation_detail.edit.date_required"));
      return;
    }

    const selectedDate = new Date(editDateTime);
    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.getTime() <= Date.now()
    ) {
      messageApi.warning(t("reservation_detail.edit.date_in_past"));
      return;
    }

    const normalizedGuests = Math.max(1, Number(editGuests) || 1);
    const totalCapacity = (detail.tables || []).reduce(
      (sum, tb) => sum + (tb.capacity || 0),
      0,
    );
    if (totalCapacity > 0 && normalizedGuests > totalCapacity) {
      messageApi.warning(
        t("reservation_detail.edit.guests_exceed_capacity", {
          guests: normalizedGuests,
          capacity: totalCapacity,
        }),
      );
      return;
    }

    try {
      setSavingEdit(true);
      await reservationService.updateReservation(detail.id, {
        reservationDateTime: selectedDate.toISOString(),
        numberOfGuests: normalizedGuests,
        specialRequests: editSpecialRequests?.trim() || undefined,
      });
      messageApi.success(t("reservation_detail.edit.save_success"));
      setIsEditing(false);
      await load();
    } catch (err) {
      console.error(err);
      messageApi.error(t("reservation_detail.edit.save_failed"));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <Spinner />;

  if (!detail) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: "var(--bg-base)" }}>
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid var(--danger-border)",
          }}>
          <svg
            className="w-10 h-10"
            style={{ color: "var(--danger)" }}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: "var(--text)" }}>
            {t("reservation_detail.not_found.title")}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("reservation_detail.not_found.description")}
          </p>
        </div>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
          {t("reservation_detail.back")}
        </button>
      </div>
    );
  }

  const sColor = statusColor[detail.status.code] ?? "var(--text)";
  const sBg = statusBg[detail.status.code] ?? "var(--surface)";
  const reservationDate = new Date(detail.reservationDateTime);
  const localeTag = getLocaleTag(i18n.language);
  const fallbackSteps: ReservationStatus[] = [
    {
      id: 1,
      code: "PENDING",
      name: t("reservation_detail.timeline.pending"),
      colorCode: "",
    },
    {
      id: 2,
      code: "CONFIRMED",
      name: t("reservation_detail.timeline.confirmed"),
      colorCode: "",
    },
    {
      id: 3,
      code: "CANCELLED",
      name: t("reservation_detail.timeline.cancelled"),
      colorCode: "",
    },
  ];

  const allSteps = statusSteps.length > 0 ? statusSteps : fallbackSteps;
  const currentStatusCode = (detail.status.code || "").toUpperCase();
  const currIdx = allSteps.findIndex(
    (s) => s.code?.toUpperCase() === currentStatusCode,
  );
  const isEditLocked = ["COMPLETED", "CANCELLED"].includes(detail.status.code);
  const depositDeadlineDate = detail.paymentDeadline
    ? new Date(detail.paymentDeadline)
    : null;
  const hasDepositDeadline = Boolean(
    depositDeadlineDate && !Number.isNaN(depositDeadlineDate.getTime()),
  );
  const isDepositDeadlinePassed = hasDepositDeadline
    ? depositDeadlineDate!.getTime() <= Date.now()
    : false;
  const isDepositPaymentAllowed =
    isCustomer &&
    !detail.depositPaid &&
    detail.depositAmount > 0 &&
    !isDepositDeadlinePassed &&
    !isEditLocked;
  const isCancelledByDeadline =
    !detail.depositPaid &&
    isDepositDeadlinePassed &&
    (detail.status.code || "").toUpperCase() === "CANCELLED";
  const hasTenantHeroBanner = Boolean(tenant?.backgroundUrl);
  const heroText = hasTenantHeroBanner ? "#F8FAFC" : "var(--text)";
  const heroTextMuted = hasTenantHeroBanner
    ? "rgba(248,250,252,0.82)"
    : "var(--text-muted)";
  const heroBorder = hasTenantHeroBanner
    ? "rgba(248,250,252,0.22)"
    : "var(--border)";
  const heroSurface = hasTenantHeroBanner
    ? "rgba(15,23,42,0.55)"
    : "var(--surface)";
  const languageToggleBg = hasTenantHeroBanner
    ? "rgba(15,23,42,0.72)"
    : "var(--surface)";
  const languageToggleBorder = hasTenantHeroBanner
    ? "rgba(248,250,252,0.5)"
    : "var(--border)";
  const languageToggleColor = hasTenantHeroBanner
    ? "#F8FAFC"
    : "var(--primary)";
  const reservationShareToken = isCustomer
    ? detail.confirmationCode || detail.id
    : detail.id;
  const reservationSharePath = `/your-reservation/${encodeURIComponent(reservationShareToken)}`;
  const reservationShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${reservationSharePath}`
      : reservationSharePath;

  const handleCopyReservationUrl = async () => {
    try {
      await navigator.clipboard.writeText(reservationShareUrl);
      messageApi.success(t("reservation_detail.share.copy_success"));
    } catch {
      messageApi.error(t("reservation_detail.share.copy_failed"));
    }
  };

  return (
    <main
      className="min-h-screen reservation-detail-page"
      style={{ background: "var(--bg-base)" }}>
      {contextHolder}

      {/* ── Hero Banner ───────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden reservation-hero-banner"
        style={{
          background: tenant?.backgroundUrl
            ? `url(${tenant.backgroundUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, var(--card)) 0%, var(--card) 65%)`,
        }}>
        {tenant?.backgroundUrl && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.58) 50%, rgba(8,12,24,0.78) 100%)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.48) 100%)",
              }}
            />
          </>
        )}

        {/* Ambient orb */}
        <div className="reservation-hero-orb absolute -top-16 -right-16 z-0" />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: tenant?.backgroundUrl
              ? "linear-gradient(to right, transparent, rgba(255,255,255,0.35), transparent)"
              : "linear-gradient(to right, transparent, var(--primary-border), transparent)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12">
          {/* Top Bar (Breadcrumb + Actions) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                id="reservation-back-btn"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-80"
                style={{ color: heroTextMuted }}>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t("reservation_detail.back")}
              </button>
              <span style={{ color: heroBorder }}>/</span>
              <span
                className="text-xs font-medium"
                style={{ color: heroTextMuted }}>
                {t("reservation_detail.breadcrumb")}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={handleToggleLanguage}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all border hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: languageToggleBg,
                  borderColor: languageToggleBorder,
                  color: languageToggleColor,
                  backdropFilter: hasTenantHeroBanner ? "blur(8px)" : undefined,
                  boxShadow: hasTenantHeroBanner
                    ? "0 8px 24px rgba(2,6,23,0.35)"
                    : undefined,
                }}
                title={t("reservation_detail.language.toggle")}
                aria-label={t("reservation_detail.language.toggle")}>
                <span className="text-[11px] font-black uppercase">
                  {i18n.language === "vi" ? "VI" : "EN"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left: title + badges */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs uppercase tracking-[0.25em] font-bold mb-3"
                style={{ color: heroTextMuted }}>
                {t("reservation_detail.hero.label")}
              </p>
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 italic"
                style={{ color: heroText }}>
                #{detail.confirmationCode}
              </h1>
              <p className="text-sm mb-5" style={{ color: heroTextMuted }}>
                {t("reservation_detail.hero.created_at")}{" "}
                {new Date(detail.createdAt).toLocaleString(localeTag)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{
                    color: sColor,
                    background: sBg,
                    borderColor: `${sColor}44`,
                  }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: sColor }}
                  />
                  {detail.status.name}
                </span>
                <DepositBadge
                  paid={detail.depositPaid}
                  amount={detail.depositAmount}
                />
                {!detail.contact.isGuest && detail.contact.membershipLevel && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{
                      background:
                        "color-mix(in srgb, var(--gold) 15%, transparent)",
                      color: "var(--gold)",
                      border:
                        "1px solid color-mix(in srgb, var(--gold) 30%, transparent)",
                    }}>
                    {detail.contact.membershipLevel}
                  </span>
                )}
              </div>
            </div>

            {/* Right: date-time chip + table badges */}
            <div className="flex flex-col items-start lg:items-end gap-3 shrink-0 w-full lg:w-auto">
              <div
                className="w-full lg:w-auto flex items-center justify-between gap-3 sm:gap-5 px-4 py-4 sm:px-6 sm:py-5 rounded-2xl"
                style={{
                  background: hasTenantHeroBanner
                    ? "rgba(15,23,42,0.58)"
                    : "var(--card)",
                  border: `1px solid ${heroBorder}`,
                  boxShadow: "var(--shadow-md)",
                  backdropFilter: hasTenantHeroBanner ? "blur(8px)" : undefined,
                }}>
                <div className="text-center">
                  <p
                    className="text-3xl sm:text-4xl font-black"
                    style={{ color: "var(--primary)" }}>
                    {reservationDate.getDate()}
                  </p>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mt-0.5"
                    style={{ color: heroTextMuted }}>
                    {reservationDate.toLocaleString(localeTag, {
                      month: "short",
                    })}{" "}
                    {reservationDate.getFullYear()}
                  </p>
                </div>
                <div
                  className="w-px h-10 sm:h-12"
                  style={{ background: heroBorder }}
                />
                <div className="text-center">
                  <p
                    className="text-xl sm:text-2xl font-black"
                    style={{ color: heroText }}>
                    {reservationDate.toLocaleTimeString(localeTag, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mt-0.5"
                    style={{ color: heroTextMuted }}>
                    {t("reservation_detail.hero.time_label")}
                  </p>
                </div>
                <div
                  className="w-px h-10 sm:h-12"
                  style={{ background: heroBorder }}
                />
                <div className="text-center">
                  <p
                    className="text-xl sm:text-2xl font-black"
                    style={{ color: heroText }}>
                    {detail.numberOfGuests}
                  </p>
                  <p
                    className="text-xs font-bold uppercase tracking-wider mt-0.5"
                    style={{ color: heroTextMuted }}>
                    {t("reservation_detail.hero.guests_label")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-start lg:justify-end gap-1.5 w-full lg:w-auto">
                {detail.tables.map((tbl) => (
                  <span
                    key={tbl.id}
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{
                      background: hasTenantHeroBanner
                        ? "rgba(15,23,42,0.52)"
                        : "var(--primary-soft)",
                      color: hasTenantHeroBanner ? "#E2E8F0" : "var(--primary)",
                      border: `1px solid ${hasTenantHeroBanner ? "rgba(148,163,184,0.4)" : "var(--primary-border)"}`,
                      backdropFilter: hasTenantHeroBanner
                        ? "blur(6px)"
                        : undefined,
                    }}>
                    {tbl.code} · {tbl.floorName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Share URL */}
        <div
          className="mb-6 rounded-2xl p-3 sm:p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl shrink-0"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                style={{ color: "var(--primary)" }}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.5-1.5M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.5 1.5"
                />
              </svg>
              <span
                className="text-[11px] font-bold uppercase"
                style={{ color: "var(--text-muted)" }}>
                {t("reservation_detail.share.label")}
              </span>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <input
                value={reservationShareUrl}
                readOnly
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-xs md:text-sm font-medium"
                style={{
                  background: "var(--bg-base)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                }}
              />
              <button
                onClick={handleCopyReservationUrl}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase shrink-0 transition-all hover:brightness-110"
                style={{
                  background: "var(--primary)",
                  color: "var(--on-primary)",
                }}>
                {t("reservation_detail.share.copy")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* ── Left Column (7/12) ─────────────────────────────────────────── */}
          <div className="xl:col-span-7 space-y-5 md:space-y-8 reservation-section-animate">
            {/* Status Timeline */}
            {detail.status.code !== "CANCELLED" && (
              <div
                className="rounded-2xl p-4 sm:p-6"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.timeline.title")}
                </p>
                <BookingProgressBar
                  steps={allSteps.map((step) => ({
                    ...step,
                    name:
                      step.name ||
                      t(
                        `reservation_detail.timeline.${(step.code || "").toLowerCase()}`,
                      ),
                  }))}
                  currentIndex={currIdx}
                  ariaLabel={t("reservation_detail.timeline.title")}
                />
              </div>
            )}

            {/* Customer Info */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em]"
                    style={{ color: "var(--text-muted)" }}>
                    {t("reservation_detail.customer.title")}
                  </p>
                  <h3
                    className="text-xl font-black mt-1"
                    style={{ color: "var(--text)" }}>
                    {detail.contact.name}
                  </h3>
                </div>
                {!detail.contact.isGuest && detail.contact.membershipLevel && (
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    style={{
                      background:
                        "color-mix(in srgb, var(--gold) 12%, transparent)",
                      color: "var(--gold)",
                      border:
                        "1px solid color-mix(in srgb, var(--gold) 25%, transparent)",
                    }}>
                    {detail.contact.membershipLevel}
                  </span>
                )}
              </div>
              <InfoRow
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                }
                label={t("reservation_detail.customer.phone")}
                value={detail.contact.phone}
              />
              <InfoRow
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                }
                label={t("reservation_detail.customer.email")}
                value={detail.contact.email ?? "—"}
              />
              {!detail.contact.isGuest &&
                detail.contact.loyaltyPoints !== null && (
                  <InfoRow
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    }
                    label={t("reservation_detail.customer.loyalty_points")}
                    value={`${detail.contact.loyaltyPoints?.toLocaleString(localeTag) ?? 0} ${t("reservation_detail.customer.points_unit")}`}
                  />
                )}
            </div>

            {/* Booking Details */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em] mb-6"
                style={{ color: "var(--text-muted)" }}>
                {t("reservation_detail.booking.title")}
              </p>
              <InfoRow
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
                label={t("reservation_detail.booking.date_time")}
                value={reservationDate.toLocaleString(localeTag, {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <InfoRow
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
                label={t("reservation_detail.booking.guests")}
                value={`${detail.numberOfGuests} ${t("reservation_detail.booking.guests_unit")}`}
              />
              <InfoRow
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M3 14h18M10 6v12M14 6v12"
                    />
                  </svg>
                }
                label={t("reservation_detail.booking.tables")}
                value={detail.tables
                  .map((tbl) => `${tbl.code} (${tbl.floorName})`)
                  .join(", ")}
              />
              {detail.specialRequests && (
                <div
                  className="mt-4 rounded-xl p-4 flex items-start gap-3"
                  style={{
                    background: "var(--surface)",
                    border: "1px dashed var(--border)",
                  }}>
                  <svg
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "var(--primary)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.15em] mb-1"
                      style={{ color: "var(--text-muted)" }}>
                      {t("reservation_detail.booking.special_requests")}
                    </p>
                    <p
                      className="text-sm italic leading-relaxed"
                      style={{ color: "var(--text)" }}>
                      &ldquo;{detail.specialRequests}&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Floor Map */}
            <TableMapCard
              detail={detail}
              relatedOrders={relatedOrders}
              viewMode={viewMode}
            />

            {/* Admin note + edit */}
            {!isCustomer && (
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
                      }}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text)" }}>
                        {t("reservation_detail.admin_note.title")}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.admin_note.description")}
                      </p>
                    </div>
                  </div>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      disabled={isEditLocked}
                      className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--primary-soft)",
                        color: "var(--primary)",
                        border: "1px solid var(--primary-border)",
                      }}
                      title={
                        isEditLocked
                          ? t("reservation_detail.edit.locked_status")
                          : undefined
                      }>
                      {t("reservation_detail.edit.edit_btn")}
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: "var(--surface)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}>
                        {t("reservation_detail.edit.cancel_btn")}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit || isEditLocked}
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: "var(--primary)",
                          color: "var(--on-primary)",
                        }}>
                        {savingEdit && (
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {t("reservation_detail.edit.save_btn")}
                      </button>
                    </div>
                  )}
                </div>

                {isEditLocked && (
                  <div
                    className="mb-4 rounded-lg px-3 py-2 text-xs font-semibold"
                    style={{
                      background: "var(--surface)",
                      color: "var(--text-muted)",
                      border: "1px dashed var(--border)",
                    }}>
                    {t("reservation_detail.edit.locked_status")}
                  </div>
                )}

                {isEditing && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.edit.date_time")}
                      </span>
                      <input
                        type="datetime-local"
                        value={editDateTime}
                        onChange={(e) => setEditDateTime(e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.edit.guests")}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={editGuests}
                        onChange={(e) =>
                          setEditGuests(Number(e.target.value) || 1)
                        }
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </label>

                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}>
                        {t("reservation_detail.edit.special_requests")}
                      </span>
                      <textarea
                        value={editSpecialRequests}
                        onChange={(e) => setEditSpecialRequests(e.target.value)}
                        rows={3}
                        className="px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column (5/12) ─────────────────────────────────────────── */}
          <div
            className="xl:col-span-5 space-y-4 md:space-y-6 reservation-section-animate"
            style={{ animationDelay: "0.1s" }}>
            {/* Confirmation Code */}
            <div
              className="rounded-2xl p-[1px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 30%, transparent))",
                boxShadow: "0 0 40px var(--primary-glow)",
              }}>
              <div
                className="rounded-2xl p-5 sm:p-8 text-center relative overflow-hidden"
                style={{ background: "var(--card)" }}>
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
                  style={{
                    background: "var(--primary)",
                    opacity: 0.05,
                    filter: "blur(30px)",
                  }}
                />
                <p
                  className="text-[10px] font-black uppercase tracking-[0.3em] mb-3"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.code.label")}
                </p>
                <div className="reservation-code-display mx-auto mb-3">
                  <span className="reservation-code-text">
                    #{detail.confirmationCode}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.code.description")}
                </p>
              </div>
            </div>

            {/* Order Section */}
            <OrderPanel
              orders={relatedOrders}
              isCustomer={isCustomer}
              onOrderNow={isCustomer ? handleOpenPreOrderPopup : undefined}
              isOrderingNow={isPreOrdering}
            />

            {isCustomer && (
              <MenuPreOrder
                open={isPreOrderPopupOpen}
                submitting={isPreOrdering}
                onClose={() => {
                  if (isPreOrdering) return;
                  setIsPreOrderPopupOpen(false);
                }}
                onConfirm={handleCreatePreOrder}
              />
            )}

            {/* Deposit Status */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-black mb-2"
                    style={{ color: "var(--text-muted)" }}>
                    {t("reservation_detail.deposit.label")}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: detail.depositPaid
                          ? "var(--success)"
                          : "var(--warning)",
                        boxShadow: detail.depositPaid
                          ? "0 0 8px var(--success)"
                          : "none",
                      }}
                    />
                    <p
                      className="text-lg font-black"
                      style={{ color: "var(--text)" }}>
                      {formatVND(detail.depositAmount)}
                    </p>
                  </div>
                </div>
                <div className="w-full flex flex-wrap items-stretch gap-2">
                  {isCustomer && (
                    <button
                      id="pay-deposit-btn"
                      onClick={handlePayDeposit}
                      disabled={depositLoading || !isDepositPaymentAllowed}
                      className="flex-1 min-w-[180px] h-11 px-4 rounded-xl text-[11px] font-black uppercase transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
                      style={{
                        background: isDepositPaymentAllowed
                          ? "var(--success)"
                          : "var(--surface)",
                        color: isDepositPaymentAllowed
                          ? "#fff"
                          : "var(--text-muted)",
                        border: isDepositPaymentAllowed
                          ? "none"
                          : "1px solid var(--border)",
                      }}>
                      {depositLoading ? (
                        <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      )}
                      {depositLoading
                        ? t("reservation_detail.deposit.creating_link")
                        : t("reservation_detail.deposit.pay_now")}
                    </button>
                  )}
                  {!isDepositPaymentAllowed && (
                    <span
                      className="flex-1 min-w-[180px] h-11 px-4 rounded-xl text-[11px] font-black uppercase whitespace-nowrap cursor-default inline-flex items-center justify-center"
                      style={{
                        background: "var(--surface)",
                        color: detail.depositPaid
                          ? "var(--success)"
                          : "var(--danger)",
                        border: `1px solid ${detail.depositPaid ? "var(--success-border)" : "var(--danger-border)"}`,
                      }}>
                      {detail.depositPaid
                       
                        ? t("reservation_detail.deposit.status_paid")
                        : isCancelledByDeadline
                          ? t("reservation_detail.deposit.deadline_cancel_desc")
                         
                        : t("reservation_detail.deposit.status_unpaid")}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: detail.depositPaid ? "100%" : "20%",
                      background: detail.depositPaid
                        ? "var(--success)"
                        : "var(--warning)",
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-muted)" }}>
                  {detail.depositPaid
                    ? t("reservation_detail.deposit.paid_desc")
                    : isCancelledByDeadline
                      ? t("reservation_detail.deposit.deadline_cancel_desc")
                      : isDepositDeadlinePassed
                        ? t("reservation_detail.deposit.deadline_passed_desc")
                        : t("reservation_detail.deposit.unpaid_desc")}
                </p>

                {hasDepositDeadline && (
                  <p
                    className="text-xs mt-1"
                    style={{
                      color: isDepositDeadlinePassed
                        ? "var(--danger)"
                        : "var(--text-muted)",
                    }}>
                    {t("reservation_detail.deposit.deadline")}:{" "}
                    {depositDeadlineDate?.toLocaleString(localeTag)}
                  </p>
                )}

                {isCustomer && detail.checkoutUrl && !detail.depositPaid && (
                  <a
                    href={detail.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex mt-2 text-xs font-semibold break-all"
                    style={{ color: "var(--primary)" }}>
                    {t("reservation_detail.deposit.open_checkout")}
                  </a>
                )}
              </div>
            </div>

            {/* Table Preview */}
            {panoramaImage && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}>
                <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ color: "var(--text-muted)" }}>
                      {t("reservation_detail.booking.table_preview_title")}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}>
                      {t("reservation_detail.booking.table_preview_desc")}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0"
                    style={{
                      background: "var(--surface)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}>
                    {t("reservation_detail.booking.table_label", {
                      code: panoramaImage.tableCode,
                    })}
                  </span>
                </div>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}>
                    <img
                      src={panoramaImage.imageUrl}
                      alt={t("reservation_detail.booking.table_preview_alt", {
                        code: panoramaImage.tableCode,
                      })}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[21/8] object-cover"
                    />
                  </div>
                </div>
                <TablePreview3DModal
                  open={is3DModalOpen}
                  table={
                    panoramaImage
                      ? {
                          id: panoramaImage.tableId,
                          tenantId: tenant?.id || "default",
                          name: panoramaImage.tableCode,
                          seats:
                            detail?.tables?.find(
                              (t) => t.id === panoramaImage.tableId,
                            )?.capacity || 0,
                          status: "AVAILABLE" as const,
                          area:
                            detail?.tables?.find(
                              (t) => t.id === panoramaImage.tableId,
                            )?.floorName || "",
                          position: { x: 0, y: 0 },
                          shape: "Rectangle" as const,
                          width: 100,
                          height: 100,
                          rotation: 0,
                          zoneId: "",
                        }
                      : null
                  }
                  tableImageUrl={panoramaImage.imageUrl}
                  onClose={() => setIs3DModalOpen(false)}
                  onBookNow={() => setIs3DModalOpen(false)}
                />
              </div>
            )}

            {/* Location */}
            {tenantAddress && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}>
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                    }}>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    {tenant?.businessName && (
                      <p
                        className="text-sm font-bold mb-0.5"
                        style={{ color: "var(--text)" }}>
                        {tenant.businessName}
                      </p>
                    )}
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--text-muted)" }}>
                      {tenantAddress}
                    </p>
                    <a
                      href={mapSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold mt-2 transition-all"
                      style={{ color: "var(--primary)" }}>
                      {t("reservation_detail.help.get_directions")}
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}>
                    <iframe
                      title={t("reservation_detail.location.map_title")}
                      src={mapEmbedUrl}
                      className="w-full h-56 sm:h-64"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}>
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em] mb-4"
                style={{ color: "var(--text-muted)" }}>
                {t("reservation_detail.meta.title")}
              </p>
              <div
                className="flex justify-between items-center py-2 gap-4"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.meta.tables_count")}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--text)" }}>
                  {detail.tables.length}
                </span>
              </div>
              <div className="flex justify-between items-start sm:items-center pt-3 gap-4">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}>
                  {t("reservation_detail.booking.last_updated")}
                </span>
                <span
                  className="text-xs font-semibold text-right"
                  style={{ color: "var(--text-muted)" }}>
                  {new Date(detail.updatedAt).toLocaleString(localeTag)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
