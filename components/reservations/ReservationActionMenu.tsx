"use client";

import { Dropdown } from "antd";
import { ReactNode } from "react";

export type ReservationActionMenuVariant = "primary" | "warning" | "success" | "danger";

export type ReservationActionMenuItem = {
  key: string;
  label: string;
  variant?: ReservationActionMenuVariant;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
};

function DefaultMenuIcon({ variant }: { variant?: ReservationActionMenuVariant }) {
  if (variant === "danger") {
    return (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 4h.01M10.29 3.86l-7.4 12.82A2 2 0 004.62 20h14.76a2 2 0 001.73-3.32l-7.4-12.82a2 2 0 00-3.46 0z" />
      </svg>
    );
  }

  if (variant === "success") {
    return (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  if (variant === "primary") {
    return (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    );
  }

  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function ReservationActionMenu({
  onViewDetail,
  viewDetailLabel,
  moreLabel,
  menuItems,
  pendingBadgeCount,
  actionLoading,
}: {
  onViewDetail: () => void;
  viewDetailLabel: string;
  moreLabel: string;
  menuItems: ReservationActionMenuItem[];
  pendingBadgeCount: number;
  actionLoading: boolean;
}) {
  const hasMenu = menuItems.length > 0;

  const statusItems = menuItems.filter((m) => m.disabled);
  const actionItems = menuItems.filter((m) => !m.disabled);

  const dropdownContent = (
    <div className="rsv-action-panel">
      {/* Status indicators - read-only pills */}
      {statusItems.length > 0 && (
        <div className="rsv-action-panel-statuses">
          {statusItems.map((m) => (
            <div
              key={m.key}
              className={`rsv-action-panel-status rsv-action-panel-status--${m.variant || "default"}`}
            >
              <span className="rsv-action-panel-status-dot" />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons - clickable */}
      {actionItems.length > 0 && (
        <div
          className="rsv-action-panel-actions"
          style={statusItems.length > 0 ? { borderTop: "1px solid var(--border)", paddingTop: 8 } : undefined}
        >
          {actionItems.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`rsv-action-panel-btn rsv-action-panel-btn--${m.variant || "default"}`}
              onClick={m.onClick}
            >
              <span className="rsv-action-panel-btn-icon">
                {m.icon ?? <DefaultMenuIcon variant={m.variant} />}
              </span>
              <span className="rsv-action-panel-btn-label">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="reservation-action-group">
      <button
        type="button"
        onClick={onViewDetail}
        className="reservation-action-btn reservation-action-btn--icon reservation-action-btn--soft"
        title={viewDetailLabel}
        aria-label={viewDetailLabel}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>

      <div className="reservation-action-dropdown">
        <Dropdown
          dropdownRender={() => dropdownContent}
          trigger={["click"]}
          placement="bottomRight"
          disabled={!hasMenu}
        >
          <button
            type="button"
            className="reservation-action-btn reservation-action-btn--icon reservation-action-btn--neutral"
            title={moreLabel}
            aria-label={moreLabel}
          >
            {actionLoading ? (
              <div
                className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
              />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
              </svg>
            )}
            {!actionLoading && pendingBadgeCount > 0 && (
              <span className="reservation-action-btn-badge">{pendingBadgeCount}</span>
            )}
          </button>
        </Dropdown>
      </div>
    </div>
  );
}
