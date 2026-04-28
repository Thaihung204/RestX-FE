"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { message, Spin } from "antd";
import { useTenant } from "@/lib/contexts/TenantContext";
import { tenantService } from "@/lib/services/tenantService";
import { BusinessHour } from "@/lib/types/tenant";
import { TimePicker } from "@/components/ui/TimePicker";

const getDaysOfWeek = (t: any) => [
    { value: 0, label: t("common.days.monday", { defaultValue: "Thứ 2" }) },
    { value: 1, label: t("common.days.tuesday", { defaultValue: "Thứ 3" }) },
    { value: 2, label: t("common.days.wednesday", { defaultValue: "Thứ 4" }) },
    { value: 3, label: t("common.days.thursday", { defaultValue: "Thứ 5" }) },
    { value: 4, label: t("common.days.friday", { defaultValue: "Thứ 6" }) },
    { value: 5, label: t("common.days.saturday", { defaultValue: "Thứ 7" }) },
    { value: 6, label: t("common.days.sunday", { defaultValue: "Chủ nhật" }) },
];

export default function BusinessHourSettings() {
    const { t } = useTranslation("common");
    const { tenant } = useTenant();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hours, setHours] = useState<BusinessHour[]>([]);

    useEffect(() => {
        if (!tenant?.id) return;
        const days = getDaysOfWeek(t);

        const fetchHours = async () => {
            try {
                const data = await tenantService.getBusinessHours(tenant.id);
                // Initialize missing days if needed
                const initializedHours = days.map(day => {
                    const existing = data.find(h => h.dayOfWeek === day.value);
                    if (existing) return existing;
                    return {
                        dayOfWeek: day.value,
                        openTime: "08:00:00",
                        closeTime: "22:00:00",
                        isClosed: false
                    };
                });
                setHours(initializedHours);
            } catch (error) {
                console.error("Failed to fetch business hours:", error);
                message.error(t("dashboard.settings.business.toasts.fetch_error", { defaultValue: "Lỗi tải giờ hoạt động" }));
            } finally {
                setLoading(false);
            }
        };

        fetchHours();
    }, [tenant?.id, t]);

    const handleSave = async () => {
        if (!tenant?.id) return;

        setSaving(true);
        try {
            await tenantService.updateBusinessHours(tenant.id, hours);
            message.success(t("dashboard.settings.business.toasts.update_success", { defaultValue: "Đã cập nhật giờ hoạt động. Các thay đổi sẽ mất vài phút để hiển thị ngoài trang khách." }));
        } catch (error) {
            console.error("Failed to update business hours:", error);
            message.error(t("dashboard.settings.business.toasts.update_error", { defaultValue: "Cập nhật thất bại. Vui lòng thử lại." }));
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateDay = (dayOfWeek: number, updates: Partial<BusinessHour>) => {
        setHours(prev => prev.map(h => {
            if (h.dayOfWeek === dayOfWeek) {
                return { ...h, ...updates };
            }
            return h;
        }));
    };

    const handleApplyAll = (sourceDay: BusinessHour) => {
        setHours(prev => prev.map(h => ({
            ...h,
            openTime: sourceDay.openTime,
            closeTime: sourceDay.closeTime,
            isClosed: sourceDay.isClosed
        })));
        message.success(t("dashboard.settings.business.toasts.apply_all_success", { defaultValue: "Đã áp dụng thời gian này cho tất cả các ngày trong tuần" }));
    };

    const formatTimeForInput = (time: string) => {
        // time comes as "HH:mm:ss" from backend, HTML input expects "HH:mm"
        if (!time) return "08:00";
        return time.substring(0, 5);
    };

    const formatTimeForBackend = (time: string) => {
        return time.length === 5 ? `${time}:00` : time;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <Spin />
            </div>
        );
    }

    return (
        <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                        {t("dashboard.settings.business.title", { defaultValue: "Cấu hình giờ hoạt động & Ngày nghỉ" })}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                        {t("dashboard.settings.business.description", { defaultValue: "Quản lý giờ mở/đóng cửa và các ngày nghỉ trong tuần của nhà hàng. Những tính năng đặt bàn sẽ dựa vào cấu hình này." })}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {getDaysOfWeek(t).map((day: any) => {
                    const currentHour = hours.find(h => h.dayOfWeek === day.value);
                    if (!currentHour) return null;

                    return (
                        <div
                            key={day.value}
                            className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg transition-all"
                            style={{
                                background: currentHour.isClosed ? "var(--surface)" : "var(--surface)",
                                border: `1px solid ${currentHour.isClosed ? 'transparent' : 'var(--border)'}`,
                                opacity: currentHour.isClosed ? 0.7 : 1
                            }}>

                            {/* Day Label */}
                            <div className="w-full sm:w-32 flex items-center gap-3 shrink-0">
                                <div
                                    role="switch"
                                    aria-checked={!currentHour.isClosed}
                                    tabIndex={0}
                                    onClick={() => handleUpdateDay(day.value, { isClosed: !currentHour.isClosed })}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUpdateDay(day.value, { isClosed: !currentHour.isClosed }); } }}
                                    className="w-11 h-6 rounded-full relative transition-colors cursor-pointer flex items-center px-[2px] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                    style={{
                                        backgroundColor: !currentHour.isClosed ? 'var(--primary)' : 'var(--border)',
                                        // add generic fallback if --primary is not defined somehow
                                        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
                                    }}
                                    title={currentHour.isClosed ? t("dashboard.settings.business.status.closed", { defaultValue: "Đang đóng" }) : t("dashboard.settings.business.status.open", { defaultValue: "Đang mở" })}
                                >
                                    <div
                                        className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 flex-shrink-0"
                                        style={{ transform: !currentHour.isClosed ? 'translateX(20px)' : 'translateX(0)' }}
                                    />
                                </div>
                                <span className={`font-medium ${currentHour.isClosed ? 'line-through opacity-70' : ''}`} style={{ color: "var(--text)" }}>
                                    {day.label}
                                </span>
                            </div>

                            {/* Time Controls */}
                            <div className="flex-1 flex items-center gap-2 w-full sm:w-auto">
                                {!currentHour.isClosed ? (
                                    <>
                                        <div className="w-[120px]">
                                            <TimePicker
                                                value={formatTimeForInput(currentHour.openTime)}
                                                onChange={(val) => handleUpdateDay(day.value, { openTime: formatTimeForBackend(val) })}
                                                placeholder={t("dashboard.settings.business.inputs.open", { defaultValue: "Mở cửa" })}
                                            />
                                        </div>
                                        <span style={{ color: "var(--text-muted)" }}>-</span>
                                        <div className="w-[120px]">
                                            <TimePicker
                                                value={formatTimeForInput(currentHour.closeTime)}
                                                onChange={(val) => handleUpdateDay(day.value, { closeTime: formatTimeForBackend(val) })}
                                                placeholder={t("dashboard.settings.business.inputs.close", { defaultValue: "Đóng cửa" })}
                                                minTime={formatTimeForInput(currentHour.openTime)}
                                            />
                                        </div>
                                        {day.value === 0 && (
                                            <button
                                                onClick={() => handleApplyAll(currentHour)}
                                                className="ml-auto px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap hidden sm:block"
                                                style={{ background: "rgba(255, 152, 0, 0.1)", color: "var(--primary)" }}
                                                title={t("dashboard.settings.business.inputs.apply_all_title", { defaultValue: "Áp dụng thời gian của Thứ 2 cho tất cả các ngày khác" })}
                                            >
                                                {t("dashboard.settings.business.inputs.apply_all", { defaultValue: "Áp dụng tất cả" })}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 py-2 text-sm italic w-full text-center sm:text-left" style={{ color: "var(--text-muted)" }}>
                                        {t("dashboard.settings.business.status.day_off", { defaultValue: "Ngày nghỉ / Đóng cửa" })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-6 items-center">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2 text-white rounded-lg font-medium transition-all ${saving ? "opacity-70 cursor-not-allowed" : "hover:scale-105"}`}
                    style={{
                        background: "linear-gradient(to right, var(--primary), var(--primary-hover))",
                    }}>
                    {saving ? t("dashboard.settings.buttons.saving", { defaultValue: "Đang lưu..." }) : t("dashboard.settings.buttons.save_changes", { defaultValue: "Lưu giờ hoạt động" })}
                </button>
            </div>
        </div>
    );
}
