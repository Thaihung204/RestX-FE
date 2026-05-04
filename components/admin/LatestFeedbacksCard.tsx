"use client";

import { RecentFeedbackItem, RecentFeedbacks } from "@/lib/services/dashboardService";
import { StarFilled } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";

interface LatestFeedbacksCardProps {
  data?: RecentFeedbacks;
  loading?: boolean;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarFilled
          key={i}
          style={{
            fontSize: "0.625rem",
            color: i < rating ? "#faad14" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

function FeedbackRow({ item }: { item: RecentFeedbackItem }) {
  const { t } = useTranslation();

  const displayName = item.isAnonymous
    ? t("admin.feedbacks.anonymous", { defaultValue: "Ẩn danh" })
    : (item.customerName ?? t("admin.feedbacks.unknown", { defaultValue: "Không rõ" }));

  const initials = item.isAnonymous
    ? "?"
    : (item.customerName?.split(" ").filter(Boolean).slice(-1)[0]?.[0]?.toUpperCase() ?? "?");

  const now = new Date();
  const created = new Date(item.createdDate);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeAgo =
    diffMins < 60
      ? t("dashboard.latest_feedbacks.time_ago.minutes", { count: diffMins, defaultValue: `${diffMins} phút trước` })
      : diffHours < 24
        ? t("dashboard.latest_feedbacks.time_ago.hours", { count: diffHours, defaultValue: `${diffHours} giờ trước` })
        : t("dashboard.latest_feedbacks.time_ago.days", { count: diffDays, defaultValue: `${diffDays} ngày trước` });

  return (
    <div className="dashboard-data-card-item">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold overflow-hidden"
          style={{
            background: item.isAnonymous ? "var(--surface)" : "var(--primary-soft)",
            color: item.isAnonymous ? "var(--text-muted)" : "var(--primary)",
            border: "1px solid var(--border)",
          }}
        >
          {!item.isAnonymous && item.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {displayName}
            </p>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--text-muted)" }}>
              {timeAgo}
            </span>
          </div>
          <div className="mb-1.5">
            <StarRow rating={item.rating} />
          </div>
          {item.comment ? (
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
              &ldquo;{item.comment}&rdquo;
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              {/* no comment */}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LatestFeedbacksCard({
  data,
  loading = false,
}: LatestFeedbacksCardProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="dashboard-data-card">
        <div className="dashboard-data-card-header">
          <h3 className="dashboard-data-card-title">
            {t("dashboard.latest_feedbacks.title")}
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-data-card-item">
              <div className="flex items-center gap-3">
                <div className="dashboard-skeleton" style={{ width: "2rem", height: "2rem", borderRadius: "50%" }} />
                <div className="flex-1 space-y-2">
                  <div className="dashboard-skeleton" style={{ height: "0.875rem", width: "50%" }} />
                  <div className="dashboard-skeleton" style={{ height: "0.625rem", width: "80%" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const avgRating = data?.averageRating;
  const totalCount = data?.totalCount ?? 0;

  if (!items.length) {
    return (
      <div className="dashboard-data-card">
        <div className="dashboard-data-card-header">
          <h3 className="dashboard-data-card-title">
            {t("dashboard.latest_feedbacks.title")}
          </h3>
        </div>
        <div className="text-center py-8 rounded-lg" style={{ background: "var(--surface)" }}>
          <svg className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-muted)", opacity: 0.4 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.latest_feedbacks.empty", { defaultValue: "Chưa có feedback nào" })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-data-card">
      <div className="dashboard-data-card-header">
        <h3 className="dashboard-data-card-title">
          {t("dashboard.latest_feedbacks.title")}
        </h3>
        <div className="flex items-center gap-2">
          {avgRating !== undefined && (
            <div className="flex items-center gap-1">
              <StarFilled style={{ fontSize: "0.75rem", color: "#faad14" }} />
              <span className="text-xs font-semibold" style={{ color: "#faad14" }}>
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
          <span className="dashboard-data-card-badge">{totalCount}</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <FeedbackRow key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <Link
          href="/admin/feedbacks"
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: "var(--primary)" }}
        >
          {t("dashboard.latest_feedbacks.view_all", { defaultValue: "Xem tất cả feedback →" })}
        </Link>
      </div>
    </div>
  );
}
