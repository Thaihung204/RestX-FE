"use client";

import MenuManagementTabs from "@/components/admin/menu/MenuManagementTabs";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { DropDown } from "@/components/ui/DropDown";
import StatusToggle from "@/components/ui/StatusToggle";
import dishService, { ComboSummaryDto } from "@/lib/services/dishService";
import { formatVND } from "@/lib/utils/currency";
import { extractApiErrorMessage } from "@/lib/utils/extractApiErrorMessage";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { App, Button, Popconfirm } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ComboManagementPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [combos, setCombos] = useState<ComboSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [pendingToggleCombo, setPendingToggleCombo] = useState<ComboSummaryDto | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const data = await dishService.getCombos(true);
      setCombos(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.combo.toasts.fetch_error", {
          defaultValue: "Failed to load combos",
        }),
      );
      message.error(errorMsg);
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const activeCount = useMemo(
    () => combos.filter((combo) => combo.isActive).length,
    [combos],
  );

  const handleToggleStatus = (combo: ComboSummaryDto) => {
    setPendingToggleCombo(combo);
  };

  const confirmToggleStatus = async () => {
    if (!pendingToggleCombo) return;
    const combo = pendingToggleCombo;
    try {
      setTogglingStatus(true);
      setLoadingActionId(combo.id);
      const nextStatus = !combo.isActive;
      await dishService.toggleComboStatus(combo.id, nextStatus);
      setCombos((prev) =>
        prev.map((item) =>
          item.id === combo.id ? { ...item, isActive: nextStatus } : item,
        ),
      );
      message.success(
        nextStatus
          ? t("dashboard.menu.combo.toasts.activate_success", { defaultValue: "Combo activated" })
          : t("dashboard.menu.combo.toasts.deactivate_success", { defaultValue: "Combo deactivated" }),
      );
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.combo.toasts.status_error", { defaultValue: "Unable to update combo status" }),
      );
      message.error(errorMsg);
    } finally {
      setTogglingStatus(false);
      setLoadingActionId(null);
      setPendingToggleCombo(null);
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    try {
      setLoadingActionId(comboId);
      await dishService.deleteCombo(comboId);
      setCombos((prev) => prev.filter((combo) => combo.id !== comboId));
      message.success(
        t("dashboard.menu.combo.toasts.delete_success", { defaultValue: "Combo deleted successfully" }),
      );
    } catch (err: unknown) {
      const errorMsg = extractApiErrorMessage(
        err,
        t("dashboard.menu.combo.toasts.delete_error", { defaultValue: "Unable to delete combo" }),
      );
      message.error(errorMsg);
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
              {t("dashboard.menu.combo.title", { defaultValue: "Combo Management" })}
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.subtitle", {
                defaultValue: "Create and manage meal combos for your menu",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <MenuManagementTabs activeTab="combos" />
            <Link href="/admin/menu/combo/new">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="!inline-flex !h-12 !items-center !rounded-xl !px-6 !text-base !font-semibold"
                style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
                {t("dashboard.menu.combo.actions.add_combo", { defaultValue: "Add Combo" })}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.stats.total", { defaultValue: "Total Combos" })}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>{combos.length}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.stats.active", { defaultValue: "Active" })}
            </p>
            <p className="text-3xl font-bold text-green-500 mt-1">{activeCount}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid rgba(255, 56, 11, 0.2)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.stats.inactive", { defaultValue: "Inactive" })}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--primary)" }}>{combos.length - activeCount}</p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.loading", { defaultValue: "Loading combos..." })}
            </p>
          </div>
        ) : combos.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              {t("dashboard.menu.combo.empty.title", { defaultValue: "No combos yet" })}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.empty.subtitle", {
                defaultValue: "Create your first combo to offer bundled dishes",
              })}
            </p>
            <div className="mt-4">
              <Link href="/admin/menu/combo/new">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  className="!inline-flex !h-12 !items-center !rounded-xl !px-6 !text-base !font-semibold"
                  style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
                  {t("dashboard.menu.combo.actions.add_combo", { defaultValue: "Add Combo" })}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {combos.map((combo) => {
              const comboDetails = combo.details || [];
              const itemCount = comboDetails.reduce((sum, detail) => sum + (detail.quantity || 0), 0);
              const totalDishTypes = comboDetails.length;
              const hasDishes = totalDishTypes > 0;

              return (
                <div
                  key={combo.id}
                  className="rounded-xl overflow-hidden transition-all group h-full flex flex-col"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,56,11,0.5)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                  <div className="relative overflow-hidden" style={{ background: "var(--surface)", aspectRatio: "4/3" }}>
                    {combo.imageUrl ? (
                      <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.menu.combo.no_image", { defaultValue: "No image" })}
                      </div>
                    )}

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-white text-xs font-semibold" style={{ background: "rgba(15, 23, 42, 0.72)" }}>
                        {t("dashboard.menu.combo.fields.total_items", { defaultValue: "Total items" })}: {itemCount}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: combo.isActive ? "rgba(34, 197, 94, 0.15)" : "rgba(107, 114, 128, 0.2)",
                          color: combo.isActive ? "#16a34a" : "#6b7280",
                        }}>
                        {combo.isActive
                          ? t("common.active", { defaultValue: "Active" })
                          : t("common.inactive", { defaultValue: "Inactive" })}
                      </span>
                    </div>

                    {!combo.isActive && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <span className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold">
                          {t("dashboard.menu.out_of_stock", { defaultValue: "Out of Stock" })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-1 flex-col">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold mb-1 truncate" style={{ color: "var(--text)" }}>{combo.name}</h3>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{combo.code || "-"}</p>
                      </div>
                    </div>

                    <p
                      className="text-sm min-h-10"
                      style={{
                        color: "var(--text-muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                      {combo.description || t("dashboard.menu.combo.no_description", { defaultValue: "No description" })}
                    </p>

                    <div className="mt-3 min-h-10">
                      <DropDown
                        aria-label={t("dashboard.menu.combo.actions.view_dishes", { defaultValue: "View dishes" })}
                        defaultValue=""
                        disabled={!hasDishes}
                        className="!h-10 !py-2 !text-sm">
                        <option value="" disabled>
                          {hasDishes
                            ? `${t("dashboard.menu.combo.actions.view_dishes", { defaultValue: "View dishes" })} (${totalDishTypes})`
                            : t("dashboard.menu.combo.fields.no_dishes", { defaultValue: "No dishes in this combo yet" })}
                        </option>
                        {comboDetails.map((detail, index) => (
                          <option key={`${combo.id}-dish-${detail.dishId || index}`} value={`${detail.dishId || "dish"}-${index}`}>
                            {(detail.dishName || t("dashboard.menu.combo.placeholders.select_dish", { defaultValue: "Dish" })) + ` x${detail.quantity || 1}`}
                          </option>
                        ))}
                      </DropDown>
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.menu.combo.fields.price", { defaultValue: "Price" })}
                          </p>
                          <p className="text-[20px] sm:text-base font-semibold" style={{ color: "var(--primary)" }}>
                            {formatVND(combo.price)}
                          </p>
                        </div>
                        <StatusToggle
                          checked={combo.isActive}
                          onChange={() => handleToggleStatus(combo)}
                          ariaLabel={
                            combo.isActive
                              ? t("dashboard.menu.combo.actions.deactivate", { defaultValue: "Deactivate combo" })
                              : t("dashboard.menu.combo.actions.activate", { defaultValue: "Activate combo" })
                          }
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <Link href={`/admin/menu/combo/${combo.id}`}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            aria-label={t("common.actions.edit", { defaultValue: "Edit" })}
                            title={t("common.actions.edit", { defaultValue: "Edit" })}
                            className="!h-9 !w-9 !rounded-lg"
                          />
                        </Link>
                        <Popconfirm
                          title={t("dashboard.menu.combo.confirm.delete_title", { defaultValue: "Delete this combo?" })}
                          description={t("dashboard.menu.combo.confirm.delete_description", {
                            defaultValue: "The combo will be deactivated and hidden from active lists.",
                          })}
                          okText={t("common.actions.delete", { defaultValue: "Delete" })}
                          cancelText={t("common.cancel", { defaultValue: "Cancel" })}
                          onConfirm={() => handleDeleteCombo(combo.id)}>
                          <Button
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                            aria-label={t("common.actions.delete", { defaultValue: "Delete" })}
                            title={t("common.actions.delete", { defaultValue: "Delete" })}
                            loading={loadingActionId === combo.id}
                            className="!h-9 !w-9 !rounded-lg"
                          />
                        </Popconfirm>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!pendingToggleCombo}
        title={
          pendingToggleCombo?.isActive
            ? t("dashboard.menu.combo.confirm.deactivate_title")
            : t("dashboard.menu.combo.confirm.activate_title")
        }
        description={
          pendingToggleCombo?.isActive
            ? t("dashboard.menu.combo.confirm.deactivate_desc", { name: pendingToggleCombo?.name })
            : t("dashboard.menu.combo.confirm.activate_desc", { name: pendingToggleCombo?.name })
        }
        confirmText={pendingToggleCombo?.isActive ? t("common.deactivate") : t("common.activate")}
        cancelText={t("common.cancel")}
        variant={pendingToggleCombo?.isActive ? "warning" : "info"}
        loading={togglingStatus}
        onConfirm={confirmToggleStatus}
        onCancel={() => setPendingToggleCombo(null)}
      />
    </main>
  );
}
