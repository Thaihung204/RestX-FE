"use client";

import CancelDishConfirm from "@/components/admin/orders/CancelDishConfirm";
import orderDetailStatusService, { OrderDetailStatus } from "@/lib/services/orderDetailStatusService";
import orderService from "@/lib/services/orderService";
import orderSignalRService from "@/lib/services/orderSignalRService";
import orderStatusService, { OrderStatus } from "@/lib/services/orderStatusService";
import { TenantConfig, tenantService } from "@/lib/services/tenantService";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import { HubConnectionState } from "@microsoft/signalr";
import { message } from "antd";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MenuSelectionModal from "../../../../components/admin/orders/MenuSelectionModal";

interface ReservationTable {
  id: string;
  code: string;
  capacity?: number;
  floorId?: string;
  floorName?: string;
}

interface ReservationInfo {
  id: string;
  confirmationCode?: string;
  tables?: ReservationTable[];
  reservationDateTime?: string;
  numberOfGuests?: number;
  contactName?: string;
  contactPhone?: string;
  status?: { code?: string; name?: string } | null;
  depositAmount?: number;
  paymentDeadline?: string | null;
  createdAt?: string;
}

interface OrderDetailsResponse {
  id: string;
  reference?: string | null;
  tableId?: string | null;
  customerId?: string | null;
  reservationId?: string | null;
  orderStatusId?: number;
  paymentStatus?: number;
  paymentStatusId?: number;
  paymentStatusName?: string | null;
  subTotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  totalAmount?: number;
  completedAt?: string | null;
  cancelledAt?: string | null;
  handledBy?: string | null;
  createdDate?: string | null;
  customer?: {
    id?: string;
    membershipLevel?: string;
    loyaltyPoints?: number;
    isActive?: boolean;
    createdDate?: string;
    modifiedDate?: string;
    userId?: string;
    email?: string | null;
    fullName?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    totalOrders?: number;
    totalReservations?: number;
  } | null;
  reservation?: ReservationInfo | null;
  orderDetails?: Array<{
    id: string;
    dishId: string;
    dishName?: string | null;
    dishPrice?: number;
    quantity: number;
    note?: string | null;
    status?: string | null;
    orderId?: string;
    createdDate?: string;
  }>;
  tableSessions?: Array<{
    id?: string;
    tableId?: string;
    tableCode?: string;
  }>;
}

const formatCurrency = (amount?: number | null) =>
  Number(amount ?? 0).toLocaleString("vi-VN") + "đ";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

export default function AdminOrderDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = useMemo(() => params?.id ?? "", [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetailsResponse | null>(null);

  const [availableStatuses, setAvailableStatuses] = useState<OrderDetailStatus[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<{ detailId: string; dishName: string; newStatusId: number } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const inFlightRef = useRef(false);
  const lastFetchRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const [detailStatuses, statuses] = await Promise.all([
          orderDetailStatusService.getAllStatuses(),
          orderStatusService.getAllStatuses(),
        ]);
        setAvailableStatuses(detailStatuses);
        setOrderStatuses(statuses);
      } catch (err) {
        console.error("Failed to load available statuses", err);
      }
    };
    fetchStatuses();
  }, []);

  const handleDetailStatusChange = async (detailId: string, newStatusId: number, dishName?: string) => {
    if (!orderId) return;
    const cancelStatus = availableStatuses.find(
      (s) => s.code?.toLowerCase() === "cancelled" || s.name?.toLowerCase() === "cancelled",
    );
    if (cancelStatus && String(newStatusId) === cancelStatus.id) {
      setCancelConfirm({ detailId, dishName: dishName ?? "", newStatusId });
      return;
    }
    try {
      await orderService.updateOrderDetailStatus(orderId, detailId, newStatusId);
    } catch (err: unknown) {
      console.error("Failed to update status", err);
      const errorMsg = extractApiErrorMessage(
        err,
        t("admin.order_detail.messages.update_error"),
      );
      message.error(errorMsg);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelConfirm || !orderId) return;
    setIsCancelling(true);
    try {
      await orderService.updateOrderDetailStatus(orderId, cancelConfirm.detailId, cancelConfirm.newStatusId);
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orderDetails: (prev.orderDetails ?? []).map((d) =>
            d.id === cancelConfirm.detailId ? { ...d, status: "Cancelled" } : d,
          ),
        };
      });
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(err, t("admin.order_detail.messages.update_error"));
      message.error(errorMsg);
    } finally {
      setIsCancelling(false);
      setCancelConfirm(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTenant = async () => {
      try {
        const host = window.location.host;
        const hostWithoutPort = host.includes(":") ? host.split(":")[0] : host;

        if (hostWithoutPort === "admin.restx.food") return;

        if (
          hostWithoutPort === "admin.localhost" ||
          hostWithoutPort === "localhost" ||
          hostWithoutPort === "127.0.0.1"
        ) {
          const data = await tenantService.getTenantConfig("demo.restx.food");
          if (isMounted) setTenant(data || null);
          return;
        }

        if (hostWithoutPort.endsWith(".localhost")) {
          const subdomain = hostWithoutPort.replace(".localhost", "");
          const tenantHost =
            subdomain && subdomain !== "admin"
              ? `${subdomain}.restx.food`
              : "demo.restx.food";
          const data = await tenantService.getTenantConfig(tenantHost);
          if (isMounted) setTenant(data || null);
          return;
        }

        if (!hostWithoutPort.startsWith("admin.")) {
          const data = await tenantService.getTenantConfig(hostWithoutPort);
          if (isMounted) setTenant(data || null);
        }
      } catch (error) {
        console.error("Failed to resolve tenant for admin order details:", error);
      }
    };
    fetchTenant();
    return () => { isMounted = false; };
  }, []);

  const loadOrderDetails = useCallback(async (showLoading = true) => {
    if (!orderId) return;
    if (inFlightRef.current) return;
    
    const now = Date.now();
    if (lastFetchRef.current && now - lastFetchRef.current < 2000) return;
    lastFetchRef.current = now;

    inFlightRef.current = true;
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = (await orderService.getOrderById(orderId)) as OrderDetailsResponse;
      setOrder(data);
    } catch (err: unknown) {
      console.error("Failed to fetch order details by id:", err);
      const errorMsg = extractApiErrorMessage(
        err,
        t("admin.order_detail.messages.load_error"),
      );
      setError(errorMsg);
    } finally {
      if (showLoading) setLoading(false);
      inFlightRef.current = false;
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails().catch(console.error);
  }, [loadOrderDetails]);

  useEffect(() => {
    if (!tenant?.id || !orderId) return;

    let isMounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const handleOrderChange = (payload: any) => {
      if (!isMounted) return;
      const changedTenantId = payload?.tenantId || payload?.order?.tenantId;
      if (changedTenantId && changedTenantId !== tenant.id) return;
      
      const changedOrderId = payload?.orderId || payload?.order?.id || payload?.id;
      if (changedOrderId && changedOrderId !== orderId) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isMounted) return;
        loadOrderDetails(false);
      }, 300);
    };

    const events = ["orders.created", "orders.updated", "orders.deleted"];

    const setupSignalR = async () => {
      try {
        await orderSignalRService.start();

        const conn = orderSignalRService.getConnection();
        if (conn.state === HubConnectionState.Connected) {
          await orderSignalRService.invoke("JoinTenantGroup", tenant.id);
          events.forEach((event) =>
            orderSignalRService.on(event, handleOrderChange),
          );
        }
      } catch (error) {
        console.error("SignalR: Setup failed", error);
      }
    };

    setupSignalR();

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      events.forEach((event) =>
        orderSignalRService.off(event, handleOrderChange),
      );
      orderSignalRService.invoke("LeaveTenantGroup", tenant.id).catch(() => {});
    };
  }, [tenant?.id, orderId, loadOrderDetails]);

  return (
    <>
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              {t("admin.order_detail.title")}
            </h1>
            {/* <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {order?.reference
                ? t("admin.order_detail.reference", { reference: order.reference })
                : t("admin.order_detail.id", { id: orderId })}
            </p> */}
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            ← {t("admin.order_detail.actions.back")}
          </button>
        </div>

        {loading ? (
          <div
            className="w-full rounded-xl animate-pulse"
            style={{ background: "var(--surface)", height: 260 }}
          />
        ) : error ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}>
            {error}
          </div>
        ) : !order ? (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {t("admin.order_detail.messages.not_found")}
          </div>
        ) : (
          <>
            <section
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
                {t("admin.order_detail.sections.customer")}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
                <InfoItem label={t("admin.order_detail.customer.full_name")} value={order.customer?.fullName || "-"} />
                <InfoItem label={t("admin.order_detail.customer.phone")} value={order.customer?.phoneNumber || "-"} />
                <InfoItem label={t("admin.order_detail.customer.membership")} value={order.customer?.membershipLevel || "-"} />
                <InfoItem label={t("admin.order_detail.customer.loyalty_points")} value={String(order.customer?.loyaltyPoints ?? 0)} />
                <InfoItem label={t("admin.order_detail.customer.total_orders")} value={String(order.customer?.totalOrders ?? 0)} />
                <InfoItem label={t("admin.order_detail.customer.total_reservations")} value={String(order.customer?.totalReservations ?? 0)} />
              </div>
            </section>

            <section
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
                {t("admin.order_detail.sections.order_info")}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
                <InfoItem label={t("admin.order_detail.order_info.reference")} value={order.reference || "-"} />
                <InfoItem label={t("admin.order_detail.order_info.created_date")} value={formatDateTime(order.createdDate)} />
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("admin.order_detail.order_info.status")}
                  </div>
                  <select
                    className="mt-1 w-full max-w-[150px] rounded-md border p-1 text-xs font-semibold"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    value={order.orderStatusId ?? ""}
                    onChange={async (e) => {
                      if (!orderId || !e.target.value) return;
                      try {
                        await orderService.updateOrderStatus(orderId, Number(e.target.value));
                      } catch (err: unknown) {
                        console.error("Failed to update order status", err);
                        const errorMsg = extractApiErrorMessage(
                          err,
                          t("admin.order_detail.messages.update_error"),
                        );
                        message.error(errorMsg);
                      }
                    }}
                  >
                    {orderStatuses.map((status) => (
                      <option key={status.id} value={Number(status.id)}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
                {t("admin.order_detail.sections.reservation")}
              </h2>
              {order.reservation ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
                  {/* <InfoItem label={t("admin.order_detail.fields.reservation")} value={order.reservation.id || "-"} /> */}
                  <InfoItem label={t("admin.order_detail.reservation.confirmation_code")} value={order.reservation.confirmationCode || "-"} />
                  <InfoItem label={t("admin.order_detail.reservation.date_time")} value={formatDateTime(order.reservation.reservationDateTime)} />
                  <InfoItem label={t("admin.order_detail.reservation.guests")} value={String(order.reservation.numberOfGuests ?? 0)} />
                  {/* <InfoItem label={t("admin.order_detail.reservation.contact_name")} value={order.reservation.contactName || "-"} /> */}
                  {/* <InfoItem label={t("admin.order_detail.reservation.contact_phone")} value={order.reservation.contactPhone || "-"} /> */}
                  <InfoItem
                    label={t("admin.order_detail.reservation.tables")}
                    value={
                      order.reservation.tables?.length
                        ? order.reservation.tables.map((tb) => tb.code).join(" - ")
                        : "-"
                    }
                    highlight
                  />
                  <InfoItem
                    label={t("admin.order_detail.reservation.deposit_amount")}
                    value={formatCurrency(order.reservation.depositAmount)}
                    highlight
                  />
                  <InfoItem label={t("admin.order_detail.reservation.created_at")} value={formatDateTime(order.reservation.createdAt)} />
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.order_detail.messages.no_reservation")}
                </p>
              )}
            </section>

            <section
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                  {t("admin.order_detail.sections.order_details")}
                </h2>
                {!(order.paymentStatusName?.toLowerCase() === "success") && (
                  <button
                    type="button"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:opacity-80"
                    style={{ backgroundColor: "var(--primary)", color: "white" }}
                    onClick={() => setIsAddMenuOpen(true)}
                  >
                    + {t("admin.order_detail.actions.add_dish")}
                  </button>
                )}
              </div>
              {order.orderDetails && order.orderDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        <th className="px-2 py-2 text-left">{t("admin.order_detail.table_headers.dish_name")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.quantity")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.price")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.status")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.created_at")}</th>
                        <th className="px-2 py-2 text-left">{t("admin.order_detail.table_headers.note")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderDetails.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="px-2 py-2">{item.dishName || item.dishId}</td>
                          <td className="px-2 py-2 text-center">{item.quantity}</td>
                          <td className="px-2 py-2 text-center">
                            {formatCurrency((item.dishPrice ?? 0) * Number(item.quantity ?? 0))}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {availableStatuses.length > 0 ? (
                                <select
                                  className="w-full rounded-md border p-1 text-xs"
                                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                                  value={availableStatuses.find(s => s.name === item.status)?.id ?? ""}
                                  disabled={item.status?.toLowerCase() === "cancelled"}
                                  onChange={(e) => {
                                    if (e.target.value && item.id) {
                                      handleDetailStatusChange(item.id, Number(e.target.value), item.dishName ?? undefined);
                                    }
                                  }}
                                >
                                  <option value="" disabled>-</option>
                                  {availableStatuses.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                            ) : (
                              item.status ?? "-"
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">{formatDateTime(item.createdDate)}</td>
                          <td className="px-2 py-2">{item.note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.order_detail.messages.no_items")}
                </p>
              )}

            </section>

            <section
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
                {t("admin.order_detail.sections.payment")}
              </h2>
              <div className="mb-4">
                <InfoItem
                  label={t("admin.order_detail.fields.payment_status")}
                  value={order.paymentStatusName ?? String(order.paymentStatus ?? order.paymentStatusId ?? "-")}
                  highlight
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 text-sm">
                <MoneyItem label={t("admin.order_detail.money.sub_total")} value={order.subTotal} />
                <MoneyItem label={t("admin.order_detail.money.discount")} value={order.discountAmount} />
                <MoneyItem label={t("admin.order_detail.money.tax")} value={order.taxAmount} />
                <MoneyItem label={t("admin.order_detail.money.service_charge")} value={order.serviceCharge} />
                <MoneyItem label={t("admin.order_detail.money.total")} value={order.totalAmount} isPrimary={true} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
      <MenuSelectionModal
        orderId={orderId}
        tableId={order?.tableSessions?.[0]?.tableId || order?.tableId || ""}
        customerId={order?.customerId || undefined}
        isOpen={isAddMenuOpen}
        onClose={() => setIsAddMenuOpen(false)}
        onSuccess={() => loadOrderDetails(false)}
      />
      <CancelDishConfirm
        open={!!cancelConfirm}
        dishName={cancelConfirm?.dishName}
        loading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelConfirm(null)}
      />
    </>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {highlight ? (
        <div 
          className="mt-1 inline-flex rounded border px-2 py-0.5 text-xs font-semibold" 
          style={{ borderColor: "var(--primary, #3b82f6)", color: "var(--primary, #3b82f6)", background: "var(--surface)" }}>
          {value}
        </div>
      ) : (
        <div className="mt-1 break-all font-medium" style={{ color: "var(--text)" }}>
          {value}
        </div>
      )}
    </div>
  );
}

function MoneyItem({
  label,
  value,
  isPrimary,
}: {
  label: string;
  value?: number;
  isPrimary?: boolean;
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2 transition"
      style={isPrimary ? {
        borderColor: "var(--primary, #3b82f6)",
        background: "var(--surface)",
        boxShadow: "0 0 0 1px var(--primary, #3b82f6)"
      } : {
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}>
      <div className={`text-xs ${isPrimary ? 'font-medium' : ''}`} style={{ color: isPrimary ? "var(--primary, #3b82f6)" : "var(--text-muted)" }}>
        {label}
      </div>
      <div className={`mt-1 ${isPrimary ? 'font-bold text-base tracking-tight' : 'font-semibold'}`} style={{ color: isPrimary ? "var(--primary, #3b82f6)" : "var(--text)" }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}
