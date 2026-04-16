"use client";

import reservationService, {
  ReservationDetail,
  ReservationStatus,
} from "@/lib/services/reservationService";
import { Select } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type ReservationDetailModalProps = {
  reservationId: string;
  onClose: () => void;
  onStatusUpdated: () => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: "var(--text)" }}>{value}</span>
    </div>
  );
}

export default function ReservationDetailsModal({ reservationId, onClose, onStatusUpdated }: ReservationDetailModalProps) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [allStatuses, setAllStatuses] = useState<ReservationStatus[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | "">("");

  useEffect(() => {
    reservationService.getReservationStatuses().then(setAllStatuses).catch(console.error);
  }, []);

  const fetchDetail = async () => {
    const d = await reservationService.getReservationById(reservationId);
    setDetail(d);
    setSelectedStatusId(d.status.id);
    return d;
  };

  useEffect(() => {
    fetchDetail()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reservationId]);

  const handleStatusChange = async (newStatusId: number) => {
    if (!detail || newStatusId === detail.status.id) return;
    setSelectedStatusId(newStatusId);
    setActionLoading(true);
    try {
      await reservationService.updateReservationStatus(reservationId, newStatusId);
      onStatusUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      setSelectedStatusId(detail.status.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{t("admin.reservations.modal.title")}</h2>
            {detail && <span className="text-sm font-mono" style={{ color: "var(--primary)" }}>#{detail.confirmationCode}</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
          ) : !detail ? (
            <p className="text-center" style={{ color: "var(--text-muted)" }}>{t("admin.reservations.modal.load_error")}</p>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ background: "var(--surface)" }}>
                <span className="text-sm font-medium shrink-0" style={{ color: "var(--text-muted)" }}>{t("admin.reservations.modal.status_label")}</span>
                <Select
                  value={selectedStatusId !== "" ? selectedStatusId : undefined}
                  disabled={actionLoading || allStatuses.length === 0}
                  loading={actionLoading}
                  onChange={handleStatusChange}
                  style={{ minWidth: 180 }}
                  optionLabelProp="label"
                  options={allStatuses.filter((s) => s.code !== "CHECKED_IN").map((s) => {
                    const color = s.code === "CONFIRMED" ? "#3b82f6" : s.colorCode;
                    const label = t(`admin.reservations.status.${s.code.toLowerCase()}`, { defaultValue: s.name });
                    return { value: s.id, label: <span style={{ color, fontWeight: 600, fontSize: 13 }}>{label}</span>, rawLabel: label, color };
                  })}
                  optionRender={(opt) => (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: (opt.data as { color?: string }).color }} />
                      <span style={{ color: (opt.data as { color?: string }).color, fontWeight: 600 }}>{(opt.data as { rawLabel?: string }).rawLabel}</span>
                    </div>
                  )}
                />
                {detail.checkedInAt && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid var(--success-border)" }}>
                    {t("admin.reservations.messages.checked_in_at", { defaultValue: "Đã check-in lúc" })}: {new Date(detail.checkedInAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>{t("admin.reservations.modal.contact_title")}</p>
                  <InfoRow label={t("admin.reservations.modal.contact.name")} value={detail.contact.name} />
                  <InfoRow label={t("admin.reservations.modal.contact.phone")} value={detail.contact.phone} />
                  <InfoRow label={t("admin.reservations.modal.contact.email")} value={detail.contact.email ?? "—"} />
                  <InfoRow label={t("admin.reservations.modal.contact.type")} value={detail.contact.isGuest ? t("admin.reservations.modal.contact.guest") : t("admin.reservations.modal.contact.member")} />
                  {detail.contact.membershipLevel && <InfoRow label={t("admin.reservations.modal.contact.level")} value={detail.contact.membershipLevel} />}
                </div>

                <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>{t("admin.reservations.modal.booking_title")}</p>
                  <InfoRow label={t("admin.reservations.modal.booking.date_time")} value={new Date(detail.reservationDateTime).toLocaleString()} />
                  <InfoRow label={t("admin.reservations.modal.booking.guests")} value={`${detail.numberOfGuests} ${t("admin.reservations.modal.booking.guests_suffix")}`} />
                  <InfoRow label={t("admin.reservations.modal.booking.table")} value={detail.tables.map((tb) => `${tb.code} (${tb.floorName})`).join(", ")} />
                  <InfoRow label={t("admin.reservations.modal.booking.deposit")} value={`${detail.depositAmount.toLocaleString()}đ`} />
                  <InfoRow label={t("admin.reservations.modal.booking.deposit_paid")} value={detail.depositPaid ? t("admin.reservations.modal.booking.deposit_yes") : t("admin.reservations.modal.booking.deposit_no")} />
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
  );
}
