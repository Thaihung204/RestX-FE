"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface AddAreaModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

export const AddAreaModal: React.FC<AddAreaModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    if (name) {
      onAdd(name);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-md border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)]">
          <h3 className="text-xl font-bold text-[var(--text)]">
            {t("dashboard.tables.add_area_modal.title")}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              {t("dashboard.tables.add_area_modal.name_label")}
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              placeholder={t(
                "dashboard.tables.add_area_modal.name_placeholder",
              )}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-[var(--text-muted)] hover:bg-[var(--bg-base)] transition-colors">
              {t("dashboard.tables.add_area_modal.cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors shadow-lg shadow-[var(--primary)]/20">
              {t("dashboard.tables.add_area_modal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
