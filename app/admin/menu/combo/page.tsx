"use client";

import MenuManagementTabs from "@/components/admin/menu/MenuManagementTabs";
import StatusToggle from "@/components/ui/StatusToggle";
import dishService, { ComboSummaryDto } from "@/lib/services/dishService";
import { App, Button, Popconfirm } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatVND } from "@/lib/utils/currency";

export default function ComboManagementPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const [combos, setCombos] = useState<ComboSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const data = await dishService.getCombos(true);
      setCombos(Array.isArray(data) ? data : []);
    } catch {
      message.error(
        t("dashboard.menu.combo.toasts.fetch_error", {
          defaultValue: "Failed to load combos",
        }),
      );
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

  const handleToggleStatus = async (combo: ComboSummaryDto) => {
    try {
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
          ? t("dashboard.menu.combo.toasts.activate_success", {
              defaultValue: "Combo activated",
            })
          : t("dashboard.menu.combo.toasts.deactivate_success", {
              defaultValue: "Combo deactivated",
            }),
      );
    } catch {
      message.error(
        t("dashboard.menu.combo.toasts.status_error", {
          defaultValue: "Unable to update combo status",
        }),
      );
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    try {
      setLoadingActionId(comboId);
      await dishService.deleteCombo(comboId);
      setCombos((prev) => prev.filter((combo) => combo.id !== comboId));

      message.success(
        t("dashboard.menu.combo.toasts.delete_success", {
          defaultValue: "Combo deleted successfully",
        }),
      );
    } catch {
      message.error(
        t("dashboard.menu.combo.toasts.delete_error", {
          defaultValue: "Unable to delete combo",
        }),
      );
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
              <Button type="primary" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
                {t("dashboard.menu.combo.actions.add_combo", {
                  defaultValue: "Add Combo",
                })}
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.stats.total", { defaultValue: "Total Combos" })}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>
              {combos.length}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.stats.active", { defaultValue: "Active" })}
            </p>
            <p className="text-3xl font-bold text-green-500 mt-1">{activeCount}</p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--card)",
              border: "1px solid rgba(255, 56, 11, 0.2)",
            }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("dashboard.menu.combo.stats.inactive", { defaultValue: "Inactive" })}
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "var(--primary)" }}>
              {combos.length - activeCount}
            </p>
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
                <Button type="primary" style={{ background: "var(--primary)", borderColor: "var(--primary)" }}>
                  {t("dashboard.menu.combo.actions.add_combo", {
                    defaultValue: "Add Combo",
                  })}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {combos.map((combo) => {
              const itemCount = combo.details?.reduce(
                (sum, detail) => sum + (detail.quantity || 0),
                0,
              );

              return (
                <div
                  key={combo.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="h-44" style={{ background: "var(--surface)" }}>
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.menu.combo.no_image", { defaultValue: "No image" })}
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                          {combo.name}
                        </h3>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {combo.code || "-"}
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: combo.isActive
                            ? "rgba(34, 197, 94, 0.12)"
                            : "rgba(156, 163, 175, 0.12)",
                          color: combo.isActive ? "#22c55e" : "#6b7280",
                        }}>
                        {combo.isActive
                          ? t("common.active", { defaultValue: "Active" })
                          : t("common.inactive", { defaultValue: "Inactive" })}
                      </span>
                    </div>

                    <p
                      className="text-sm line-clamp-2"
                      style={{ color: "var(--text-muted)" }}>
                      {combo.description ||
                        t("dashboard.menu.combo.no_description", {
                          defaultValue: "No description",
                        })}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.menu.combo.fields.price", { defaultValue: "Price" })}
                        </p>
                        <p className="font-semibold" style={{ color: "var(--primary)" }}>
                          {formatVND(combo.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {t("dashboard.menu.combo.fields.total_items", {
                            defaultValue: "Total items",
                          })}
                        </p>
                        <p className="font-semibold" style={{ color: "var(--text)" }}>
                          {itemCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <StatusToggle
                        checked={combo.isActive}
                        onChange={() => handleToggleStatus(combo)}
                        ariaLabel={
                          combo.isActive
                            ? t("dashboard.menu.combo.actions.deactivate", {
                                defaultValue: "Deactivate combo",
                              })
                            : t("dashboard.menu.combo.actions.activate", {
                                defaultValue: "Activate combo",
                              })
                        }
                      />

                      <div className="flex gap-2">
                        <Link href={`/admin/menu/combo/${combo.id}`}>
                          <Button size="small">
                            {t("common.actions.edit", { defaultValue: "Edit" })}
                          </Button>
                        </Link>
                        <Popconfirm
                          title={t("dashboard.menu.combo.confirm.delete_title", {
                            defaultValue: "Delete this combo?",
                          })}
                          description={t(
                            "dashboard.menu.combo.confirm.delete_description",
                            {
                              defaultValue:
                                "The combo will be deactivated and hidden from active lists.",
                            },
                          )}
                          okText={t("common.actions.delete", { defaultValue: "Delete" })}
                          cancelText={t("common.cancel", { defaultValue: "Cancel" })}
                          onConfirm={() => handleDeleteCombo(combo.id)}>
                          <Button
                            size="small"
                            danger
                            loading={loadingActionId === combo.id}>
                            {t("common.actions.delete", { defaultValue: "Delete" })}
                          </Button>
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
    </main>
  );
}
