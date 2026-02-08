"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTenant } from "@/lib/contexts/TenantContext";
import { tenantService, TenantConfig } from "@/lib/services/tenantService";
import { message } from "antd";

export default function TenantBrandingSettings() {
    const { t } = useTranslation("common");
    const { tenant, loading: tenantLoading, refreshTenant } = useTenant();
    const [loading, setLoading] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<{
        logoUrl: string;
        backgroundUrl: string;
        logoFile: File | null;
        bannerFile: File | null;
    }>({
        logoUrl: "",
        backgroundUrl: "",
        logoFile: null,
        bannerFile: null,
    });

    // Preview URLs for uploaded files
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [bannerPreview, setBannerPreview] = useState<string>("");

    useEffect(() => {
        if (tenant) {
            setFormData(prev => ({
                ...prev,
                logoUrl: tenant.logoUrl || "",
                backgroundUrl: tenant.backgroundUrl || "",
            }));
            setLogoPreview(tenant.logoUrl || "");
            setBannerPreview(tenant.backgroundUrl || "");
        }
    }, [tenant]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                message.error(t("dashboard.settings.appearance.invalid_image", { defaultValue: "Please select a valid image file" }));
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                message.error(t("dashboard.settings.appearance.file_too_large", { defaultValue: "File size must be less than 5MB" }));
                return;
            }

            setFormData(prev => ({ ...prev, logoFile: file }));

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                message.error(t("dashboard.settings.appearance.invalid_image", { defaultValue: "Please select a valid image file" }));
                return;
            }
            // Validate file size (max 10MB for banner)
            if (file.size > 10 * 1024 * 1024) {
                message.error(t("dashboard.settings.appearance.file_too_large", { defaultValue: "File size must be less than 10MB" }));
                return;
            }

            setFormData(prev => ({ ...prev, bannerFile: file }));

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!tenant) {
            message.warning(t("dashboard.settings.appearance.no_tenant", { defaultValue: "No tenant configuration available" }));
            return;
        }

        setLoading(true);
        try {
            // Check if we have files to upload
            const hasFilesToUpload = formData.logoFile || formData.bannerFile;

            if (hasFilesToUpload) {
                // Use FormData upload - BE will upload to Cloudinary and return URLs
                console.log('[TenantBrandingSettings] Uploading files via FormData...');

                const result = await tenantService.upsertTenantWithFiles(
                    tenant,
                    formData.logoFile,
                    formData.bannerFile,
                    null // faviconFile
                );
                console.log('[TenantBrandingSettings] Upload result:', result);
            } else {
                // No new files, just update tenant data
                console.log('[TenantBrandingSettings] No files to upload, updating tenant data...');
                await tenantService.upsertTenant(tenant);
            }

            message.success(t("dashboard.settings.notifications.success_update", { defaultValue: "Branding updated successfully!" }));

            // Clear file selections after successful save
            setFormData(prev => ({
                ...prev,
                logoFile: null,
                bannerFile: null,
            }));

            // Refresh tenant context to get updated URLs from server
            if (refreshTenant) {
                await refreshTenant();
            }

        } catch (error) {
            console.error("Failed to update branding:", error);
            message.error(t("dashboard.settings.notifications.error_update", { defaultValue: "Failed to update branding" }));
        } finally {
            setLoading(false);
        }
    };

    if (tenantLoading) {
        return <div className="animate-pulse h-40 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;
    }

    return (
        <div
            className="rounded-xl p-6"
            style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
            }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
                {t("dashboard.settings.appearance.branding_title", { defaultValue: "Store Branding" })}
            </h3>

            <div className="space-y-6">
                {/* Logo Section */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.settings.appearance.logo", { defaultValue: "Logo" })}
                    </label>
                    <div className="flex gap-4 items-start">
                        {/* Logo Preview */}
                        <div
                            className="w-24 h-24 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-[#FF380B] group"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                            onClick={() => logoInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="Logo Preview"
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => e.currentTarget.src = "/images/logo/restx-removebg-preview.png"}
                                />
                            ) : (
                                <div className="text-center p-2">
                                    <svg className="w-8 h-8 mx-auto mb-1 text-gray-400 group-hover:text-[#FF380B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-xs text-gray-400 group-hover:text-[#FF380B] transition-colors">
                                        {t("dashboard.settings.appearance.click_upload", { defaultValue: "Click to upload" })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />

                        <div className="flex-1">
                            <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                                {t("dashboard.settings.appearance.logo_help", { defaultValue: "Upload your restaurant logo" })}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {t("dashboard.settings.appearance.logo_format", { defaultValue: "Recommended: 512x512px, PNG or SVG. Max 5MB." })}
                            </p>
                            {formData.logoFile && (
                                <p className="text-xs mt-1 text-green-500">
                                    ✓ {formData.logoFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner Section */}
                <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        {t("dashboard.settings.appearance.banner", { defaultValue: "Banner / Hero Image" })}
                    </label>
                    <div className="space-y-3">
                        {/* Banner Preview */}
                        <div
                            className="w-full h-40 rounded-lg border-2 border-dashed overflow-hidden relative cursor-pointer transition-all hover:border-[#FF380B] group"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                            onClick={() => bannerInputRef.current?.click()}
                        >
                            {bannerPreview ? (
                                <>
                                    <img
                                        src={bannerPreview}
                                        alt="Banner Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.currentTarget.src = "/images/restaurant/banner.png"}
                                    />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-sm font-medium">
                                            {t("dashboard.settings.appearance.click_change", { defaultValue: "Click to change" })}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <svg className="w-12 h-12 mb-2 text-gray-400 group-hover:text-[#FF380B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm text-gray-400 group-hover:text-[#FF380B] transition-colors">
                                        {t("dashboard.settings.appearance.click_upload_banner", { defaultValue: "Click to upload banner image" })}
                                    </span>
                                </div>
                            )}
                        </div>

                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            className="hidden"
                        />

                        <div className="flex justify-between items-center">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {t("dashboard.settings.appearance.banner_format", { defaultValue: "Recommended: 1920x600px, JPG or PNG. Max 10MB." })}
                            </p>
                            {formData.bannerFile && (
                                <p className="text-xs text-green-500">
                                    ✓ {formData.bannerFile.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={handleSave}
                        disabled={loading || (!formData.logoFile && !formData.bannerFile && !tenant)}
                        className={`px-6 py-2 text-white rounded-lg font-medium transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                        style={{ background: 'linear-gradient(to right, #FF380B, #CC2D08)' }}
                    >
                        {loading ? t("dashboard.settings.buttons.saving", { defaultValue: "Saving..." }) : t("dashboard.settings.buttons.save_branding", { defaultValue: "Update Branding" })}
                    </button>
                </div>
            </div>
        </div>
    );
}
