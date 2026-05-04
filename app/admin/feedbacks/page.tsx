"use client";

import feedbackService, { FeedbackItem, PaginatedFeedbacks } from "@/lib/services/feedbackService";
import { ReloadOutlined } from "@ant-design/icons";
import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4"
          fill={i < rating ? "#f59e0b" : "none"}
          stroke={i < rating ? "#f59e0b" : "var(--border)"}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
      <span className="ml-1 text-xs font-semibold" style={{ color: "#f59e0b" }}>
        {rating}/{max}
      </span>
    </div>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="feedback"
        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Feedback Row ─────────────────────────────────────────────────────────────
function FeedbackRow({ item }: { item: FeedbackItem }) {
  const { t } = useTranslation();
  const displayName = item.isAnonymous
    ? t("admin.feedbacks.anonymous")
    : item.customer?.fullName ?? t("admin.feedbacks.unknown");

  const avatarLetter = item.isAnonymous
    ? "?"
    : (item.customer?.fullName?.charAt(0).toUpperCase() ?? "?");

  return (
    <tr
      className="transition-colors hover:bg-[var(--surface)]"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Customer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
            style={{ background: item.isAnonymous ? "var(--text-muted)" : "var(--primary)" }}
          >
            {!item.isAnonymous && item.customer?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.customer.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              avatarLetter
            )}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {displayName}
            </p>
            {item.isAnonymous && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {t("admin.feedbacks.anonymous")}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        <StarRating rating={item.rating} />
      </td>

      {/* Comment */}
      <td className="px-4 py-3 max-w-[280px]">
        {item.comment ? (
          <p className="text-sm italic line-clamp-2" style={{ color: "var(--text)" }}>
            &ldquo;{item.comment}&rdquo;
          </p>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("admin.feedbacks.no_comment")}
          </span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
          style={
            item.isPublished
              ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.25)" }
              : { background: "var(--surface)", color: "var(--text-muted)", borderColor: "var(--border)" }
          }
        >
          {item.isPublished ? t("admin.feedbacks.published") : t("admin.feedbacks.unpublished")}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-sm" style={{ color: "var(--text)" }}>
          {new Date(item.createdDate).toLocaleDateString("vi-VN")}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(item.createdDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FeedbacksPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedFeedbacks | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [publishedFilter, setPublishedFilter] = useState<boolean | "">("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Keep a stable ref to t so fetchData doesn't re-run on language change
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await feedbackService.getFeedbacks({
        pageNumber: page,
        pageSize,
        search: search || undefined,
        rating: ratingFilter !== "" ? ratingFilter : undefined,
        isPublished: publishedFilter !== "" ? publishedFilter : undefined,
      });
      setData(result);
    } catch (e) {
      console.error(e);
      message.error(tRef.current("admin.feedbacks.load_failed"));
    } finally {
      setLoading(false);
    }
    // t intentionally excluded — use tRef to avoid re-fetching on language change
  }, [page, pageSize, search, ratingFilter, publishedFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, ratingFilter, publishedFilter, pageSize]);

  const totalCount = data?.totalCount ?? 0;
  const totalActive = data?.totalActive ?? 0;
  const totalInactive = data?.totalInactive ?? 0;

  const tableHeaders = [
    { key: "customer", label: t("admin.feedbacks.headers.customer"), align: "left" },
    { key: "rating",   label: t("admin.feedbacks.headers.rating"),   align: "left" },
    { key: "comment",  label: t("admin.feedbacks.headers.comment"),  align: "left" },
    { key: "status",   label: t("admin.feedbacks.headers.status"),   align: "center" },
    { key: "date",     label: t("admin.feedbacks.headers.date"),     align: "left" },
  ] as const;

  return (
    <main className="flex-1 p-6 lg:p-8">
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>
              {t("admin.feedbacks.title")}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("admin.feedbacks.subtitle", { total: totalCount.toLocaleString() })}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <ReloadOutlined className={loading ? "animate-spin" : ""} />
            {t("admin.reservations.refresh")}
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: t("admin.feedbacks.stats.total"),     value: totalCount,   color: "var(--primary)", bg: "var(--primary-soft)" },
            { label: t("admin.feedbacks.stats.published"), value: totalActive,  color: "#22c55e",        bg: "rgba(34,197,94,0.1)" },
            { label: t("admin.feedbacks.stats.hidden"),    value: totalInactive, color: "#f59e0b",       bg: "rgba(245,158,11,0.1)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 min-w-[160px] rounded-xl p-4 flex items-center justify-between"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: stat.bg }}>
                <svg className="w-5 h-5" style={{ color: stat.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-4 flex flex-wrap gap-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <input
            type="text"
            placeholder={t("admin.feedbacks.filter.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-[14px] py-[10px] rounded-xl text-[14px] outline-none transition-colors"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-[14px] py-[10px] rounded-xl text-[14px] outline-none min-w-[140px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="">{t("admin.feedbacks.filter.all_ratings")}</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{t("admin.feedbacks.filter.rating_option", { count: r })}</option>
            ))}
          </select>

          <select
            value={publishedFilter === "" ? "" : String(publishedFilter)}
            onChange={(e) => setPublishedFilter(e.target.value === "" ? "" : e.target.value === "true")}
            className="px-[14px] py-[10px] rounded-xl text-[14px] outline-none min-w-[150px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="">{t("admin.feedbacks.filter.all_status")}</option>
            <option value="true">{t("admin.feedbacks.published")}</option>
            <option value="false">{t("admin.feedbacks.unpublished")}</option>
          </select>

          {(search || ratingFilter !== "" || publishedFilter !== "") && (
            <button
              onClick={() => { setSearch(""); setRatingFilter(""); setPublishedFilter(""); }}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {t("admin.reservations.filter.clear")}
            </button>
          )}
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: "var(--surface)" }}>
                <tr>
                  {tableHeaders.map((h) => (
                    <th
                      key={h.key}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${h.align === "center" ? "text-center" : "text-left"}`}
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex justify-center">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
                        />
                      </div>
                    </td>
                  </tr>
                ) : !data?.items.length ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        <p className="text-sm">{t("admin.feedbacks.empty")}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <FeedbackRow key={item.id} item={item} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3 flex-wrap gap-3"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.page_size")}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg text-sm outline-none"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("admin.reservations.pagination.results")}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  {t("admin.reservations.pagination.prev")}
                </button>

                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(data.totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: p === page ? "var(--primary)" : "var(--surface)",
                        border: `1px solid ${p === page ? "var(--primary)" : "var(--border)"}`,
                        color: p === page ? "#fff" : "var(--text)",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={!data.hasNextPage}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  {t("admin.reservations.pagination.next")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
