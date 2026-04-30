"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export type ConfirmModalVariant = "danger" | "warning" | "info";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles: Record<
  ConfirmModalVariant,
  {
    iconBg: string;
    iconColor: string;
    confirmBg: string;
    confirmHoverBg: string;
    icon: React.ReactNode;
  }
> = {
  danger: {
    iconBg: "var(--danger-soft)",
    iconColor: "var(--danger)",
    confirmBg: "var(--danger)",
    confirmHoverBg: "color-mix(in srgb, var(--danger), black 10%)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  warning: {
    iconBg: "var(--warning-soft)",
    iconColor: "var(--warning)",
    confirmBg: "var(--warning)",
    confirmHoverBg: "color-mix(in srgb, var(--warning), black 10%)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    iconBg: "var(--primary-soft)",
    iconColor: "var(--primary)",
    confirmBg: "var(--primary)",
    confirmHoverBg: "var(--primary-hover)",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Xac nhan",
  cancelText = "Huy",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cfg = variantStyles[variant];

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: "var(--modal-overlay)",
        backdropFilter: "blur(4px)",
      }}
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden animate-scale-in"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: cfg.iconBg,
              color: cfg.iconColor,
            }}
          >
            {cfg.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>{title}</h3>
            {description && (
              <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>{description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="px-6 pb-6 flex gap-3"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}
        >
          <button
            onClick={() => !loading && onCancel()}
            disabled={loading}
            className="confirm-modal-cancel-btn flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              background: "transparent",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="confirm-modal-confirm-btn flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: cfg.confirmBg,
              color: variant === "warning" ? "var(--text-on-warning)" : "var(--text-inverse)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
