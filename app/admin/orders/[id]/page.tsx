"use client";

import menuService from "@/lib/services/menuService";
import orderService from "@/lib/services/orderService";
import { tableService } from "@/lib/services/tableService";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  tableSessions?: unknown[];
  tableIds?: string[];
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
  reservation?: unknown;
  orderDetails?: Array<{
    id: string;
    dishId: string;
    quantity: number;
    note?: string | null;
    status?: string | null;
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

const getStatusTextById = (
  t: (key: string, options?: Record<string, unknown>) => string,
): Record<number, string> => ({
  0: t("admin.order_detail.status.pending"),
  1: t("admin.order_detail.status.serving"),
  2: t("admin.order_detail.status.completed"),
  3: t("admin.order_detail.status.cancelled"),
});

export default function AdminOrderDetailPage() {
  const { t } = useTranslation("common");
  const params = useParams<{ id: string }>();
  const orderId = useMemo(() => params?.id ?? "", [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetailsResponse | null>(null);
  const [tableCode, setTableCode] = useState<string>("-");
  const [dishInfoById, setDishInfoById] = useState<
    Record<string, { name: string; price: number }>
  >({});
  const statusTextById = useMemo(() => getStatusTextById(t), [t]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      setLoading(true);
      setError(null);

      try {
        const data = (await orderService.getOrderById(orderId)) as OrderDetailsResponse;
        setOrder(data);

        if (data.tableId) {
          try {
            const table = await tableService.getTableById(data.tableId);
            setTableCode(table?.code || data.tableId);
          } catch {
            setTableCode(data.tableId);
          }
        } else {
          setTableCode("-");
        }

        const details = data.orderDetails ?? [];
        const uniqueDishIds = Array.from(
          new Set(details.map((item) => item.dishId).filter(Boolean)),
        );
        const dishMap: Record<string, { name: string; price: number }> = {};

        await Promise.all(
          uniqueDishIds.map(async (dishId) => {
            try {
              const dish = await menuService.getDishById(dishId);
              dishMap[dishId] = {
                name: dish.name,
                price: Number(dish.price ?? 0),
              };
            } catch {
              dishMap[dishId] = {
                name: dishId,
                price: 0,
              };
            }
          }),
        );

        setDishInfoById(dishMap);
      } catch (err) {
        console.error("Failed to fetch order details by id:", err);
        setError(t("admin.order_detail.messages.load_error"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, t]);

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              {t("admin.order_detail.title")}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {order?.reference
                ? t("admin.order_detail.reference", { reference: order.reference })
                : t("admin.order_detail.id", { id: orderId })}
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-lg border px-4 py-2 text-sm font-medium transition"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            {t("admin.order_detail.back_to_list")}
          </Link>
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
              className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <InfoItem label={t("admin.order_detail.fields.order_status")} value={statusTextById[order.orderStatusId ?? 0] ?? String(order.orderStatusId ?? "-")} />
              <InfoItem label={t("admin.order_detail.fields.payment_status")} value={order.paymentStatusName ?? String(order.paymentStatus ?? order.paymentStatusId ?? "-")} />
              <InfoItem label={t("admin.order_detail.fields.table")} value={tableCode} />
              <InfoItem label={t("admin.order_detail.fields.reservation")} value={order.reservationId || "-"} />
              <InfoItem label={t("admin.order_detail.fields.handled_by")} value={order.handledBy || "-"} />
              <InfoItem label={t("admin.order_detail.fields.completed_at")} value={formatDateTime(order.completedAt)} />
              <InfoItem label={t("admin.order_detail.fields.cancelled_at")} value={formatDateTime(order.cancelledAt)} />
              <InfoItem label={t("admin.order_detail.fields.item_count")} value={String(order.orderDetails?.length ?? 0)} />
            </section>

            <section
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--text)" }}>
                {t("admin.order_detail.sections.order_details")}
              </h2>
              {order.orderDetails && order.orderDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                        <th className="px-2 py-2 text-left">{t("admin.order_detail.table_headers.dish_name")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.quantity")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.price")}</th>
                        <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.orderDetails.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="px-2 py-2">
                            {dishInfoById[item.dishId]?.name ?? item.dishId}
                          </td>
                          <td className="px-2 py-2 text-center">{item.quantity}</td>
                          <td className="px-2 py-2 text-center">
                            {formatCurrency(
                              (dishInfoById[item.dishId]?.price ?? 0) *
                                Number(item.quantity ?? 0),
                            )}
                          </td>
                          <td className="px-2 py-2 text-center">{item.status ?? "-"}</td>
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
                {t("admin.order_detail.sections.total")}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5 text-sm">
                <MoneyItem label={t("admin.order_detail.money.sub_total")} value={order.subTotal} />
                <MoneyItem label={t("admin.order_detail.money.discount")} value={order.discountAmount} />
                <MoneyItem label={t("admin.order_detail.money.tax")} value={order.taxAmount} />
                <MoneyItem label={t("admin.order_detail.money.service_charge")} value={order.serviceCharge} />
                <MoneyItem label={t("admin.order_detail.money.total")} value={order.totalAmount} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-1 break-all font-medium" style={{ color: "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

function MoneyItem({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-1 font-semibold" style={{ color: "var(--text)" }}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}
