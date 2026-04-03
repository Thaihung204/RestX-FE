"use client";

import { useTenant } from "@/lib/contexts/TenantContext";
import orderService, { OrderDto } from "@/lib/services/orderService";
import paymentService from "@/lib/services/paymentService";
import reservationService, { ReservationDetail } from "@/lib/services/reservationService";
import { message } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ReservationDetailsViewProps {
  reservationId: string;
  mode: "admin" | "customer";
}

const statusColor: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  CHECKED_IN: "#8b5cf6",
  COMPLETED: "#22c55e",
  CANCELLED: "#ef4444",
};

const currency = (v?: number) => `${(v || 0).toLocaleString("vi-VN")}đ`;

export default function ReservationDetailsView({ reservationId, mode }: ReservationDetailsViewProps) {
  const router = useRouter();
  const { tenant } = useTenant();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [relatedOrders, setRelatedOrders] = useState<OrderDto[]>([]);
  const [depositLoading, setDepositLoading] = useState(false);

  const isCustomer = mode === "customer";

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const d = await reservationService.getReservationById(reservationId);
        if (!mounted) return;
        setDetail(d);

        if (isCustomer) {
          const orders = await orderService.getAllOrders();
          if (!mounted) return;
          setRelatedOrders(orders.filter((o) => o.reservationId === d.id));
        }
      } catch (err) {
        console.error(err);
        if (mounted) setDetail(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [reservationId, isCustomer]);

  const unpaidOrder = useMemo(
    () => relatedOrders.find((o) => o.id && o.paymentStatusId === 0),
    [relatedOrders],
  );

  const firstTableId = detail?.tables?.[0]?.id;

  const handlePayDeposit = async () => {
    if (!unpaidOrder?.id) {
      messageApi.warning("Chưa có order cọc cho reservation này. Vui lòng liên hệ nhân viên để tạo yêu cầu cọc.");
      return;
    }

    try {
      setDepositLoading(true);
      const res = await paymentService.createPaymentLink(unpaidOrder.id);
      if (res.checkoutUrl) {
        window.open(res.checkoutUrl, "_blank", "noopener,noreferrer");
        messageApi.success("Đã mở link thanh toán cọc.");
      } else {
        messageApi.error("Không lấy được link thanh toán.");
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Tạo link thanh toán thất bại.");
    } finally {
      setDepositLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg-base)", color: "var(--text)" }}>
        <p>Không tìm thấy reservation.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg"
          style={{ background: "var(--primary)", color: "var(--on-primary)" }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  const sColor = statusColor[detail.status.code] || "var(--text)";

  return (
    <main className="min-h-screen py-8 px-4 md:px-8" style={{ background: "var(--bg-base)" }}>
      {contextHolder}
      <div className="max-w-6xl mx-auto space-y-6">
        <section
          className="rounded-3xl p-6 md:p-8"
          style={{
            background: "linear-gradient(130deg, color-mix(in srgb, var(--primary) 12%, var(--card)) 0%, var(--card) 55%)",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 45px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: "var(--text-muted)" }}>
                Reservation Details
              </p>
              <h1 className="text-3xl md:text-4xl font-black mt-2" style={{ color: "var(--text)" }}>
                #{detail.confirmationCode}
              </h1>
              <p className="mt-2" style={{ color: "var(--text-muted)" }}>
                Tạo lúc: {new Date(detail.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold border"
                style={{
                  color: sColor,
                  borderColor: `${sColor}55`,
                  background: `${sColor}1A`,
                }}
              >
                {detail.status.name}
              </span>

              <button
                onClick={() => router.back()}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                Quay lại
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Thông tin khách hàng</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Info label="Họ tên" value={detail.contact.name} />
                <Info label="Số điện thoại" value={detail.contact.phone} />
                <Info label="Email" value={detail.contact.email || "—"} />
                <Info label="Loại khách" value={detail.contact.isGuest ? "Khách vãng lai" : "Thành viên"} />
                <Info label="Hạng thành viên" value={detail.contact.membershipLevel || "—"} />
                <Info label="Điểm loyalty" value={detail.contact.loyaltyPoints?.toString() || "—"} />
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Thông tin đặt chỗ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <Info
                  label="Thời gian"
                  value={new Date(detail.reservationDateTime).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
                <Info label="Số người" value={`${detail.numberOfGuests} khách`} />
                <Info label="Bàn / Vị trí" value={detail.tables.map((t) => `${t.code} (${t.floorName})`).join(", ")} />
                <Info label="Đặt cọc" value={currency(detail.depositAmount)} />
                <Info label="Trạng thái cọc" value={detail.depositPaid ? "Đã thanh toán" : "Chưa thanh toán"} />
                <Info label="Check-in" value={detail.checkedInAt ? new Date(detail.checkedInAt).toLocaleString("vi-VN") : "Chưa check-in"} />
              </div>

              {detail.specialRequests && (
                <div className="mt-4 rounded-xl p-4" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
                    Yêu cầu đặc biệt
                  </p>
                  <p className="text-sm italic" style={{ color: "var(--text)" }}>&ldquo;{detail.specialRequests}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Thông tin order</h2>

              {isCustomer ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <Info label="Số order liên quan" value={`${relatedOrders.length}`} />
                    <Info label="Order chưa thanh toán" value={unpaidOrder?.id ? "Có" : "Không"} />
                    <Info label="Tổng tiền order gần nhất" value={currency(relatedOrders[0]?.totalAmount)} />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {firstTableId && (
                      <Link
                        href={`/menu/${firstTableId}`}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
                      >
                        Order món ngay
                      </Link>
                    )}

                    {!detail.depositPaid && (
                      <button
                        onClick={handlePayDeposit}
                        disabled={depositLoading}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "#16a34a", color: "white" }}
                      >
                        {depositLoading ? "Đang tạo link cọc..." : "Đặt cọc trước"}
                      </button>
                    )}
                  </div>

                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Bạn chỉ có quyền xem thông tin reservation. Nếu cần chỉnh sửa, vui lòng liên hệ nhà hàng.
                  </p>
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Trang admin chỉ hiển thị chi tiết để theo dõi và hỗ trợ khách. Các thao tác cập nhật trạng thái vẫn thực hiện ở màn danh sách reservation.
                </p>
              )}
            </div>
          </article>

          <aside className="space-y-6">
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="font-bold mb-3" style={{ color: "var(--text)" }}>Map & Location</h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                {tenant?.businessName || "Nhà hàng"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {tenant?.businessAddressLine1 || "Đang cập nhật địa chỉ"}
              </p>

              {tenant?.businessAddressLine1 && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.businessAddressLine1)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  Xem trên Google Maps
                </a>
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="font-bold mb-3" style={{ color: "var(--text)" }}>Thông tin thêm</h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <li>• Mã xác nhận: #{detail.confirmationCode}</li>
                <li>• Số bàn: {detail.tables.length}</li>
                <li>• Cập nhật lần cuối: {new Date(detail.updatedAt).toLocaleString("vi-VN")}</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{value || "—"}</p>
    </div>
  );
}
