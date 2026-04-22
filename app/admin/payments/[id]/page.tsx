"use client";

import paymentService, { PaymentDetail } from "@/lib/services/paymentService";
import { formatVND } from "@/lib/utils/currency";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const STATUS_COLOR: Record<number, string> = {
  0: "#f97316",
  1: "#22c55e",
  2: "#ef4444",
  3: "#6b7280",
};

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
      {highlight ? (
        <div className="mt-1 inline-flex rounded border px-2 py-0.5 text-xs font-semibold"
          style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "var(--surface)" }}>
          {value}
        </div>
      ) : (
        <div className="mt-1 break-all font-medium" style={{ color: "var(--text)" }}>{value}</div>
      )}
    </div>
  );
}

function MoneyItem({ label, value, isPrimary }: { label: string; value?: number; isPrimary?: boolean }) {
  return (
    <div className="rounded-lg border px-3 py-2"
      style={isPrimary
        ? { borderColor: "var(--primary)", background: "var(--surface)", boxShadow: "0 0 0 1px var(--primary)" }
        : { borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className={`text-xs ${isPrimary ? "font-medium" : ""}`}
        style={{ color: isPrimary ? "var(--primary)" : "var(--text-muted)" }}>{label}</div>
      <div className={`mt-1 ${isPrimary ? "font-bold text-base" : "font-semibold"}`}
        style={{ color: isPrimary ? "var(--primary)" : "var(--text)" }}>
        {formatVND(value ?? 0)}
      </div>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await paymentService.getPaymentById(id);
        setPayment(data);
      } catch (err) {
        const msg = extractApiErrorMessage(err, tRef.current("payments.detail.load_error"));
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColor = STATUS_COLOR[payment?.status ?? -1] ?? "var(--text-muted)";

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              {t("payments.detail.title")}
            </h1>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}>
            ← {t("admin.order_detail.actions.back")}
          </button>
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 w-full animate-pulse rounded-xl" style={{ background: "var(--surface)" }} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        )}

        {!loading && payment && (
          <>
            {/* Payment Info */}
            <section className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
                {t("payments.detail.payment_info")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem label={t("payments.columns.method")} value={payment.paymentMethodId} />
                <InfoItem label={t("payments.columns.status")} value={payment.statusName || "—"} highlight />
                <InfoItem label={t("payments.columns.purpose")} value={payment.purposeName || "—"} />
                <InfoItem label={t("payments.columns.date")} value={payment.paymentDate ? new Date(payment.paymentDate).toLocaleString("vi-VN") : "—"} />
                {payment.payOSOrderCode && (
                  <InfoItem label="PayOS Order Code" value={String(payment.payOSOrderCode)} />
                )}
                {payment.transactionId && (
                  <InfoItem label="Transaction ID" value={payment.transactionId} />
                )}
              </div>

            </section>

            {/* Customer Info */}
            {payment.customer && (
              <section className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
                  {t("payments.detail.customer_info")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <InfoItem label={t("customers.list.headers.customer")} value={payment.customer.fullName} />
                  <InfoItem label={t("customers.list.headers.contact")} value={payment.customer.phone || payment.customer.email || "—"} />
                  <InfoItem label={t("customers.list.headers.rank")} value={payment.customer.membershipLevel || "—"} highlight />
                  <InfoItem label={t("customers.list.headers.points")} value={String(payment.customer.loyaltyPoints ?? 0)} />
                </div>
              </section>
            )}

            {/* Order Info */}
            {payment.order && (
              <section className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                    {t("payments.detail.order_info")}
                  </h2>
                  {payment.orderId && (
                    <Link href={`/admin/orders/${payment.orderId}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium transition hover:opacity-80"
                      style={{ background: "var(--primary-soft)", color: "var(--primary)", border: "1px solid var(--primary-border)" }}>
                      {t("payments.detail.view_order")} →
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <InfoItem label={t("dashboard.orders.table.order")} value={payment.order.reference || payment.order.id.slice(0, 8)} highlight />
                </div>

                {/* Items table */}
                {payment.order.items && payment.order.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                          <th className="px-2 py-2 text-left">{t("admin.order_detail.table_headers.dish_name")}</th>
                          <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.quantity")}</th>
                          <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.price")}</th>
                          <th className="px-2 py-2 text-center">{t("admin.order_detail.table_headers.status")}</th>
                          <th className="px-2 py-2 text-left">{t("admin.order_detail.table_headers.note")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payment.order.items.map((item) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td className="px-2 py-2 font-medium" style={{ color: "var(--text)" }}>{item.dishName}</td>
                            <td className="px-2 py-2 text-center" style={{ color: "var(--text-muted)" }}>{item.quantity}</td>
                            <td className="px-2 py-2 text-center font-semibold" style={{ color: "var(--primary)" }}>
                              {formatVND(item.price * item.quantity)}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                                {item.itemStatus || "—"}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-sm" style={{ color: "var(--text-muted)" }}>{item.note || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Order totals */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MoneyItem label={t("admin.order_detail.money.subtotal")} value={payment.order.subTotal} />
                  <MoneyItem label={t("admin.order_detail.money.discount")} value={payment.order.discountAmount} />
                  <MoneyItem label={t("admin.order_detail.money.tax")} value={payment.order.taxAmount} />
                  <MoneyItem label={t("admin.order_detail.money.total")} value={payment.order.totalAmount} isPrimary />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
