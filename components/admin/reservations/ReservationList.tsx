"use client";

import { PaginatedReservations, ReservationListItem } from "@/lib/services/reservationService";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ReservationRowActions } from "@/components/admin/reservations/ReservationRowActions";

type ReservationListProps = {
  data: PaginatedReservations | null;
  loading: boolean;
  setPage: Dispatch<SetStateAction<number>>;
  onStatusUpdated: () => void;
};

function StatusBadge({ code, name, colorCode }: { code: string; name: string; colorCode: string }) {
  const { t } = useTranslation();
  const finalColorCode = code === "CONFIRMED" ? "#3b82f6" : colorCode;
  const bg = finalColorCode ? `${finalColorCode}22` : "rgba(255,255,255,0.08)";
  const fallbackName = name || code;

  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
      style={{ color: finalColorCode, backgroundColor: bg, borderColor: `${finalColorCode}44` }}
    >
      {code ? t(`admin.reservations.status.${code.toLowerCase()}`, { defaultValue: fallbackName }) : fallbackName}
    </span>
  );
}

export default function ReservationList({ data, loading, setPage, onStatusUpdated }: ReservationListProps) {
  const { t } = useTranslation();
  const tableHeaderKeys = ["code", "customer", "table_floor", "date_time", "guests", "status", "actions"] as const;

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "var(--surface)" }}>
              <tr>
                {tableHeaderKeys.map((key) => (
                  <th
                    key={key}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${["table_floor", "guests", "status", "actions"].includes(key) ? "text-center" : "text-left"}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t(`admin.reservations.table_headers.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6">
                    <div className="w-full h-[320px] rounded-xl animate-pulse" style={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">{t("admin.reservations.empty")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((item: ReservationListItem) => (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--surface)]" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold" style={{ color: "var(--primary)" }}>#{item.confirmationCode}</span>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{new Date(item.createdAt).toLocaleDateString()}</p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--primary)" }}>
                          {item.contactName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.contactName}</p>
                            {item.isGuest ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{t("admin.reservations.modal.contact.guest")}</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "rgba(234, 179, 8, 0.1)", color: "#eab308", border: "1px solid rgba(234, 179, 8, 0.2)" }}>{t("admin.reservations.modal.contact.member")}</span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.contactPhone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-center gap-1.5 max-w-[180px] mx-auto">
                        {item.tables.map((tb, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded flex items-center gap-1 text-[11px] font-medium" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                            {tb.code} <span style={{ color: "var(--text-muted)" }}>· {tb.floorName}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {new Date(item.reservationDateTime).toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(item.reservationDateTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--surface)", color: "var(--text)" }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {item.numberOfGuests}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center"><div className="flex justify-center"><StatusBadge {...item.status} /></div></td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <ReservationRowActions item={item} onActionComplete={onStatusUpdated} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("admin.reservations.pagination.page_info", { page: data.pageNumber, total: data.totalPages, count: data.totalCount })}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data.hasPreviousPage} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {t("admin.reservations.pagination.prev")}
              </button>
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(data.totalPages - 4, data.pageNumber - 2)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-sm font-medium transition-all" style={p === data.pageNumber ? { background: "var(--primary)", color: "white" } : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasNextPage} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {t("admin.reservations.pagination.next")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
