"use client";

import { reservationService, ReservationConfig } from "@/lib/services/reservationService";
import { message, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function ReservationDepositConfigSection() {
    const { t } = useTranslation("common");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<ReservationConfig>({
        minPartySize: 10,
        depositAmountPerPerson: 400,
        deadlineHours: 2,
        earlyRefundHours: 48,
        earlyRefundPercentage: 50,
        lateRefundHours: 24,
        lateRefundPercentage: 20
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await reservationService.getReservationConfig();
                if (data) {
                    setConfig(prev => ({
                        ...prev,
                        ...data
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch reservation config:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Always enforce the requested defaults for the 4 hidden refund fields
            await reservationService.updateReservationConfig({
                ...config,
                earlyRefundHours: 48,
                earlyRefundPercentage: 50,
                lateRefundHours: 24,
                lateRefundPercentage: 20
            });
            message.success(t("dashboard.settings.notifications.success_update", { defaultValue: "Cập nhật thành công!" }));
        } catch (error) {
            console.error("Failed to update deposit config:", error);
            message.error(t("dashboard.settings.notifications.error_update", { defaultValue: "Cập nhật thất bại" }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div
                className="flex items-center justify-center p-8 rounded-xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
                <Spin />
            </div>
        );
    }

    return (
        <div
            className="rounded-xl p-6"
            style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
            }}>
            <h3
                className="text-xl font-bold mb-4"
                style={{ color: "var(--text)" }}>
                {t("dashboard.settings.general.deposit_config", { defaultValue: "Cấu hình đặt cọc" })}
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kích thước nhóm tối thiểu */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.settings.general.min_party_size", { defaultValue: "Số khách tối thiểu cần cọc" })}
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={config.minPartySize}
                            onChange={(e) => setConfig({ ...config, minPartySize: Number(e.target.value) })}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            suppressHydrationWarning
                        />
                    </div>

                    {/* Tiền cọc mỗi khách */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.settings.general.deposit_amount", { defaultValue: "Tiền cọc mỗi khách" })}
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={config.depositAmountPerPerson}
                            onChange={(e) => setConfig({ ...config, depositAmountPerPerson: Number(e.target.value) })}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            suppressHydrationWarning
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Thời gian giữ chỗ */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: "var(--text-muted)" }}>
                            {t("dashboard.settings.general.deadline_hours", { defaultValue: "Thời hạn thanh toán cọc (Giờ)" })}
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={config.deadlineHours}
                            onChange={(e) => setConfig({ ...config, deadlineHours: Number(e.target.value) })}
                            className="w-full px-4 py-2 rounded-lg focus:outline-none"
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                            suppressHydrationWarning
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2 text-white rounded-lg font-medium transition-all ${saving ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
                    style={{
                        background: "linear-gradient(to right, var(--primary), var(--primary-hover))",
                    }}>
                    {saving
                        ? t("dashboard.settings.buttons.saving", { defaultValue: "Đang lưu..." })
                        : t("dashboard.settings.buttons.save_changes", { defaultValue: "Lưu thay đổi" })}
                </button>
            </div>
        </div>
    );
}
