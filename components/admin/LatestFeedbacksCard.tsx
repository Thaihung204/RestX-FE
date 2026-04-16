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
    customerName: "Nguyễn Văn A",
    rating: 5,
    comment: "Món ăn rất ngon, phục vụ tận tình. Sẽ quay lại lần sau!",
    createdAt: "2024-04-15T10:30:00",
  },
  {
    id: "2",
    customerName: "Trần Thị B",
    rating: 4,
    comment: "Không gian đẹp, giá cả hợp lý. Chỉ có điều hơi đông người.",
    createdAt: "2024-04-15T09:15:00",
  },
  {
    id: "3",
    customerName: "Lê Minh C",
    rating: 5,
    comment: "Tuyệt vời! Đồ ăn tươi ngon, nhân viên nhiệt tình.",
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

  if (loading) {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>
          {t("dashboard.latest_feedbacks.title")}
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg p-3"
              style={{ background: "var(--surface)" }}>
              <div
                className="h-4 rounded mb-2"
                style={{ background: "var(--border)", width: "60%" }}
              />
              <div
                className="h-3 rounded"
                style={{ background: "var(--border)", width: "100%" }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!mockFeedbacks || mockFeedbacks.length === 0) {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>
          {t("dashboard.latest_feedbacks.title")}
        </h3>
        <div
          className="text-center py-8 rounded-lg"
          style={{ background: "var(--surface)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("dashboard.latest_feedbacks.empty")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-5 border"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>
          {t("dashboard.latest_feedbacks.title")}
        </h3>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            background: "var(--surface)",
            color: "var(--text-muted)",
          }}>
          {mockFeedbacks.length}
        </span>
      </div>

      <div className="space-y-3">
        {mockFeedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="rounded-lg p-3 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: "var(--text)" }}>
                  {feedback.customerName}
                </p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarFilled
                      key={i}
                      className="text-xs"
                      style={{
                        color:
                          i < feedback.rating ? "#faad14" : "var(--border)",
                      }}
                    />
                  ))}
                </div>
              </div>
              <span
                className="text-xs whitespace-nowrap ml-2"
                style={{ color: "var(--text-muted)" }}>
                {formatTimeAgo(feedback.createdAt)}
              </span>
            </div>
            <p
              className="text-sm line-clamp-2 leading-relaxed"
              style={{ color: "var(--text-muted)" }}>
              {feedback.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
