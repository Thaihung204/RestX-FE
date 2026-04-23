"use client";

import { StarFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface Feedback {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface LatestFeedbacksCardProps {
  loading?: boolean;
}

// Mock data - replace with real API call
const mockFeedbacks: Feedback[] = [
  {
    id: "1",
    customerName: "Nguyen Van A",
    rating: 5,
    comment: "Mon an rat ngon, phuc vu tan tinh. Se quay lai lan sau!",
    createdAt: "2024-04-15T10:30:00",
  },
  {
    id: "2",
    customerName: "Tran Thi B",
    rating: 4,
    comment: "Khong gian dep, gia ca hop ly. Chi co dieu hoi dong nguoi.",
    createdAt: "2024-04-15T09:15:00",
  },
  {
    id: "3",
    customerName: "Le Minh C",
    rating: 5,
    comment: "Tuyet voi! Do an tuoi ngon, nhan vien nhiet tinh.",
    createdAt: "2024-04-14T18:45:00",
  },
];

export default function LatestFeedbacksCard({
  loading = false,
}: LatestFeedbacksCardProps) {
  const { t } = useTranslation();

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return t("dashboard.latest_feedbacks.time_ago.minutes", { count: diffMins });
    if (diffHours < 24) return t("dashboard.latest_feedbacks.time_ago.hours", { count: diffHours });
    return t("dashboard.latest_feedbacks.time_ago.days", { count: diffDays });
  };

  const getInitials = (name: string) => {
    return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";
  };

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

  if (!mockFeedbacks || mockFeedbacks.length === 0) {
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
            {t("dashboard.latest_feedbacks.empty")}
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
        <span className="dashboard-data-card-badge">
          {mockFeedbacks.length}
        </span>
      </div>

      <div className="space-y-2">
        {mockFeedbacks.map((feedback) => (
          <div key={feedback.id} className="dashboard-data-card-item">
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                {getInitials(feedback.customerName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {feedback.customerName}
                  </p>
                  <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatTimeAgo(feedback.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarFilled
                      key={i}
                      style={{
                        fontSize: "0.625rem",
                        color: i < feedback.rating ? "#faad14" : "var(--border)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                  {feedback.comment}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
