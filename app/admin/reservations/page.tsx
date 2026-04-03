"use client";

import ReservationList from "@/components/admin/reservations/ReservationList";
import { DropDown } from "@/components/ui/DropDown";
import reservationService, {
  PaginatedReservations,
  ReservationStatus,
} from "@/lib/services/reservationService";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ReservationsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedReservations | null>(null);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<ReservationStatus[]>([]);

  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reservationService.getReservations({
        pageNumber: page,
        pageSize: 10,
        search: search || undefined,
        statusId: statusId !== "" ? statusId : undefined,
        date: date || undefined,
        sortBy: "reservationDateTime",
        sortDescending: false,
      });
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusId, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusId, date]);

  useEffect(() => {
    reservationService.getReservationStatuses().then(setStatuses).catch(console.error);
  }, []);

  const pendingCount = data?.items.filter((i) => i.status.code === "PENDING").length ?? 0;
  const confirmedCount = data?.items.filter((i) => i.status.code === "CONFIRMED").length ?? 0;
  const completedCount = data?.items.filter((i) => i.status.code === "COMPLETED").length ?? 0;
  const totalCount = data?.totalCount ?? 0;

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
              {t("admin.reservations.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("admin.reservations.total_count", { total: totalCount.toLocaleString() })}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            {t("admin.reservations.refresh")}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { labelKey: "total", value: totalCount, color: "var(--primary)", bg: "var(--primary-soft)" },
            { labelKey: "pending", value: pendingCount, color: "#FFA500", bg: "rgba(255,165,0,0.1)" },
            { labelKey: "confirmed", value: confirmedCount, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
            { labelKey: "completed", value: completedCount, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
          ].map((stat) => (
            <div
              key={stat.labelKey}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t(`admin.reservations.stats.${stat.labelKey}`)}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl p-4 flex flex-wrap gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <input
            type="text"
            placeholder={t("admin.reservations.filter.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />

          <DropDown
            value={statusId}
            onChange={(e) => setStatusId(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-3 py-2 text-sm min-w-[160px]"
          >
            <option value="">{t("admin.reservations.filter.all_status")}</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {t(`admin.reservations.status.${s.code.toLowerCase()}`, { defaultValue: s.name })}
              </option>
            ))}
          </DropDown>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          />

          {(search || statusId !== "" || date) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusId("");
                setDate("");
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {t("admin.reservations.filter.clear")}
            </button>
          )}
        </div>

        <ReservationList
          data={data}
          loading={loading}
          setPage={setPage}
          onStatusUpdated={fetchData}
        />
      </div>
    </main>
  );
}
